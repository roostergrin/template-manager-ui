import apiClient from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { SecondPassResult } from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runSecondPass(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();

  // Auto-derive WordPress API URL from domain (e.g., example.com -> api-example.roostergrintemplates.com)
  const domainSlug = siteConfig.domain?.replace(/\./g, '-');
  const wordpressApiUrl = siteConfig.wordpressApiUrl ||
    (domainSlug ? `https://api-${domainSlug}.roostergrintemplates.com/wp-json` : null);

  if (!wordpressApiUrl) {
    return { success: false, error: 'WordPress API URL could not be determined - domain is required' };
  }

  const endpoint = '/wordpress-second-pass/';
  const payload = {
    wordpress_api_url: wordpressApiUrl,
    fix_ids: true,
    fix_accessibility: true,
    fix_image_sizes: true,
  };

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await apiClient.post<SecondPassResult>(endpoint, payload);

    logger.logApiResponse(response, apiTimer.elapsed());
    deps.setGeneratedDataWithRef('secondPassResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Second pass failed' };
  }
}
