import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { getGithubTemplateRepo } from '../../../modelGroups';
import { CreateGithubRepoResult } from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runCreateGithubRepo(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  console.log('[BATCH DEBUG] runCreateGithubRepo START');
  console.log('[BATCH DEBUG] typeof actions.getSiteConfigSync:', typeof deps.actions.getSiteConfigSync);

  // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
  const siteConfig = deps.actions.getSiteConfigSync();
  console.log('[BATCH DEBUG] getSiteConfigSync() returned domain:', siteConfig.domain);
  console.log('[BATCH DEBUG] getSiteConfigSync() returned full config:', JSON.stringify(siteConfig));

  // Validate domain before proceeding - catches batch mode race condition
  if (!siteConfig.domain || siteConfig.domain.trim() === '') {
    console.log('[BATCH DEBUG] Domain is EMPTY! Full siteConfig:', siteConfig);
    logger.logProcessing('Domain is empty - state may not have updated yet');
    return {
      success: false,
      error: 'Domain is empty - state may not have updated. This is a batch mode timing issue.',
    };
  }

  const repoName = domainToSlug(siteConfig.domain);
  console.log('[BATCH DEBUG] repoName:', repoName);
  console.log('[BATCH DEBUG] Full payload about to send:', {
    new_name: repoName,
    template_repo: getGithubTemplateRepo(siteConfig.template, siteConfig.templateType || 'json'),
  });
  const templateType = siteConfig.templateType || 'json';
  const templateRepo = getGithubTemplateRepo(siteConfig.template, templateType);
  const endpoint = '/create-github-repo-from-template/';
  const payload = {
    new_name: repoName,
    template_repo: templateRepo, // Backend adds roostergrin/ prefix
  };

  logger.logProcessing(`Using ${templateType} template: ${templateRepo}`);

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<CreateGithubRepoResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Creating repo... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());

    if (response.already_existed) {
      logger.logProcessing(`Repository already existed: ${response.owner}/${response.repo}`);
    } else {
      logger.logProcessing(`Repository newly created: ${response.owner}/${response.repo}`);
    }

    deps.setGeneratedDataWithRef('githubRepoResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'GitHub repo creation failed' };
  }
}
