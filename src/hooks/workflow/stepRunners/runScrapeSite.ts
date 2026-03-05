import apiClient from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { ScrapeStepResult } from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runScrapeSite(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
  const siteConfig = deps.actions.getSiteConfigSync();
  console.log('[BATCH DEBUG] runScrapeSite - siteConfig.scrapeDomain:', siteConfig.scrapeDomain);

  if (!siteConfig.scrapeDomain) {
    return { success: false, error: 'Scrape domain is required' };
  }

  const payload = {
    domain: siteConfig.scrapeDomain,
    use_selenium: true,
    scroll: true,
    max_pages: siteConfig.maxScrapePages ?? 50,
    use_firecrawl: siteConfig.useFirecrawl ?? true,
  };

  try {
    // Use async start + poll pattern to avoid Lightsail 60s LB timeout
    const startEndpoint = '/scrape-site/start/';
    logger.logApiRequest(startEndpoint, payload);
    const apiTimer = createTimer();

    const startResponse = await apiClient.post<{ job_id: string; status: string }>(startEndpoint, payload);
    const jobId = startResponse.job_id;
    logger.logProcessing(`Scrape job started: ${jobId}`);

    // Poll for results every 5 seconds
    const POLL_INTERVAL = 5000;
    const MAX_POLL_TIME = 1800000; // 30 minute max
    const pollStart = Date.now();

    while (Date.now() - pollStart < MAX_POLL_TIME) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

      const statusResponse = await apiClient.get<{ status: string; result?: ScrapeStepResult; error?: string }>(
        `/scrape-site/status/${jobId}`
      );

      if (statusResponse.status === 'complete' && statusResponse.result) {
        const response = statusResponse.result;
        logger.logApiResponse(response, apiTimer.elapsed());
        console.log('[DEBUG] runScrapeSite - response.pages:', response?.pages ? 'present' : 'missing');

        // Check for empty scrape results
        const hasPages = response?.pages && Object.keys(response.pages).length > 0;
        if (!hasPages) {
          logger.logProcessing('WARNING: Scrape returned no pages');
          deps.setGeneratedDataWithRef('scrapeResult', response);
          return { success: false, error: 'EMPTY_SCRAPE: No pages found in scrape results', data: response };
        }

        deps.setGeneratedDataWithRef('scrapeResult', response);
        return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
      }

      if (statusResponse.status === 'error') {
        return { success: false, error: statusResponse.error || 'Scrape failed on server' };
      }

      // Still running — log progress
      const elapsed = Math.round(apiTimer.elapsed() / 1000);
      logger.logProcessing(`Scraping in progress... (${elapsed}s)`);
    }

    return { success: false, error: 'Scrape timed out after 10 minutes' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Scrape failed' };
  }
}
