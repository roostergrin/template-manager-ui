import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { modelGroups } from '../../../siteTemplates';
import {
  ScrapeStepResult,
  VectorStoreResult,
  AllocatedSitemapResult,
  AllocationSummary,
} from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runAllocateContent(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const scrapeResult = deps.getGeneratedData<ScrapeStepResult>('scrapeResult');
  let vectorStoreResult = deps.getGeneratedData<VectorStoreResult>('vectorStoreResult');

  console.log('[runAllocateContent] vectorStoreResult from ref:', vectorStoreResult);
  console.log('[runAllocateContent] scrapeResult from ref:', scrapeResult ? 'exists' : 'undefined');

  // Check for edited input data (user can paste a vector_store_id to use an existing store)
  const editedInput = deps.editedInputDataRef.current['allocate-content'] as Record<string, unknown> | undefined;
  console.log('[runAllocateContent] editedInput:', editedInput);
  if (editedInput !== undefined) {
    logger.logProcessing('Using edited vector store data');
    // Accept either the full object or just {vector_store_id: "..."}
    const editedVectorStoreId = editedInput.vector_store_id as string | undefined;
    if (editedVectorStoreId) {
      vectorStoreResult = { success: true, vector_store_id: editedVectorStoreId };
      // Also store it in generatedData so downstream steps can use it
      deps.setGeneratedDataWithRef('vectorStoreResult', vectorStoreResult);
    }
    delete deps.editedInputDataRef.current['allocate-content'];
    deps.clearEditedInputData();
  }

  // Handle nested data shape: user may paste {pages: {vector_store_id: "..."}} from a file export
  if (!vectorStoreResult?.vector_store_id && vectorStoreResult) {
    const nested = (vectorStoreResult as Record<string, unknown>).pages as Record<string, unknown> | undefined;
    if (nested?.vector_store_id) {
      console.log('[runAllocateContent] Found vector_store_id nested under .pages, unwrapping');
      vectorStoreResult = nested as VectorStoreResult;
      // Fix the stored data so downstream steps get the right shape
      deps.setGeneratedDataWithRef('vectorStoreResult', vectorStoreResult);
    }
  }

  console.log('[runAllocateContent] final vectorStoreResult:', vectorStoreResult);
  console.log('[runAllocateContent] vector_store_id:', vectorStoreResult?.vector_store_id);
  if (!vectorStoreResult?.vector_store_id) {
    return { success: false, error: 'No vector store available for content allocation' };
  }

  // Get the default sitemap from the selected template
  // Map template name to model group key
  const templateToModelGroup: Record<string, string> = {
    'stinson': 'New Stinson',
    'haightashbury': 'Haight Ashbury',
    'bayarea': 'Bay Area Orthodontics',
    'bayareaortho': 'Bay Area Orthodontics',
    'calistoga': 'Calistoga',
    'pismo': 'Pismo Beach',
    'eureka': 'Eureka',
    'shasta': 'Shasta',
    'sonoma': 'Sonoma',
  };

  const modelGroupKey = templateToModelGroup[siteConfig.template?.toLowerCase() || 'stinson'] || 'New Stinson';
  const modelGroup = modelGroups[modelGroupKey];
  const defaultSitemap = modelGroup?.templates?.[0]?.data;

  if (!defaultSitemap?.pages) {
    return { success: false, error: `No default sitemap found for template: ${siteConfig.template}` };
  }

  // Home page only: filter the template sitemap to just the Home page
  let sitemapPages = defaultSitemap.pages as Record<string, unknown>;
  if (siteConfig.homePageOnly) {
    const allKeys = Object.keys(sitemapPages);
    const homeKey = allKeys.find(k => k.toLowerCase() === 'home');
    if (homeKey) {
      sitemapPages = { [homeKey]: sitemapPages[homeKey] };
      logger.logProcessing(`Home page only: using 1 page ("${homeKey}") from ${allKeys.length} in template`);
    } else {
      logger.logProcessing('Home page only: no "Home" key found in template, using all pages');
    }
  }

  logger.logProcessing('Using default sitemap from template', {
    template: siteConfig.template,
    modelGroup: modelGroupKey,
    pageCount: Object.keys(sitemapPages).length,
  });

  // Build pages object with model_query_pairs for second pass allocation
  // This matches the format used by Step3Standard's "Allocate Markdown" button
  const pagesObject: Record<string, unknown> = {};
  Object.entries(sitemapPages).forEach(([pageKey, page]: [string, unknown]) => {
    const pageData = page as Record<string, unknown>;
    const pageTitle = (pageData.title as string) || pageKey;
    pagesObject[pageTitle] = {
      page_id: pageKey,
      title: pageTitle,
      model_query_pairs: pageData.model_query_pairs || pageData.items || [],
    };
  });

  // Use second pass allocation endpoint which queries vector store
  const endpoint = '/allocate-content-second-pass/';
  const payload = {
    sitemap: { pages: pagesObject },
    vector_store_id: vectorStoreResult.vector_store_id,
    site_type: siteConfig.template,
  };

  try {
    logger.logApiRequest(endpoint, { ...payload, sitemap: `[${Object.keys(pagesObject).length} pages]` });
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<{
      success: boolean;
      enhanced_sitemap: AllocatedSitemapResult;
      summary: AllocationSummary;
      message?: string;
    }>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Allocating content... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());

    // Store allocated sitemap and summary for sitemap generation
    deps.setGeneratedDataWithRef('allocatedSitemap', response.enhanced_sitemap);
    deps.setGeneratedDataWithRef('allocationSummary', response.summary);

    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Content allocation failed' };
  }
}
