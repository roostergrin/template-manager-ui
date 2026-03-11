import { startAndPollAsyncJobForm } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  CreateGithubRepoResult,
  ThemeStepResult,
  FaviconUploadResult,
} from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps } from './stepRunnerTypes';

export async function runUploadFavicon(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const templateType = siteConfig.templateType || 'json';

  // Get theme - prefer hotlink-updated version with CloudFront URLs
  const hotlinkTheme = deps.getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
  const themeResult = deps.getGeneratedData<ThemeStepResult>('themeResult');
  const theme = hotlinkTheme || themeResult?.theme;

  if (!theme) {
    return { success: false, error: 'No theme data available' };
  }

  // Get favicon URL from theme
  const themeDefault = (theme as { default?: Record<string, unknown> })?.default || theme;
  const faviconUrl = (themeDefault as { favicon_url?: string })?.favicon_url;

  if (!faviconUrl) {
    logger.logProcessing('No favicon in theme, skipping');
    return { success: true, data: { skipped: true, message: 'No favicon to upload' } };
  }

  // For WordPress templates, just return the URL (WordPress handles it)
  if (templateType === 'wordpress') {
    logger.logProcessing('WordPress template - favicon handled by WordPress');
    return { success: true, data: { faviconUrl } as FaviconUploadResult };
  }

  // For JSON templates, upload to GitHub
  const githubRepoResult = deps.getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
  if (!githubRepoResult?.repo) {
    return { success: false, error: 'No GitHub repository information available' };
  }

  const owner = githubRepoResult.owner || 'roostergrin';
  const repo = githubRepoResult.repo;

  logger.logProcessing(`Uploading favicon to GitHub: ${owner}/${repo}`);

  try {
    // Download the favicon image
    const response = await fetch(faviconUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to download favicon: ${response.statusText}` };
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Determine file extension from URL or content type
    const contentType = blob.type || 'image/x-icon';
    const ext = faviconUrl.includes('.ico') ? 'ico' : contentType.includes('png') ? 'png' : 'ico';
    const filePath = `static/favicon.${ext}`;

    // Create FormData for the upload
    const formData = new FormData();
    formData.append('upload_file', new Blob([arrayBuffer], { type: contentType }), `favicon.${ext}`);
    formData.append('owner', owner);
    formData.append('repo', repo);
    formData.append('file_path', filePath);
    formData.append('commit_message', 'Upload favicon from workflow');
    formData.append('branch', 'master');

    const endpoint = '/update-github-repo-file-upload/';
    logger.logApiRequest(endpoint, { owner, repo, file_path: filePath });
    const uploadTimer = createTimer();

    const uploadResponse = await startAndPollAsyncJobForm<{ success: boolean }>(
      endpoint + 'start/',
      formData,
      { onProgress: (s) => logger.logProcessing(`Uploading favicon... (${s}s)`) },
    );
    logger.logApiResponse(uploadResponse, uploadTimer.elapsed());

    return {
      success: true,
      data: {
        faviconUrl: `https://github.com/${owner}/${repo}/blob/master/${filePath}`,
      } as FaviconUploadResult,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Favicon upload failed' };
  }
}
