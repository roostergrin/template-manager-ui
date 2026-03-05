import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  ScrapeStepResult,
  SitemapStepResult,
  AllocatedSitemapResult,
  ContentStepResult,
} from '../../../types/UnifiedWorkflowTypes';
import { createPreserveImageMap, injectPreserveImageIntoContent } from '../../../utils/imagePreservation/injectPreserveImage';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runGenerateContent(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();
  const sitemapResult = deps.getGeneratedData<SitemapStepResult>('sitemapResult');
  const allocatedSitemap = deps.getGeneratedData<AllocatedSitemapResult>('allocatedSitemap');

  // Use sitemapResult as primary source (it now contains allocated content + preserve_image)
  // Note: sitemapResult has structure {sitemap_data: {pages: ...}, saved_path: ...}
  // Fall back to allocatedSitemap if generate-sitemap was skipped
  const sitemapPages = sitemapResult?.sitemap_data?.pages || sitemapResult?.pages;
  const pages = sitemapPages || allocatedSitemap?.pages;

  if (!pages) {
    return { success: false, error: 'No sitemap data available' };
  }

  // Home page only: filter to just the Home page if enabled
  let filteredPages = pages;
  if (siteConfig.homePageOnly && pages) {
    const allKeys = Object.keys(pages as Record<string, unknown>);
    const homeKey = allKeys.find(k => k.toLowerCase() === 'home');
    if (homeKey) {
      filteredPages = { [homeKey]: (pages as Record<string, unknown>)[homeKey] } as typeof pages;
      logger.logProcessing(`Home page only: generating 1 page ("${homeKey}") from ${allKeys.length} available`);
    } else {
      logger.logProcessing('Home page only: no "Home" key found, using all pages');
    }
  }

  // Log which source we're using
  if (sitemapPages) {
    logger.logProcessing('Using sitemapResult as primary source (contains allocated content + preserve_image)');
    // Debug: log sample page to verify preserve_image is present
    const samplePage = Object.values(pages)[0] as Record<string, unknown>;
    if (samplePage?.model_query_pairs) {
      const pairs = samplePage.model_query_pairs as Array<Record<string, unknown>>;
      logger.logProcessing(`Sample page has ${pairs.length} model_query_pairs, first preserve_image: ${pairs[0]?.preserve_image}`);
    }
  } else if (allocatedSitemap?.pages) {
    logger.logProcessing('Using allocatedSitemap as fallback (generate-sitemap may have been skipped)');
  }

  // Build questionnaire data from pages (allocated_markdown is now in pages from sitemapResult)
  const questionnaireData: Record<string, unknown> = {};
  const pagesForQuestionnaire = filteredPages as Record<string, unknown>;
  Object.entries(pagesForQuestionnaire).forEach(([pageId, page]) => {
    const pageData = page as Record<string, unknown>;
    if (pageData.allocated_markdown) {
      questionnaireData[pageId] = {
        allocated_markdown: pageData.allocated_markdown,
        source_location: pageData.source_location,
        allocation_confidence: pageData.allocation_confidence,
      };
    }
  });

  // Build sitemap_metadata from pages (depth, slug, parent_slug)
  // This ensures the backend returns proper sitemap_metadata in the response
  const sitemap_metadata: Record<string, { depth: number; slug?: string; parent_slug?: string }> = {};
  const pagesRecord = filteredPages as Record<string, unknown>;
  Object.entries(pagesRecord).forEach(([pageTitle, pageData], index) => {
    const pageObj = pageData as Record<string, unknown>;
    // Generate slug from page title (lowercase, replace spaces with hyphens)
    const slug = pageTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Extract depth from page data if available, otherwise use 0 for top-level
    const depth = typeof pageObj?.depth === 'number' ? pageObj.depth : 0;
    const parentSlug = typeof pageObj?.parent_slug === 'string' ? pageObj.parent_slug : undefined;

    sitemap_metadata[pageTitle] = {
      depth,
      slug: slug || `page-${index}`,
      ...(parentSlug && { parent_slug: parentSlug }),
    };
  });

  logger.logProcessing(`Built sitemap_metadata for ${Object.keys(sitemap_metadata).length} pages`);

  const contentEndpoint = '/generate-content-for-scraped/';
  const contentPayload = {
    sitemap_data: {
      pages: filteredPages,
      questionnaireData,
      sitemap_metadata,
    },
    site_type: siteConfig.siteType,
    assign_images: false,  // Disabled - image assignment handled by separate image-picker step
    use_site_pool: true,
    model: siteConfig.contentModel || 'gpt-5-mini',
  };

  const globalEndpoint = '/generate-global/';
  // Get scraped content to pass global_markdown and social_links for extraction
  const scrapeResult = deps.getGeneratedData<ScrapeStepResult>('scrapeResult');
  const globalPayload = {
    sitemap_data: {
      questionnaireData,
    },
    site_type: siteConfig.siteType,
    model: siteConfig.contentModel || 'gpt-5-mini',
    // Pass scraped content so backend can extract all social links
    scraped_content: scrapeResult ? {
      global_markdown: scrapeResult.global_markdown,
      pages: scrapeResult.pages,
      social_links: scrapeResult.social_links,
    } : undefined,
  };

  try {
    logger.logProcessing('Generating content and global data in parallel...');
    const apiTimer = createTimer();

    // Call both endpoints in parallel via async jobs
    const [contentResponse, globalResponse] = await Promise.all([
      startAndPollAsyncJob<ContentStepResult>(
        contentEndpoint + 'start/',
        contentPayload,
        { onProgress: (s) => logger.logProcessing(`Generating page content... (${s}s)`) },
      ),
      startAndPollAsyncJob<Record<string, unknown>>(
        globalEndpoint + 'start/',
        globalPayload,
        { onProgress: (s) => logger.logProcessing(`Generating global data... (${s}s)`) },
      ),
    ]);

    logger.logApiResponse({ content: contentResponse, global: globalResponse }, apiTimer.elapsed());

    // Inject preserve_image from sitemap into generated content
    // This ensures preserve_image is applied even if the backend loses it
    const pagesForMap = Object.entries(pages).map(([title, pageData]) => {
      const data = pageData as Record<string, unknown>;
      return {
        id: (data.internal_id as string) || title,
        title: title,
        wordpress_id: data.page_id as string,
        items: ((data.model_query_pairs as Array<Record<string, unknown>>) || []).map(item => ({
          id: (item.internal_id as string) || '',
          model: item.model as string,
          query: item.query as string,
          preserve_image: item.preserve_image as boolean | undefined,
        })),
      };
    });

    const preserveImageMap = createPreserveImageMap(pagesForMap);
    logger.logProcessing(`Created preserve_image map for ${preserveImageMap.size} pages`);

    // Log which pages/items have preserve_image
    for (const [pageKey, itemMap] of preserveImageMap.entries()) {
      for (const [idx, value] of itemMap.entries()) {
        if (value) {
          logger.logProcessing(`  📸 ${pageKey} section ${idx}: preserve_image=true`);
        }
      }
    }

    // Inject into generated content
    const generatedPages = contentResponse.pages || contentResponse;
    const pagesWithPreserveImage = injectPreserveImageIntoContent(
      generatedPages as Record<string, unknown[]>,
      preserveImageMap
    );

    // Log injection results
    for (const [pageKey, components] of Object.entries(pagesWithPreserveImage)) {
      if (Array.isArray(components)) {
        components.forEach((comp: Record<string, unknown>, idx: number) => {
          if (comp.preserve_image) {
            logger.logProcessing(`  ✅ Injected preserve_image=true: ${pageKey} component ${idx}`);
          }
        });
      }
    }

    // Merge global data into content result with injected preserve_image
    const mergedResult: ContentStepResult = {
      ...contentResponse,
      pages: pagesWithPreserveImage,
      globalData: globalResponse,
    };

    deps.setGeneratedDataWithRef('contentResult', mergedResult);
    return { success: isResponseSuccessful(contentResponse as Record<string, unknown>), data: mergedResult };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Content generation failed' };
  }
}
