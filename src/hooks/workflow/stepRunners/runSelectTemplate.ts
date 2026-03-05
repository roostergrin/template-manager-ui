import { StepLogger } from '../../../utils/workflowLogger';
import { StepResult, StepRunnerDeps } from './stepRunnerTypes';

export async function runSelectTemplate(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();

  // Template selection is usually done through UI, this just validates it
  if (!siteConfig.template) {
    return { success: false, error: 'No template selected' };
  }

  logger.logProcessing('Template validated', { template: siteConfig.template });

  return {
    success: true,
    data: {
      template: siteConfig.template,
      templateName: siteConfig.template,
    },
  };
}
