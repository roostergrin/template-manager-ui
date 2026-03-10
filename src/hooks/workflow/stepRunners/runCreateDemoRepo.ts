import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { getGithubTemplateRepo } from '../../../siteTemplates';
import { CreateDemoRepoResult } from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runCreateDemoRepo(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  console.log('[BATCH DEBUG] runCreateDemoRepo START');

  // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
  const siteConfig = deps.getSiteConfigSync();
  console.log('[BATCH DEBUG] runCreateDemoRepo - getSiteConfigSync() returned domain:', siteConfig.domain);

  const deploymentTarget = siteConfig.deploymentTarget || 'demo';

  // Skip if not in demo mode
  if (deploymentTarget !== 'demo') {
    logger.logProcessing('Skipping demo repo - using production deployment');
    return { success: true, data: { skipped: true, message: 'Not needed for production deployment' } };
  }

  // Validate domain before proceeding - catches batch mode race condition
  if (!siteConfig.domain || siteConfig.domain.trim() === '') {
    console.log('[BATCH DEBUG] runCreateDemoRepo - Domain is EMPTY!');
    logger.logProcessing('Domain is empty - state may not have updated yet');
    return {
      success: false,
      error: 'Domain is empty - state may not have updated. This is a batch mode timing issue.',
    };
  }

  // Use the same template as production (roostergrin/ai-template-*), but create in demo-rooster org
  const repoName = domainToSlug(siteConfig.domain);
  console.log('[BATCH DEBUG] runCreateDemoRepo - repoName:', repoName);

  const templateType = siteConfig.templateType || 'json';
  const templateRepoName = getGithubTemplateRepo(siteConfig.template, templateType);
  const endpoint = '/create-demo-repo/';
  const payload = {
    repo_name: repoName,
    description: `Demo site for ${siteConfig.domain}`,
    template_repo: `roostergrin/${templateRepoName}`, // Full owner/repo format (e.g., 'roostergrin/ai-template-stinson')
    is_template: false, // Not a template, just a regular repo
  };

  logger.logProcessing(`Using template: roostergrin/${templateRepoName} -> demo-rooster/${repoName}`);

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<CreateDemoRepoResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Creating demo repo... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());

    if (response.already_existed) {
      logger.logProcessing(`Demo repository already existed: ${response.owner}/${response.repo}`);
    } else {
      logger.logProcessing(`Demo repository newly created: ${response.owner}/${response.repo}`);
    }

    deps.setGeneratedDataWithRef('demoRepoResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Demo repo creation failed' };
  }
}
