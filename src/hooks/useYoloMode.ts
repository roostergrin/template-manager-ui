import { useCallback, useRef, useState, useEffect } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import {
  getYoloExecutionOrder,
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

  const startYoloMode = useCallback(async () => {
    if (isYoloRunning) {
      return;
    }

    const executionOrder = getYoloExecutionOrder();
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
      message: state.interventionMode
        ? 'Starting YOLO mode with intervention (will pause after each step)'
        : 'Starting YOLO mode - automated execution',
    });

    // Track all already completed/skipped steps
    for (const stepId of executionOrder) {
      const step = getStepById(state.steps, stepId);
      if (step && (step.status === 'completed' || step.status === 'skipped')) {
        completedStepsRef.current.add(step.id);
      }
    }

    // Find the first pending step to start from
    let startIndex = 0;
    for (let i = 0; i < executionOrder.length; i++) {
      const step = getStepById(state.steps, executionOrder[i]);
      if (step && step.status === 'pending') {
        startIndex = i;
        break; // Found first pending step, stop searching
      }
    }

    currentStepIndexRef.current = startIndex;

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
      const step = getStepById(state.steps, stepId);

      if (!step) {
        console.warn(`Step ${stepId} not found in workflow`);
        continue;
      }

      // Skip if already completed or skipped (using our ref for accurate tracking)
      if (completedStepsRef.current.has(stepId)) {
        continue;
      }

      // Check if dependencies are met using our tracked completed steps
      const dependenciesMet = step.dependencies.every(depId =>
        completedStepsRef.current.has(depId)
      );

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
      if (state.preStepPauseEnabled && isStepInputEditable(stepId)) {
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

          // Check if there's edited input data to apply
          const editedStepData = state.editedInputData[stepId];
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
      const result = await executeStep(stepId, true);

      if (result.success) {
        // Track this step as completed
        completedStepsRef.current.add(stepId);
      } else {
        // Track as failed
        failedSteps.add(stepId);

        // Check if we should stop on error
        if (state.config.stopOnError !== false) {
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

      // Check for intervention mode - pause after successful step completion
      if (result.success && state.interventionMode) {
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
    }
  }, [isYoloRunning, state.steps, state.config, state.interventionMode, state.preStepPauseEnabled, state.editedInputData, actions, executeStep, waitForInterventionContinue, waitForPreStepInputContinue]);

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
    const step = getStepById(state.steps, stepId);
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
  }, [state.steps, actions]);

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
