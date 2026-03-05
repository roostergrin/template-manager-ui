import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { ScrapeStepResult, VectorStoreResult } from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runCreateVectorStore(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
  const siteConfig = deps.actions.getSiteConfigSync();
  const scrapeResult = deps.getGeneratedData<ScrapeStepResult>('scrapeResult');

  // Debug logging
  console.log('[DEBUG] runCreateVectorStore - scrapeResult:', scrapeResult);
  console.log('[DEBUG] runCreateVectorStore - scrapeResult?.pages:', scrapeResult?.pages ? 'present' : 'missing');

  // Check for edited input data (from "Edit" button in manual mode)
  const editedInput = deps.editedInputDataRef.current['create-vector-store'];
  let pages = scrapeResult?.pages;
  const globalMarkdown = scrapeResult?.global_markdown;
  const styleOverview = scrapeResult?.style_overview;

  if (editedInput !== undefined) {
    logger.logProcessing('Using edited input data for vector store');
    pages = editedInput as typeof pages;
    delete deps.editedInputDataRef.current['create-vector-store'];
    deps.actions.clearEditedInputData();
  }

  if (!pages) {
    console.log('[DEBUG] runCreateVectorStore - FAILING: No pages in scrape result');
    return { success: false, error: 'No scraped content available for vector store' };
  }

  const endpoint = '/create-vector-store/';
  // Backend expects scraped_content with nested 'pages' key
  const payload = {
    domain: siteConfig.scrapeDomain || siteConfig.domain,
    scraped_content: {
      pages,
      global_markdown: globalMarkdown,
      style_overview: styleOverview,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    logger.logApiRequest(endpoint, { ...payload, scraped_content: '[truncated]' });
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<VectorStoreResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Creating vector store... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());
    deps.setGeneratedDataWithRef('vectorStoreResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Vector store creation failed' };
  }
}
