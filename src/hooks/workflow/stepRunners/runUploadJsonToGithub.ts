import apiClient, { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  CreateGithubRepoResult,
  CreateDemoRepoResult,
  ImagePickerResult,
  ContentStepResult,
  ThemeStepResult,
  GithubJsonUploadResult,
} from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runUploadJsonToGithub(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const templateType = siteConfig.templateType || 'json';

  // Skip if using WordPress template (rg-template-*)
  if (templateType === 'wordpress') {
    logger.logProcessing('Skipping JSON upload - using WordPress template');
    return { success: true, data: { skipped: true, message: 'Not needed for WordPress templates' } as GithubJsonUploadResult };
  }

  // Check for edited input data first
  const editedInput = deps.editedInputDataRef.current['upload-json-to-github'] as {
    pages?: Record<string, unknown>;
    globalData?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    config?: { owner?: string; repo?: string; branch?: string };
  } | undefined;

  let owner: string;
  let repo: string;
  let branch: string;
  let pageData: Record<string, unknown> | undefined;
  let globalData: Record<string, unknown>;
  let themeToUpload: Record<string, unknown> | undefined;
  let usingEditedData = false;

  // Check deployment target to determine which repo result to use
  const deploymentTarget = siteConfig.deploymentTarget || 'demo';
  const isDemoMode = deploymentTarget === 'demo';

  if (editedInput) {
    logger.logProcessing('Using edited input data from pre-step editor');
    usingEditedData = true;

    // Get config from edited input or fall back to generated data
    const githubRepoResult = deps.getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
    const demoRepoResult = deps.getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
    const repoResult = isDemoMode ? demoRepoResult : githubRepoResult;
    owner = editedInput.config?.owner || repoResult?.owner || (isDemoMode ? 'demo-rooster' : 'roostergrin');
    repo = editedInput.config?.repo || repoResult?.repo || '';
    branch = editedInput.config?.branch || 'master';

    pageData = editedInput.pages;
    globalData = editedInput.globalData || {};
    themeToUpload = editedInput.theme;
  } else {
    // Get GitHub repo info from appropriate step based on deployment target
    const githubRepoResult = deps.getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
    const demoRepoResult = deps.getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
    const repoResult = isDemoMode ? demoRepoResult : githubRepoResult;

    // In demo mode, derive repo name from domain if demoRepoResult not available
    if (!repoResult?.repo) {
      if (isDemoMode) {
        // Fallback: derive repo name from domain (same logic as create-demo-repo step)
        const derivedRepoName = domainToSlug(siteConfig.domain);
        owner = 'demo-rooster';
        repo = derivedRepoName;
        branch = 'master';
        logger.logProcessing(`Using derived repo name for demo mode: ${owner}/${repo}`);

        // Check if the repo actually exists before proceeding
        logger.logProcessing(`Checking if repository ${owner}/${repo} exists...`);
        try {
          const checkResponse = await apiClient.post<{ exists: boolean; message?: string }>('/check-github-repo/', {
            owner,
            repo
          });

          if (!checkResponse.exists) {
            return {
              success: false,
              error: `Repository ${owner}/${repo} does not exist. Please run the create-demo-repo step first, or create the repo manually.`
            };
          }
          logger.logProcessing(`Repository ${owner}/${repo} exists, proceeding with upload`);
        } catch (checkError) {
          logger.logWarning(`Could not verify repo existence: ${checkError}. Proceeding anyway...`);
        }
      } else {
        return { success: false, error: 'No GitHub repository information available' };
      }
    } else {
      owner = repoResult.owner || (isDemoMode ? 'demo-rooster' : 'roostergrin');
      repo = repoResult.repo;
      branch = 'master';
    }

    // Get page data - prefer hotlink-processed pages (has CloudFront URLs), then image picker, then content
    const hotlinkPages = deps.getGeneratedData<Record<string, unknown>>('hotlinkPagesResult');
    const imagePickerResult = deps.getGeneratedData<ImagePickerResult>('imagePickerResult');
    const contentResult = deps.getGeneratedData<ContentStepResult>('contentResult');

    pageData = hotlinkPages ||
      (imagePickerResult?.success && imagePickerResult?.pageData ? imagePickerResult.pageData : null) ||
      contentResult?.pageData || contentResult?.pages;

    if (hotlinkPages) {
      logger.logProcessing('Using pages with CloudFront URLs from hotlink step');
    }

    // Get globalData - prefer hotlink-processed (has CloudFront URLs), then content result
    const hotlinkGlobalData = deps.getGeneratedData<Record<string, unknown>>('hotlinkGlobalDataResult');
    globalData = hotlinkGlobalData || (contentResult?.globalData as Record<string, unknown>) || {};

    if (hotlinkGlobalData) {
      logger.logProcessing('Using globalData with CloudFront URLs from hotlink step');
    }

    // Get theme data - prefer updated theme from hotlink step (has CloudFront URLs)
    const hotlinkTheme = deps.getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
    const themeResult = deps.getGeneratedData<ThemeStepResult>('themeResult');
    themeToUpload = hotlinkTheme || (themeResult?.theme as Record<string, unknown> | undefined);
  }

  if (!repo) {
    return { success: false, error: 'No GitHub repository specified' };
  }

  if (!pageData) {
    return { success: false, error: 'No page data available for JSON upload' };
  }

  logger.logProcessing(`Uploading JSON to GitHub repo: ${owner}/${repo} (branch: ${branch})`);
  if (usingEditedData) {
    logger.logProcessing('Data source: edited input from pre-step editor');
  }

  try {
    // Upload pages.json
    const pagesEndpoint = '/update-github-repo-file/';
    const pagesPayload = {
      owner,
      repo,
      file_path: 'data/pages.json',
      file_content: JSON.stringify(pageData, null, 2),
      message: 'Update pages.json from workflow',
      branch,
    };

    logger.logApiRequest(pagesEndpoint, { ...pagesPayload, file_content: `[${Object.keys(pageData).length} pages]` });
    const pagesTimer = createTimer();

    const pagesResponse = await startAndPollAsyncJob<{ success: boolean; content?: { html_url?: string } }>(
      pagesEndpoint + 'start/',
      pagesPayload,
      { onProgress: (s) => logger.logProcessing(`Uploading pages.json... (${s}s)`) },
    );
    logger.logApiResponse(pagesResponse, pagesTimer.elapsed());

    if (!isResponseSuccessful(pagesResponse as Record<string, unknown>)) {
      return { success: false, error: 'Failed to upload pages.json' };
    }

    // Upload globalData.json
    const globalPayload = {
      owner,
      repo,
      file_path: 'data/globalData.json',
      file_content: JSON.stringify(globalData, null, 2),
      message: 'Update globalData.json from workflow',
      branch,
    };

    logger.logApiRequest(pagesEndpoint, { ...globalPayload, file_content: `[global data object]` });
    const globalTimer = createTimer();

    const globalResponse = await startAndPollAsyncJob<{ success: boolean; content?: { html_url?: string } }>(
      pagesEndpoint + 'start/',
      globalPayload,
      { onProgress: (s) => logger.logProcessing(`Uploading globalData.json... (${s}s)`) },
    );
    logger.logApiResponse(globalResponse, globalTimer.elapsed());

    if (!isResponseSuccessful(globalResponse as Record<string, unknown>)) {
      return { success: false, error: 'Failed to upload globalData.json' };
    }

    // Upload theme.json (themeToUpload is already computed above from edited data or generated data)
    let themeJsonUrl: string | undefined;

    if (themeToUpload) {
      if (!usingEditedData) {
        const hotlinkTheme = deps.getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
        if (hotlinkTheme) {
          logger.logProcessing('Using theme with CloudFront URLs from hotlink step');
        }
      }

      const themePayload = {
        owner,
        repo,
        file_path: 'data/theme.json',
        file_content: JSON.stringify(themeToUpload, null, 2),
        message: 'Update theme.json from workflow',
        branch,
      };

      logger.logApiRequest(pagesEndpoint, { ...themePayload, file_content: '[theme object]' });
      const themeTimer = createTimer();

      const themeResponse = await startAndPollAsyncJob<{ success: boolean; content?: { html_url?: string } }>(
        pagesEndpoint + 'start/',
        themePayload,
        { onProgress: (s) => logger.logProcessing(`Uploading theme.json... (${s}s)`) },
      );
      logger.logApiResponse(themeResponse, themeTimer.elapsed());

      if (!isResponseSuccessful(themeResponse as Record<string, unknown>)) {
        return { success: false, error: 'Failed to upload theme.json' };
      }

      themeJsonUrl = `https://github.com/${owner}/${repo}/blob/${branch}/data/theme.json`;
    } else {
      logger.logProcessing('No theme data available, skipping theme.json upload');
    }

    const result: GithubJsonUploadResult = {
      success: true,
      pagesJsonUrl: `https://github.com/${owner}/${repo}/blob/${branch}/data/pages.json`,
      globalDataJsonUrl: `https://github.com/${owner}/${repo}/blob/${branch}/data/globalData.json`,
      themeJsonUrl,
    };

    deps.setGeneratedDataWithRef('githubJsonResult', result);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'JSON upload to GitHub failed' };
  }
}
