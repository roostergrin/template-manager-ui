import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useUnifiedWorkflow } from '../../contexts/UnifiedWorkflowProvider';
import WorkflowProgressDisplay from './WorkflowProgressDisplay';
import BatchModePanel from './BatchModePanel';
import InterventionPanel from './InterventionPanel';
import InputEditorPanel from './InputEditorPanel';
import PreventHotlinkingEditorPanel from './PreventHotlinkingEditorPanel';
import GithubJsonEditorPanel from './GithubJsonEditorPanel';
import ExportPanel from './ExportPanel';
import CleanupPanel from './CleanupPanel';
import ThemeJsonDebugViewer from '../ThemeJsonDebugViewer';
import { ConfigurationPanel } from './ConfigurationPanel';
import { NavigationLinks } from './NavigationLinks';
import { ModeSelector } from './ModeSelector';
import { WorkflowControlBar } from './WorkflowControlBar';
import { getStepInputData } from '../../constants/stepInputMappings';
import { getStepById } from '../../constants/workflowSteps';
import { WorkflowMode, SiteConfig, TemplateType } from '../../types/UnifiedWorkflowTypes';
import { WORKFLOW_STEP_IDS } from '../../constants/workflowSteps';
import { useWorkflowStepRunner } from '../../hooks/useWorkflowStepRunner';
import { useYoloMode } from '../../hooks/useYoloMode';
import { useBatchMode } from '../../hooks/useBatchMode';
import './UnifiedWorkflow.sass';

const UnifiedWorkflow: React.FC = () => {
  const { state, actions } = useUnifiedWorkflow();
  const {
    config,
    isRunning,
    isPaused,
    interventionMode,
    pendingIntervention,
    preStepPauseEnabled,
    pendingPreStepInput,
    generatedData,
    steps
  } = state;
  const { mode, siteConfig } = config;

  // Cleanup panel state
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);

  // Export panel state
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Initialize the step runner
  const { executeStep, resetSessionId } = useWorkflowStepRunner();

  // Initialize YOLO mode
  const {
    startYoloMode,
    stopYoloMode,
    continueFromIntervention,
    continueFromPreStepInput,
    cancelFromPreStepInput,
    retryStepAndContinue,
    isYoloRunning
  } = useYoloMode(executeStep);

  // Initialize Batch mode
  const { startBatchMode, stopBatchMode, isBatchRunning } = useBatchMode(executeStep, startYoloMode, stopYoloMode);

  // Get the step that is pending intervention
  const interventionStep = useMemo(() => {
    if (!pendingIntervention) return null;
    return getStepById(steps, pendingIntervention);
  }, [pendingIntervention, steps]);

  // Get the step and input data for pre-step input editing
  const preStepInputStep = useMemo(() => {
    if (!pendingPreStepInput) return null;
    return getStepById(steps, pendingPreStepInput);
  }, [pendingPreStepInput, steps]);

  const preStepInputData = useMemo(() => {
    if (!pendingPreStepInput) return undefined;
    const data = getStepInputData(pendingPreStepInput, generatedData);
    console.log(`[preStepInputData] stepId="${pendingPreStepInput}" data=`, data);
    return data;
  }, [pendingPreStepInput, generatedData]);

  // Find the last executed step (completed or error) for retry functionality
  const lastExecutedStep = useMemo(() => {
    // Find the last step that was completed or errored
    const executedSteps = steps.filter(
      (step) => step.status === 'completed' || step.status === 'error'
    );
    return executedSteps.length > 0 ? executedSteps[executedSteps.length - 1] : null;
  }, [steps]);

  const handleModeChange = useCallback((newMode: WorkflowMode) => {
    if (isRunning) {
      // Don't allow mode change while running
      return;
    }
    actions.setMode(newMode);
  }, [actions, isRunning]);

  const handleStartWorkflow = useCallback(async () => {
    // Reset session ID for a new workflow run (creates new log folder)
    resetSessionId();

    if (mode === 'yolo') {
      await startYoloMode();
    } else if (mode === 'batch') {
      await startBatchMode();
    } else {
      actions.startWorkflow();
    }
  }, [mode, actions, startYoloMode, startBatchMode, resetSessionId]);

  const handlePauseWorkflow = useCallback(() => {
    if (mode === 'yolo') {
      stopYoloMode();
    } else if (mode === 'batch') {
      stopBatchMode();
    }
    actions.pauseWorkflow();
  }, [mode, actions, stopYoloMode, stopBatchMode]);

  const handleResumeWorkflow = useCallback(async () => {
    actions.resumeWorkflow();
    if (mode === 'yolo') {
      await startYoloMode();
    }
  }, [mode, actions, startYoloMode]);

  const handleStopWorkflow = useCallback(() => {
    if (mode === 'yolo') {
      stopYoloMode();
    } else if (mode === 'batch') {
      stopBatchMode();
    }
    actions.stopWorkflow();
  }, [mode, actions, stopYoloMode, stopBatchMode]);

  const handleResetWorkflow = useCallback(() => {
    if (isRunning) {
      handleStopWorkflow();
    }
    actions.resetWorkflow();
    actions.clearProgressEvents();
  }, [isRunning, actions, handleStopWorkflow]);

  const handleRetryLastStep = useCallback(async () => {
    if (lastExecutedStep) {
      actions.setStepStatus(lastExecutedStep.id, 'pending');
      await executeStep(lastExecutedStep.id);
    }
  }, [lastExecutedStep, actions, executeStep]);

  const handleRunStep = useCallback(async (stepId: string) => {
    await executeStep(stepId);
  }, [executeStep]);

  const handleSkipStep = useCallback((stepId: string) => {
    actions.skipStep(stepId);
  }, [actions]);

  const handleRetryStep = useCallback(async (stepId: string) => {
    actions.setStepStatus(stepId, 'pending');
    await executeStep(stepId);
  }, [actions, executeStep]);

  // Template type change handler - enable/disable steps based on template type
  const handleTemplateTypeChange = useCallback((templateType: TemplateType) => {
    if (templateType === 'json') {
      // JSON templates: upload to GitHub, skip WordPress
      actions.skipStep(WORKFLOW_STEP_IDS.PROVISION_WORDPRESS_BACKEND);
      actions.enableStep(WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB);
      actions.skipStep(WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS);
      actions.skipStep(WORKFLOW_STEP_IDS.SECOND_PASS);
    } else {
      // WordPress templates: export to WordPress, skip GitHub JSON upload
      actions.enableStep(WORKFLOW_STEP_IDS.PROVISION_WORDPRESS_BACKEND);
      actions.skipStep(WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB);
      actions.enableStep(WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS);
      actions.enableStep(WORKFLOW_STEP_IDS.SECOND_PASS);
    }
  }, [actions]);

  // Image picker step skip/enable handler
  const handleImagePickerToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      actions.enableStep(WORKFLOW_STEP_IDS.IMAGE_PICKER);
    } else {
      actions.skipStep(WORKFLOW_STEP_IDS.IMAGE_PICKER);
    }
  }, [actions]);

  // Skip IMAGE_PICKER on mount when enableImagePicker is false
  useEffect(() => {
    if (!siteConfig.enableImagePicker) {
      actions.skipStep(WORKFLOW_STEP_IDS.IMAGE_PICKER);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Intervention handlers
  const handleInterventionToggle = useCallback((enabled: boolean) => {
    actions.setInterventionMode(enabled);
  }, [actions]);

  // Pre-step input editing handlers
  const handlePreStepPauseToggle = useCallback((enabled: boolean) => {
    actions.setPreStepPauseEnabled(enabled);
  }, [actions]);

  const handlePreStepInputUseOriginal = useCallback(() => {
    continueFromPreStepInput(false);
  }, [continueFromPreStepInput]);

  const handlePreStepInputUseEdited = useCallback((editedData: unknown) => {
    continueFromPreStepInput(true, editedData);
  }, [continueFromPreStepInput]);

  const handlePreStepInputCancel = useCallback(() => {
    cancelFromPreStepInput();
  }, [cancelFromPreStepInput]);

  const handleInterventionContinue = useCallback(() => {
    continueFromIntervention();
  }, [continueFromIntervention]);

  const handleInterventionRetry = useCallback(async () => {
    if (pendingIntervention) {
      // Use retryStepAndContinue to properly handle YOLO mode tracking
      // This removes the step from completedStepsRef and resets status to pending
      retryStepAndContinue(pendingIntervention);
    }
  }, [pendingIntervention, retryStepAndContinue]);

  const handleInterventionStop = useCallback(() => {
    stopYoloMode();
  }, [stopYoloMode]);

  // Auto-start in YOLO mode if configured
  useEffect(() => {
    if (config.autoStartOnLoad && mode === 'yolo' && !isRunning) {
      handleStartWorkflow();
    }
  }, [config.autoStartOnLoad, mode, isRunning, handleStartWorkflow]);

  return (
    <div className="unified-workflow">
      {/* Mode Selector */}
      <ModeSelector
        mode={mode}
        isRunning={isRunning}
        onModeChange={handleModeChange}
      />

      {/* Configuration Panel - shown for manual and yolo modes */}
      {mode !== 'batch' && (
        <ConfigurationPanel
          config={siteConfig}
          onConfigChange={actions.setSiteConfig}
          onTemplateTypeChange={handleTemplateTypeChange}
          onImagePickerToggle={handleImagePickerToggle}
          steps={steps}
          disabled={isRunning}
          interventionMode={interventionMode}
          onInterventionToggle={handleInterventionToggle}
          preStepPauseEnabled={preStepPauseEnabled}
          onPreStepPauseToggle={handlePreStepPauseToggle}
          onStartWorkflow={handleStartWorkflow}
          onResetWorkflow={handleResetWorkflow}
          mode={mode}
          canStart={!!(siteConfig.domain && siteConfig.scrapeDomain)}
        />
      )}

      {/* Batch Mode Panel */}
      {mode === 'batch' && (
        <>
          <BatchModePanel
            onProcessSite={executeStep}
            disabled={isRunning}
          />
          <div className="config-panel-v2__actions">
            {!isRunning && (
              <button
                type="button"
                className="config-panel-v2__start-btn"
                onClick={handleStartWorkflow}
              >
                <Play size={16} />
                Start Batch
              </button>
            )}
            <button
              type="button"
              className="config-panel-v2__reset-btn"
              onClick={handleResetWorkflow}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </>
      )}

      {/* Running Controls + Retry */}
      <WorkflowControlBar
        isRunning={isRunning}
        isPaused={isPaused}
        lastExecutedStep={lastExecutedStep}
        onResume={handleResumeWorkflow}
        onPause={handlePauseWorkflow}
        onStop={handleStopWorkflow}
        onRetryLastStep={handleRetryLastStep}
      />

      {/* Theme JSON Debug Viewer - shows when design system data is available */}
      {(generatedData.scrapeResult as { design_system?: Record<string, unknown> } | undefined)?.design_system && (
        <div className="unified-workflow__theme-debug">
          <ThemeJsonDebugViewer
            designSystem={(generatedData.scrapeResult as { design_system: Record<string, unknown> }).design_system as import('../DesignSystemViewer').DesignSystem}
          />
        </div>
      )}

      {/* Intervention Panel - shown when paused for intervention */}
      {interventionStep && pendingIntervention && (
        <InterventionPanel
          step={interventionStep}
          onContinue={handleInterventionContinue}
          onRetry={handleInterventionRetry}
          onStop={handleInterventionStop}
        />
      )}

      {/* Input Editor Panels - step-specific for prevent-hotlinking and upload-json-to-github */}
      {preStepInputStep && pendingPreStepInput === 'prevent-hotlinking' && (
        <PreventHotlinkingEditorPanel
          step={preStepInputStep}
          pagesData={
            (generatedData.imagePickerResult as { pageData?: Record<string, unknown> } | undefined)?.pageData ||
            (generatedData.contentResult as { pageData?: Record<string, unknown> } | undefined)?.pageData
          }
          themeData={(generatedData.themeResult as { theme?: Record<string, unknown> } | undefined)?.theme}
          provisionResult={generatedData.provisionResult as import('../../types/UnifiedWorkflowTypes').ProvisionStepResult | undefined}
          siteConfig={siteConfig}
          onUseOriginal={handlePreStepInputUseOriginal}
          onUseEdited={handlePreStepInputUseEdited}
          onCancel={handlePreStepInputCancel}
        />
      )}

      {preStepInputStep && pendingPreStepInput === 'upload-json-to-github' && (
        <GithubJsonEditorPanel
          step={preStepInputStep}
          pagesData={
            (generatedData.hotlinkPagesResult as Record<string, unknown> | undefined) ||
            (generatedData.imagePickerResult as { pageData?: Record<string, unknown> } | undefined)?.pageData ||
            (generatedData.contentResult as { pageData?: Record<string, unknown> } | undefined)?.pageData
          }
          globalData={(generatedData.contentResult as { globalData?: Record<string, unknown> } | undefined)?.globalData}
          themeData={
            (generatedData.hotlinkThemeResult as Record<string, unknown> | undefined) ||
            (generatedData.themeResult as { theme?: Record<string, unknown> } | undefined)?.theme
          }
          githubRepoResult={generatedData.githubRepoResult as import('../../types/UnifiedWorkflowTypes').CreateGithubRepoResult | undefined}
          onUseOriginal={handlePreStepInputUseOriginal}
          onUseEdited={handlePreStepInputUseEdited}
          onCancel={handlePreStepInputCancel}
        />
      )}

      {/* Fallback Input Editor Panel for other editable steps */}
      {preStepInputStep && pendingPreStepInput &&
       pendingPreStepInput !== 'prevent-hotlinking' &&
       pendingPreStepInput !== 'upload-json-to-github' && (
        <InputEditorPanel
          step={preStepInputStep}
          inputData={preStepInputData}
          onUseOriginal={handlePreStepInputUseOriginal}
          onUseEdited={handlePreStepInputUseEdited}
          onCancel={handlePreStepInputCancel}
        />
      )}

      {/* Progress Display */}
      <WorkflowProgressDisplay
        onRunStep={handleRunStep}
        onSkipStep={handleSkipStep}
        onRetryStep={handleRetryStep}
      />

      {/* Navigation Links - shown when domain is configured */}
      {siteConfig.domain && (
        <NavigationLinks
          domain={siteConfig.domain}
          githubRepo={siteConfig.githubRepo}
        />
      )}

      {/* Cleanup */}
      {!isRunning && (
        <button
          type="button"
          className="unified-workflow__cleanup-link"
          onClick={() => setShowCleanupPanel(true)}
        >
          <Trash2 size={14} />
          {siteConfig.domain ? `Cleanup ${siteConfig.domain}` : 'Cleanup infrastructure'}
        </button>
      )}

      {/* Modals (fixed position overlays) */}
      {showExportPanel && (
        <div className="unified-workflow__export-overlay">
          <ExportPanel onClose={() => setShowExportPanel(false)} />
        </div>
      )}

      {showCleanupPanel && (
        <div className="unified-workflow__cleanup-overlay">
          <CleanupPanel onClose={() => setShowCleanupPanel(false)} />
        </div>
      )}
    </div>
  );
};

export default UnifiedWorkflow;
