import { useCallback, useRef, useState } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import { BatchSiteEntry } from '../types/UnifiedWorkflowTypes';

type ExecuteStepFn = (stepId: string) => Promise<{ success: boolean; error?: string }>;

interface BatchModeResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  failedSites: Array<{ site: BatchSiteEntry; error: string }>;
}

export const useBatchMode = (
  executeStep: ExecuteStepFn,
  startYoloMode: () => Promise<void>,
  stopYoloMode: () => void
) => {
  const { state, actions } = useUnifiedWorkflow();
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const shouldStopRef = useRef(false);

  const processSite = useCallback(async (site: BatchSiteEntry): Promise<{ success: boolean; error?: string }> => {
    // Configure the site
    actions.setSiteConfig({
      domain: site.domain,
      template: site.template,
      siteType: site.siteType,
      scrapeDomain: site.scrapeDomain,
      preserveDoctorPhotos: true, // Default to true for batch mode
    });

    // Reset workflow for this site
    actions.resetWorkflow();

    // Wait a moment for state to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Run YOLO mode for this site
    try {
      await startYoloMode();

      // Check if all steps completed
      const allCompleted = state.steps.every(
        step => step.status === 'completed' || step.status === 'skipped'
      );

      if (!allCompleted) {
        const failedStep = state.steps.find(step => step.status === 'error');
        return {
          success: false,
          error: failedStep?.error || 'Unknown error during site processing',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Site processing failed',
      };
    }
  }, [actions, startYoloMode, state.steps]);

  const startBatchMode = useCallback(async (): Promise<BatchModeResult> => {
    const { batchConfig } = state.config;

    if (!batchConfig || batchConfig.sites.length === 0) {
      return {
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        failedSites: [],
      };
    }

    setIsBatchRunning(true);
    shouldStopRef.current = false;
    actions.startWorkflow();

    const result: BatchModeResult = {
      totalProcessed: 0,
      successCount: 0,
      failedCount: 0,
      failedSites: [],
    };

    actions.addProgressEvent({
      stepId: 'batch',
      stepName: 'Batch Mode',
      status: 'in_progress',
      message: `Starting batch processing of ${batchConfig.sites.length} sites`,
    });

    for (let i = 0; i < batchConfig.sites.length; i++) {
      // Check if we should stop
      if (shouldStopRef.current) {
        actions.addProgressEvent({
          stepId: 'batch',
          stepName: 'Batch Mode',
          status: 'skipped',
          message: 'Batch mode stopped by user',
        });
        break;
      }

      const site = batchConfig.sites[i];

      // Update batch progress
      actions.setBatchConfig({
        ...batchConfig,
        currentIndex: i,
        completedCount: result.successCount,
        failedCount: result.failedCount,
        failedSites: result.failedSites,
      });

      actions.addProgressEvent({
        stepId: 'batch',
        stepName: 'Batch Mode',
        status: 'in_progress',
        message: `Processing site ${i + 1}/${batchConfig.sites.length}: ${site.domain}`,
      });

      // Process the site
      const siteResult = await processSite(site);
      result.totalProcessed++;

      if (siteResult.success) {
        result.successCount++;
        actions.addProgressEvent({
          stepId: 'batch',
          stepName: 'Batch Mode',
          status: 'completed',
          message: `Completed: ${site.domain}`,
        });
      } else {
        result.failedCount++;
        result.failedSites.push({ site, error: siteResult.error || 'Unknown error' });
        actions.addProgressEvent({
          stepId: 'batch',
          stepName: 'Batch Mode',
          status: 'error',
          message: `Failed: ${site.domain} - ${siteResult.error}`,
        });
      }

      // Update batch config with current progress
      actions.setBatchConfig({
        ...batchConfig,
        currentIndex: i + 1,
        completedCount: result.successCount,
        failedCount: result.failedCount,
        failedSites: result.failedSites,
      });

      // Delay between sites
      if (i < batchConfig.sites.length - 1 && !shouldStopRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsBatchRunning(false);
    actions.stopWorkflow();

    actions.addProgressEvent({
      stepId: 'batch',
      stepName: 'Batch Mode',
      status: result.failedCount === 0 ? 'completed' : 'error',
      message: `Batch complete: ${result.successCount} succeeded, ${result.failedCount} failed`,
    });

    return result;
  }, [state.config, actions, processSite]);

  const stopBatchMode = useCallback(() => {
    shouldStopRef.current = true;
    stopYoloMode();
    actions.addProgressEvent({
      stepId: 'batch',
      stepName: 'Batch Mode',
      status: 'skipped',
      message: 'Stopping batch mode...',
    });
  }, [stopYoloMode, actions]);

  const getBatchProgress = useCallback(() => {
    const { batchConfig } = state.config;
    if (!batchConfig || batchConfig.sites.length === 0) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const processed = batchConfig.completedCount + batchConfig.failedCount;
    return {
      current: processed,
      total: batchConfig.sites.length,
      percentage: Math.round((processed / batchConfig.sites.length) * 100),
    };
  }, [state.config]);

  return {
    startBatchMode,
    stopBatchMode,
    isBatchRunning,
    getBatchProgress,
  };
};

export default useBatchMode;
