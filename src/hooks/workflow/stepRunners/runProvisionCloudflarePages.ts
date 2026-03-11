import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { CreateDemoRepoResult, ProvisionCloudflarePageResult } from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runProvisionCloudflarePages(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
  const siteConfig = deps.getSiteConfigSync();
  const deploymentTarget = siteConfig.deploymentTarget || 'demo';

  // Skip if not in demo mode
  if (deploymentTarget !== 'demo') {
    logger.logProcessing('Skipping Cloudflare Pages - using production deployment');
    return { success: true, data: { skipped: true, message: 'Not needed for production deployment' } };
  }

  // Get the demo repo result
  const demoRepoResult = deps.getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
  if (!demoRepoResult?.repo) {
    return { success: false, error: 'Demo repository must be created first' };
  }

  const endpoint = '/provision-cloudflare-pages/';
  const projectName = domainToSlug(siteConfig.domain);
  const payload = {
    project_name: projectName,
    repo_name: demoRepoResult.repo,
    repo_owner: demoRepoResult.owner || 'demo-rooster',
    build_command: 'npm run generate',
    build_output_dir: 'dist',
    node_version: '14',
  };

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<ProvisionCloudflarePageResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Provisioning Cloudflare Pages... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());

    if (response.already_existed) {
      logger.logProcessing(`Cloudflare Pages project already existed: ${projectName}`);
    } else {
      logger.logProcessing(`Cloudflare Pages project newly created: ${projectName}`);
    }

    deps.setGeneratedDataWithRef('cloudflarePagesResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Cloudflare Pages provisioning failed' };
  }
}
