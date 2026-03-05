import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { ProvisionStepResult } from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runProvisionSite(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();
  const endpoint = '/provision/';
  const payload = {
    bucket_name: domainToSlug(siteConfig.domain),
    github_owner: 'roostergrin',
    github_repo: domainToSlug(siteConfig.domain),
    github_branch: 'master',
    page_type: 'template',
  };

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<ProvisionStepResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Provisioning site... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());
    deps.setGeneratedDataWithRef('provisionResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Provision failed' };
  }
}
