import { useCallback, useRef, useState, useEffect } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import {
  getExecutionOrderByTarget,
  getStepById,
} from '../constants/workflowSteps';
import { logWorkflowEvent } from '../utils/workflowLogger';
import { isStepInputEditable, getStepInputData } from '../constants/stepInputMappings';

type ExecuteStepFn = (stepId: string, skipDependencyCheck?: boolean) => Promise<{ success: boolean; error?: string }>;

export const useYoloMode = (executeStep: ExecuteStepFn) => {
  const { state, actions } = useUnifiedWorkflow();
  const [isYoloRunning, setIsYoloRunning] = useState(false);
  const shouldStopRef = useRef(false);
  const currentStepIndexRef = useRef(0);

  // Track completed steps during execution (since state.steps is stale in async loop)
  const completedStepsRef = useRef<Set<string>>(new Set());

  // Track if retry was requested during intervention - will re-run the step
  const retryRequestedRef = useRef(false);

  // Intervention continuation signal
  const interventionResolveRef = useRef<(() => void) | null>(null);

  // Pre-step input editing continuation signal
  const preStepInputResolveRef = useRef<(() => void) | null>(null);

  // Track generated data for pre-step input editing
  const generatedDataRef = useRef<Record<string, unknown>>({});

  // Track edited input data via ref to avoid stale closures in async loop
  const editedInputDataRef = useRef<Record<string, unknown>>({});

  // Reset stop flag when workflow is reset
  useEffect(() => {
    if (!state.isRunning) {
      shouldStopRef.current = false;
      currentStepIndexRef.current = 0;
      completedStepsRef.current = new Set();
      generatedDataRef.current = {};
      retryRequestedRef.current = false;
    }
  }, [state.isRunning]);

  // Keep generatedDataRef in sync with state.generatedData
  useEffect(() => {
    generatedDataRef.current = { ...state.generatedData };
  }, [state.generatedData]);

  // Keep editedInputDataRef in sync with state.editedInputData
  useEffect(() => {
    editedInputDataRef.current = { ...state.editedInputData };
  }, [state.editedInputData]);

  // Handle intervention continuation when pendingIntervention is cleared
  useEffect(() => {
    if (state.pendingIntervention === null && interventionResolveRef.current) {
      interventionResolveRef.current();
      interventionResolveRef.current = null;
    }
  }, [state.pendingIntervention]);

  // Handle pre-step input continuation when pendingPreStepInput is cleared
  useEffect(() => {
    if (state.pendingPreStepInput === null && preStepInputResolveRef.current) {
      preStepInputResolveRef.current();
      preStepInputResolveRef.current = null;
    }
  }, [state.pendingPreStepInput]);

  const waitForInterventionContinue = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      interventionResolveRef.current = resolve;
    });
  }, []);

  const waitForPreStepInputContinue = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      preStepInputResolveRef.current = resolve;
    });
  }, []);

  const startYoloMode = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (isYoloRunning) {
      return { success: false, error: 'YOLO mode already running' };
    }

    // CRITICAL: Get fresh config values at function start to avoid stale closures
    // These values are captured once at the start and used throughout the execution
    const currentConfig = actions.getSiteConfigSync();
    const deploymentTarget = currentConfig.deploymentTarget || 'demo';
    const stopOnError = currentConfig.stopOnError !== false;

    // Capture mode settings at start - these determine behavior for the entire run
    const interventionModeEnabled = state.interventionMode;
    const preStepPauseEnabled = state.preStepPauseEnabled;

    const executionOrder = getExecutionOrderByTarget(deploymentTarget);
    console.log('🚀 YOLO MODE - deploymentTarget:', deploymentTarget);
    console.log('🚀 YOLO MODE - executionOrder:', executionOrder);
    console.log('🚀 YOLO MODE - all steps:', actions.getStepsSync().map(s => ({ id: s.id, status: s.status })));
    setIsYoloRunning(true);
    shouldStopRef.current = false;
    completedStepsRef.current = new Set();
    retryRequestedRef.current = false;
    actions.startWorkflow();

    logWorkflowEvent('start', 'Starting YOLO mode - automated execution');
    actions.addProgressEvent({
      stepId: 'yolo',
      stepName: 'YOLO Mode',
      status: 'in_progress',
      message: interventionModeEnabled
        ? 'Starting YOLO mode with intervention (will pause after each step)'
        : 'Starting YOLO mode - automated execution',
    });

    // Get fresh steps from ref (avoids stale closure in batch mode)
    const currentSteps = actions.getStepsSync();
    console.log('[BATCH DEBUG] startYoloMode - getStepsSync returned', currentSteps.length, 'steps');
    console.log('[BATCH DEBUG] startYoloMode - step statuses:', currentSteps.map(s => `${s.id}:${s.status}`).join(', '));

    // Track all already completed/skipped steps
    for (const stepId of executionOrder) {
      const step = getStepById(currentSteps, stepId);
      if (step && (step.status === 'completed' || step.status === 'skipped')) {
        console.log('[BATCH DEBUG] Marking as already done:', stepId, step.status);
        completedStepsRef.current.add(step.id);
      }
    }
    console.log('[BATCH DEBUG] completedStepsRef after init:', Array.from(completedStepsRef.current));

    // Find the first pending step to start from
    let startIndex = 0;
    console.log('🚀 YOLO MODE - Looking for pending steps in execution order...');
    for (let i = 0; i < executionOrder.length; i++) {
      const step = getStepById(currentSteps, executionOrder[i]);
      console.log(`🚀 Step ${i}: ${executionOrder[i]} - found: ${!!step}, status: ${step?.status}`);
      if (step && step.status === 'pending') {
        startIndex = i;
        break; // Found first pending step, stop searching
      }
    }

    currentStepIndexRef.current = startIndex;
    console.log('🚀 YOLO MODE - startIndex:', startIndex, 'first step:', executionOrder[startIndex]);

    // Track failed steps for dependency checking
    const failedSteps = new Set<string>();

    for (let i = startIndex; i < executionOrder.length; i++) {
      // Check if we should stop
      if (shouldStopRef.current) {
        logWorkflowEvent('stop', 'YOLO mode stopped by user');
        actions.addProgressEvent({
          stepId: 'yolo',
          stepName: 'YOLO Mode',
          status: 'skipped',
          message: 'YOLO mode stopped by user',
        });
        break;
      }

      const stepId = executionOrder[i];
      console.log(`[BATCH DEBUG] Loop iteration ${i}, stepId: ${stepId}`);

      // Get fresh steps from ref for each iteration (in case state changed during async operations)
      const loopSteps = actions.getStepsSync();
      const step = getStepById(loopSteps, stepId);

      if (!step) {
        console.warn(`🚀 Step ${stepId} not found in workflow - skipping`);
        continue;
      }
      console.log(`🚀 YOLO MODE - Processing step: ${stepId}, status: ${step.status}`);

      // Skip if already completed or skipped (using our ref for accurate tracking)
      if (completedStepsRef.current.has(stepId)) {
        console.log(`[BATCH DEBUG] Step ${stepId} already in completedStepsRef, skipping`);
        continue;
      }

      // Check if dependencies are met using our tracked completed steps
      // Also check steps for skipped steps not in execution order (e.g., CREATE_GITHUB_REPO in demo mode)
      console.log(`[BATCH DEBUG] Step ${stepId} dependencies:`, step.dependencies);
      const dependenciesMet = step.dependencies.every(depId => {
        // First check our tracked completed steps
        if (completedStepsRef.current.has(depId)) {
          console.log(`[BATCH DEBUG] Dependency ${depId} met via completedStepsRef`);
          return true;
        }
        // Also check if the step is skipped in state (for steps not in execution order)
        const depStep = getStepById(loopSteps, depId);
        const isSkipped = depStep && depStep.status === 'skipped';
        console.log(`[BATCH DEBUG] Dependency ${depId} - found: ${!!depStep}, status: ${depStep?.status}, skipped: ${isSkipped}`);
        return isSkipped;
      });
      console.log(`[BATCH DEBUG] Step ${stepId} dependenciesMet: ${dependenciesMet}`);

      if (!dependenciesMet) {
        // Check if dependencies failed
        const hasFailedDependency = step.dependencies.some(depId => failedSteps.has(depId));

        if (hasFailedDependency) {
          // Skip this step if a dependency failed
          actions.skipStep(stepId);
          completedStepsRef.current.add(stepId);
          actions.addProgressEvent({
            stepId,
            stepName: step.name,
            status: 'skipped',
            message: `Skipped: ${step.name} - dependency failed`,
          });
          continue;
        }

        // Dependencies not yet completed - this shouldn't happen with correct execution order
        console.warn(`Dependencies not met for ${stepId}:`, step.dependencies.filter(d => !completedStepsRef.current.has(d)));
        continue;
      }

      // Check for pre-step input editing mode - pause before editable steps
      if (preStepPauseEnabled && isStepInputEditable(stepId)) {
        // Get current input data for this step
        const inputData = getStepInputData(stepId, generatedDataRef.current);

        // Steps with specialized editor panels handle their own data sources,
        // so they don't require inputData from the standard mapping
        const specializedPanelSteps = [
          'generate-sitemap',
          'generate-content',
          'download-theme',
          'image-picker',
          'prevent-hotlinking',
          'upload-json-to-github',
        ];
        const hasSpecializedPanel = specializedPanelSteps.includes(stepId);

        if (inputData !== undefined || hasSpecializedPanel) {
          logWorkflowEvent('pause', `Pausing for input editing before ${step.name}`);
          actions.setPendingPreStepInput(stepId);
          actions.addProgressEvent({
            stepId: 'pre-step-input',
            stepName: 'Input Editing',
            status: 'in_progress',
            message: `Paused: Edit input data for ${step.name}`,
          });

          // Wait for user to continue
          await waitForPreStepInputContinue();

          // Check if user stopped during input editing
          if (shouldStopRef.current) {
            logWorkflowEvent('stop', 'YOLO mode stopped during input editing');
            break;
          }

          // Check if there's edited input data to apply (use ref for fresh value in async loop)
          const editedStepData = editedInputDataRef.current[stepId];
          if (editedStepData !== undefined) {
            // Apply the edited data to the appropriate place in generatedData
            // This will be picked up by the step when it executes
            // The step runner will need to check for edited data
            logWorkflowEvent('info', `Using edited input data for ${step.name}`);
            actions.addProgressEvent({
              stepId: 'pre-step-input',
              stepName: 'Input Editing',
              status: 'completed',
              message: `Using edited input for ${step.name}`,
            });
          } else {
            actions.addProgressEvent({
              stepId: 'pre-step-input',
              stepName: 'Input Editing',
              status: 'completed',
              message: `Continuing with original input for ${step.name}`,
            });
          }
        }
      }

      // Execute the step
      // Pass true to skip dependency check since YOLO mode tracks dependencies via completedStepsRef
      currentStepIndexRef.current = i;
      console.log(`[BATCH DEBUG] About to executeStep: ${stepId}`);
      const result = await executeStep(stepId, true);
      console.log(`[BATCH DEBUG] executeStep result for ${stepId}:`, result);

      if (result.success) {
        // Track this step as completed
        completedStepsRef.current.add(stepId);
        console.log(`[BATCH DEBUG] Step ${stepId} succeeded, added to completedStepsRef`);
      } else {
        // Track as failed
        failedSteps.add(stepId);
        console.log(`[BATCH DEBUG] Step ${stepId} FAILED:`, result.error);

        // Check if we should stop on error (captured at start of execution)
        if (stopOnError) {
          console.log(`[BATCH DEBUG] stopOnError is true, breaking loop`);
          logWorkflowEvent('error', `YOLO mode stopped due to error in ${step.name}`);
          actions.addProgressEvent({
            stepId: 'yolo',
            stepName: 'YOLO Mode',
            status: 'error',
            message: `YOLO mode stopped due to error in ${step.name}`,
          });
          break;
        }
      }

      // Check for intervention mode - pause after successful step completion (captured at start)
      if (result.success && interventionModeEnabled) {
        logWorkflowEvent('pause', `Pausing for intervention after ${step.name}`);
        actions.setPendingIntervention(stepId);
        actions.addProgressEvent({
          stepId: 'intervention',
          stepName: 'Intervention',
          status: 'in_progress',
          message: `Paused: Waiting for user to review ${step.name} result`,
        });

        // Wait for user to continue
        await waitForInterventionContinue();

        // Check if user stopped during intervention
        if (shouldStopRef.current) {
          logWorkflowEvent('stop', 'YOLO mode stopped during intervention');
          break;
        }

        // Check if retry was requested - decrement i to re-run this step
        if (retryRequestedRef.current) {
          retryRequestedRef.current = false;
          logWorkflowEvent('retry', `Retrying step ${step.name}`);
          actions.addProgressEvent({
            stepId: 'intervention',
            stepName: 'Intervention',
            status: 'completed',
            message: `Retrying ${step.name}`,
          });
          i--; // Decrement to re-run this step
          continue; // Skip the delay and immediately retry
        }

        logWorkflowEvent('resume', `Continuing after intervention for ${step.name}`);
        actions.addProgressEvent({
          stepId: 'intervention',
          stepName: 'Intervention',
          status: 'completed',
          message: `Continuing after ${step.name}`,
        });
      }

      // Small delay between steps for UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsYoloRunning(false);
    actions.stopWorkflow();

    // Check if all steps completed successfully
    const allCompleted = executionOrder.every(stepId => completedStepsRef.current.has(stepId));

    if (allCompleted) {
      logWorkflowEvent('complete', 'YOLO mode completed successfully!');
      actions.addProgressEvent({
        stepId: 'yolo',
        stepName: 'YOLO Mode',
        status: 'completed',
        message: 'YOLO mode completed successfully!',
      });
      return { success: true };
    }

    // Find what went wrong
    const failedStepIds = executionOrder.filter(stepId => !completedStepsRef.current.has(stepId));
    return { success: false, error: `Steps not completed: ${failedStepIds.join(', ')}` };
  }, [isYoloRunning, state.interventionMode, state.preStepPauseEnabled, actions, executeStep, waitForInterventionContinue, waitForPreStepInputContinue]);

  const stopYoloMode = useCallback(() => {
    shouldStopRef.current = true;
    // If waiting for intervention, resolve it to allow the loop to exit
    if (interventionResolveRef.current) {
      interventionResolveRef.current();
      interventionResolveRef.current = null;
    }
    // If waiting for pre-step input, resolve it to allow the loop to exit
    if (preStepInputResolveRef.current) {
      preStepInputResolveRef.current();
      preStepInputResolveRef.current = null;
    }
    actions.setPendingIntervention(null);
    actions.setPendingPreStepInput(null);
    actions.clearEditedInputData();
    logWorkflowEvent('stop', 'Stopping YOLO mode...');
    actions.addProgressEvent({
      stepId: 'yolo',
      stepName: 'YOLO Mode',
      status: 'skipped',
      message: 'Stopping YOLO mode...',
    });
  }, [actions]);

  const pauseYoloMode = useCallback(() => {
    shouldStopRef.current = true;
    setIsYoloRunning(false);
    logWorkflowEvent('pause', 'Pausing YOLO mode');
  }, []);

  const resumeYoloMode = useCallback(async () => {
    if (isYoloRunning) return;

    shouldStopRef.current = false;
    logWorkflowEvent('resume', 'Resuming YOLO mode');
    await startYoloMode();
  }, [isYoloRunning, startYoloMode]);

  const continueFromIntervention = useCallback(() => {
    actions.confirmStepAndContinue();
  }, [actions]);

  const continueFromPreStepInput = useCallback((useEdited: boolean, editedData?: unknown) => {
    const stepId = state.pendingPreStepInput;
    if (stepId && useEdited && editedData !== undefined) {
      actions.setEditedInputData(stepId, editedData);
    }
    actions.confirmInputAndContinue();
  }, [state.pendingPreStepInput, actions]);

  const cancelFromPreStepInput = useCallback(() => {
    // Stop the workflow entirely
    shouldStopRef.current = true;
    if (preStepInputResolveRef.current) {
      preStepInputResolveRef.current();
      preStepInputResolveRef.current = null;
    }
    actions.setPendingPreStepInput(null);
    actions.clearEditedInputData();
    logWorkflowEvent('stop', 'YOLO mode cancelled from input editing');
    actions.addProgressEvent({
      stepId: 'pre-step-input',
      stepName: 'Input Editing',
      status: 'skipped',
      message: 'Workflow cancelled by user',
    });
  }, [actions]);

  // Retry a step - resets it to pending and removes from completed tracking
  const retryStep = useCallback((stepId: string) => {
    const step = getStepById(actions.getStepsSync(), stepId);
    if (!step) return;

    // Remove from completed tracking so YOLO will re-run it
    completedStepsRef.current.delete(stepId);

    // Reset step status to pending
    actions.setStepStatus(stepId, 'pending');

    logWorkflowEvent('retry', `Step ${step.name} marked for retry`);
    actions.addProgressEvent({
      stepId,
      stepName: step.name,
      status: 'pending',
      message: `Retry requested: ${step.name}`,
    });
  }, [actions]);

  // Retry and immediately continue YOLO mode
  const retryStepAndContinue = useCallback((stepId: string) => {
    retryStep(stepId);
    // Set flag so the loop knows to re-run the step
    retryRequestedRef.current = true;
    // Clear intervention state and continue (this resolves the wait)
    actions.setPendingIntervention(null);
  }, [retryStep, actions]);

  return {
    startYoloMode,
    stopYoloMode,
    pauseYoloMode,
    resumeYoloMode,
    continueFromIntervention,
    continueFromPreStepInput,
    cancelFromPreStepInput,
    retryStep,
    retryStepAndContinue,
    isYoloRunning,
    currentStepIndex: currentStepIndexRef.current,
  };
};

export default useYoloMode;
