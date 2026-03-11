import { startAndPollAsyncJobForm } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  CreateGithubRepoResult,
  ThemeStepResult,
  LogoUploadResult,
} from '../../../types/UnifiedWorkflowTypes';
import { StepResult, StepRunnerDeps } from './stepRunnerTypes';

export async function runUploadLogo(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const templateType = siteConfig.templateType || 'json';

  // Get theme - prefer hotlink-updated version with CloudFront URLs
  const hotlinkTheme = deps.getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
  const themeResult = deps.getGeneratedData<ThemeStepResult>('themeResult');
  const theme = hotlinkTheme || themeResult?.theme;

  if (!theme) {
    return { success: false, error: 'No theme data available' };
  }

  // Get logo URL from theme
  const themeDefault = (theme as { default?: Record<string, unknown> })?.default || theme;
  const logoUrl = (themeDefault as { logo_url?: string })?.logo_url;
  const headerVariant = ((themeDefault as { logo_config?: { variant?: string } })?.logo_config?.variant) || 'dark';

  if (!logoUrl) {
    logger.logProcessing('No logo in theme, skipping');
    return { success: true, data: { skipped: true, message: 'No logo to upload' } };
  }

  // For WordPress templates, just return the URL (WordPress handles it)
  if (templateType === 'wordpress') {
    logger.logProcessing('WordPress template - logo handled by WordPress');
    return { success: true, data: { logoUrl, headerVariant } as LogoUploadResult };
  }

  // For JSON templates, upload to GitHub
  const githubRepoResult = deps.getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
  if (!githubRepoResult?.repo) {
    return { success: false, error: 'No GitHub repository information available' };
  }

  const owner = githubRepoResult.owner || 'roostergrin';
  const repo = githubRepoResult.repo;

  logger.logProcessing(`Uploading logo to GitHub: ${owner}/${repo}`);

  try {
    // Download the logo image
    const response = await fetch(logoUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to download logo: ${response.statusText}` };
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Determine file extension from URL or content type
    const contentType = blob.type || 'image/png';
    const ext = contentType.includes('svg') ? 'svg' : contentType.includes('png') ? 'png' : 'png';
    const filePath = `assets/icons/logo.${ext}`;

    // Create FormData for the upload
    const formData = new FormData();
    formData.append('upload_file', new Blob([arrayBuffer], { type: contentType }), `logo.${ext}`);
    formData.append('owner', owner);
    formData.append('repo', repo);
    formData.append('file_path', filePath);
    formData.append('commit_message', 'Upload logo from workflow');
    formData.append('branch', 'master');

    const endpoint = '/update-github-repo-file-upload/';
    logger.logApiRequest(endpoint, { owner, repo, file_path: filePath });
    const uploadTimer = createTimer();

    const uploadResponse = await startAndPollAsyncJobForm<{ success: boolean }>(
      endpoint + 'start/',
      formData,
      { onProgress: (s) => logger.logProcessing(`Uploading logo... (${s}s)`) },
    );
    logger.logApiResponse(uploadResponse, uploadTimer.elapsed());

    return {
      success: true,
      data: {
        logoUrl: `https://github.com/${owner}/${repo}/blob/master/${filePath}`,
        headerVariant,
      } as LogoUploadResult,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Logo upload failed' };
  }
}
