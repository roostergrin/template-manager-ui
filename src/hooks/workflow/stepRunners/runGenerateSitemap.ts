import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { ScrapeStepResult, AllocatedSitemapResult, SitemapStepResult } from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runGenerateSitemap(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();
  const scrapeResult = deps.getGeneratedData<ScrapeStepResult>('scrapeResult');
  const allocatedSitemap = deps.getGeneratedData<AllocatedSitemapResult>('allocatedSitemap');

  // Generate sitemap from scraped content, including allocated content if available
  try {
    let endpoint: string;
    let payload: Record<string, unknown>;

    if (scrapeResult?.pages) {
      // Generate from scraped content with strict template mode
      // Backend expects full scrape structure with nested 'pages' key
      endpoint = '/generate-sitemap-from-scraped/';

      // Build sitemap structure from allocatedSitemap if available
      // This mirrors how MigrationWizard's Step3Standard.tsx handles it
      let sitemapToSend: Record<string, unknown> | undefined;

      if (allocatedSitemap?.pages) {
        logger.logProcessing('Including allocated sitemap in generate-sitemap request');

        // Home page only: filter allocated pages to just the Home page
        let allocatedPages = allocatedSitemap.pages;
        if (siteConfig.homePageOnly) {
          const allKeys = Object.keys(allocatedPages);
          const homeKey = allKeys.find(k => k.toLowerCase() === 'home');
          if (homeKey) {
            allocatedPages = { [homeKey]: allocatedPages[homeKey] } as typeof allocatedPages;
            logger.logProcessing(`Home page only: filtered allocated sitemap to 1 page ("${homeKey}") from ${allKeys.length}`);
          }
        }

        const pagesObject: Record<string, unknown> = {};

        Object.entries(allocatedPages).forEach(([pageTitle, pageData]) => {
          pagesObject[pageTitle] = {
            internal_id: pageData.page_id,
            page_id: pageData.page_id,
            title: pageData.title,
            model_query_pairs: pageData.model_query_pairs || [],
            allocated_markdown: pageData.allocated_markdown,
            source_location: pageData.source_location,
            allocation_confidence: pageData.allocation_confidence,
          };
        });

        sitemapToSend = {
          pages: pagesObject,
          siteType: siteConfig.siteType,
        };

        logger.logProcessing(`Built sitemap with ${Object.keys(pagesObject).length} pages containing allocated content`);
      }

      payload = {
        scraped_content: {
          pages: scrapeResult.pages,
          global_markdown: scrapeResult.global_markdown,
          style_overview: scrapeResult.style_overview,
        },
        site_type: siteConfig.siteType,
        strict_template_mode: true,
        ...(sitemapToSend && { sitemap: sitemapToSend }),
      };
    } else if (allocatedSitemap?.pages) {
      // No scrape data but we have allocated sitemap (e.g., user imported a vector store)
      // Pass through the allocated sitemap as the sitemap result — no API call needed
      logger.logProcessing('No scrape data available, using allocated sitemap directly as sitemap result');

      // Home page only: filter to just the Home page
      let passThroughPages = allocatedSitemap.pages;
      if (siteConfig.homePageOnly) {
        const allKeys = Object.keys(passThroughPages);
        const homeKey = allKeys.find(k => k.toLowerCase() === 'home');
        if (homeKey) {
          passThroughPages = { [homeKey]: passThroughPages[homeKey] } as typeof passThroughPages;
          logger.logProcessing(`Home page only: filtered pass-through sitemap to 1 page ("${homeKey}") from ${allKeys.length}`);
        }
      }

      const pageCount = Object.keys(passThroughPages).length;
      logger.logProcessing(`Passing through ${pageCount} allocated pages as sitemapResult`);

      const sitemapResult = { pages: passThroughPages } as SitemapStepResult;
      deps.setGeneratedDataWithRef('sitemapResult', sitemapResult);
      return { success: true, data: sitemapResult };
    } else {
      return { success: false, error: 'No scraped content or allocated sitemap available for sitemap generation' };
    }

    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<SitemapStepResult>(
      endpoint.replace(/\/$/, '') + '/start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Generating sitemap... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());
    const responseObj = response as Record<string, unknown>;
    const success = isResponseSuccessful(responseObj);
    if (success) {
      deps.setGeneratedDataWithRef('sitemapResult', response);
    }
    return {
      success,
      data: response,
      ...(!success && { error: typeof responseObj.error === 'string' ? responseObj.error : (responseObj.message as string) || 'Sitemap generation returned unsuccessful response' }),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Sitemap generation failed' };
  }
}
