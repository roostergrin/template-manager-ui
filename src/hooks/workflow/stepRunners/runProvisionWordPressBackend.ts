import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import { ProvisionWordPressBackendResult } from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

export async function runProvisionWordPressBackend(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.getSiteConfigSync();
  const templateType = siteConfig.templateType || 'json';

  // Skip if using JSON template (ai-template-*)
  if (templateType === 'json') {
    logger.logProcessing('Skipping WordPress backend - using JSON template');
    return { success: true, data: { skipped: true, message: 'Not needed for JSON templates' } };
  }

  const targetDomain = `${domainToSlug(siteConfig.domain)}.com`;
  const endpoint = '/copy-subscription';

  // Build query params for the backend
  const params = new URLSearchParams({
    source_domain: 'stinsondental.com', // Default source template
    target_domain: targetDomain,
    server: 'sunset', // Default server for templates
    subdomain: 'api',
    copy_files: 'true',
    copy_databases: 'true',
    update_config_files: 'true',
  }).toString();

  try {
    logger.logApiRequest(endpoint, { source_domain: 'stinsondental.com', target_domain: targetDomain, server: 'sunset' });
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<ProvisionWordPressBackendResult>(
      `${endpoint}/start/?${params}`,
      undefined,
      { onProgress: (s) => logger.logProcessing(`Provisioning WordPress backend... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());
    deps.setGeneratedDataWithRef('wordpressBackendResult', response);
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'WordPress backend provisioning failed' };
  }
}
