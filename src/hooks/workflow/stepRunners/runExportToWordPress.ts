import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  ContentStepResult,
  ImagePickerResult,
  WordPressStepResult,
} from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runExportToWordPress(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const contentResult = deps.getGeneratedData<ContentStepResult>('contentResult');
  const imagePickerResult = deps.getGeneratedData<ImagePickerResult>('imagePickerResult');

  // Auto-derive WordPress API URL from domain (e.g., example.com -> api-example.roostergrintemplates.com)
  const domainSlug = siteConfig.domain?.replace(/\./g, '-');
  const wordpressApiUrl = siteConfig.wordpressApiUrl ||
    (domainSlug ? `https://api-${domainSlug}.roostergrintemplates.com/wp-json` : null);

  if (!wordpressApiUrl) {
    return { success: false, error: 'WordPress API URL could not be determined - domain is required' };
  }

  const pageData = imagePickerResult?.success && imagePickerResult?.pageData
    ? imagePickerResult.pageData
    : contentResult?.pageData;

  if (!pageData) {
    return { success: false, error: 'No page data available' };
  }

  const endpoint = '/update-wordpress/';
  const payload = {
    wordpress_api_url: wordpressApiUrl,
    pages_data: pageData,
    global_data: contentResult?.globalData || {},
  };

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<WordPressStepResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Exporting to WordPress... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());
    deps.setGeneratedDataWithRef('wordpressResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'WordPress export failed' };
  }
}
