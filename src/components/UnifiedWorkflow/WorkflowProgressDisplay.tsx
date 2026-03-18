import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  SkipForward,
  Play,
  Loader,
  Download,
  Edit3,
  RotateCw,
  Zap,
  X,
} from 'lucide-react';
import apiClient from '../../services/apiService';
import { useUnifiedWorkflow } from '../../contexts/UnifiedWorkflowProvider';
import { WorkflowStep, WorkflowStepStatus } from '../../types/UnifiedWorkflowTypes';
import { getExecutionOrderByTarget } from '../../constants/workflowSteps';
import { useWorkflowExport } from '../../hooks/useWorkflowExport';
import { useWorkflowStepRunner } from '../../hooks/useWorkflowStepRunner';
import { STEP_DATA_CONTRACT, getStepOutputKey, getStepEditData, isStepEditable as checkStepEditable } from '../../constants/stepInputMappings';
import InputEditorPanel from './InputEditorPanel';
import PreventHotlinkingEditorPanel from './PreventHotlinkingEditorPanel';
import GithubJsonEditorPanel from './GithubJsonEditorPanel';
import GenerateSitemapEditorPanel from './GenerateSitemapEditorPanel';
import GenerateContentEditorPanel from './GenerateContentEditorPanel';
import DownloadThemeEditorPanel from './DownloadThemeEditorPanel';
import ImagePickerEditorPanel from './ImagePickerEditorPanel';
import { ProvisionStepResult, CreateGithubRepoResult, ScrapeStepResult, SitemapStepResult, AllocatedSitemapResult, ContentStepResult } from '../../types/UnifiedWorkflowTypes';


interface StepItemProps {
  step: WorkflowStep;
  stepIndex: number;
  isActive: boolean;
  canRun: boolean;
  onStepClick: (stepId: string) => void;
  onRunStep: (stepId: string) => void;
  onSkipStep: (stepId: string) => void;
  onEnableStep: (stepId: string) => void;
  onRetryStep: (stepId: string) => void;
  onDownloadStep: (stepId: string) => void;
  onEditInput?: (stepId: string) => void;
  onTestConnection?: (stepId: string) => void;
  testConnectionLoading?: boolean;
  isManualMode: boolean;
  isWorkflowRunning: boolean;
  isEditable?: boolean;
}

const StepStatusIcon: React.FC<{ status: WorkflowStepStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="workflow-progress__status-icon workflow-progress__status-icon--completed" size={16} />;
    case 'in_progress':
      return <Loader className="workflow-progress__status-icon workflow-progress__status-icon--running" size={16} />;
    case 'error':
      return <AlertCircle className="workflow-progress__status-icon workflow-progress__status-icon--error" size={16} />;
    case 'skipped':
      return <SkipForward className="workflow-progress__status-icon workflow-progress__status-icon--skipped" size={16} />;
    default:
      return <Clock className="workflow-progress__status-icon workflow-progress__status-icon--pending" size={16} />;
  }
};

const StepItem: React.FC<StepItemProps> = ({
  step,
  stepIndex,
  isActive,
  canRun,
  onStepClick,
  onRunStep,
  onSkipStep,
  onEnableStep,
  onRetryStep,
  onDownloadStep,
  onEditInput,
  onTestConnection,
  testConnectionLoading,
  isManualMode,
  isWorkflowRunning,
  isEditable,
}) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleRunClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRunStep(step.id);
  };

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkipStep(step.id);
  };

  const handleEnableClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnableStep(step.id);
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetryStep(step.id);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownloadStep(step.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditInput?.(step.id);
  };

  const handleTestConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTestConnection?.(step.id);
  };

  const showTestButton = step.id === 'provision-cloudflare-pages' && onTestConnection;

  return (
    <div className="workflow-progress__step-wrapper">
      <div
        className={`workflow-progress__step ${isActive ? 'workflow-progress__step--active' : ''} workflow-progress__step--${step.status}`}
        onClick={() => onStepClick(step.id)}
        onKeyDown={(e) => e.key === 'Enter' && onStepClick(step.id)}
        tabIndex={0}
        role="button"
        aria-label={`Step ${stepIndex + 1}: ${step.name}, Status: ${step.status}`}
      >
        <div className="workflow-progress__step-icon">
          <StepStatusIcon status={step.status} />
        </div>

        <div className="workflow-progress__step-content">
          <span className="workflow-progress__step-name">{step.name}</span>
          {step.actualDurationSeconds !== undefined && (
            <span className="workflow-progress__step-duration">
              {formatDuration(step.actualDurationSeconds)}
            </span>
          )}
          {step.error && (
            <span className="workflow-progress__step-error">{step.error}</span>
          )}
        </div>

        <div className="workflow-progress__step-actions">
          {/* Download and Retry buttons for completed steps - always visible */}
          {step.status === 'completed' && step.result && (
            <>
              <button
                type="button"
                className="workflow-progress__step-action workflow-progress__step-action--download"
                onClick={handleDownloadClick}
                aria-label={`Download ${step.name} result`}
                title="Download JSON"
              >
                <Download size={14} />
              </button>
              <button
                type="button"
                className="workflow-progress__step-action workflow-progress__step-action--retry"
                onClick={handleRetryClick}
                aria-label={`Retry ${step.name}`}
                title="Retry with same parameters"
              >
                <RotateCw size={14} />
              </button>
            </>
          )}

          {/* Manual mode actions */}
          {isManualMode && (
            <>
              {/* Edit button - shows for editable steps even without dependencies met (for testing) */}
              {step.status === 'pending' && isEditable && (
                <button
                  type="button"
                  className="workflow-progress__step-action workflow-progress__step-action--edit"
                  onClick={handleEditClick}
                  aria-label={`Edit input for ${step.name}`}
                  title="Paste custom input data for testing"
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}
              {/* Run button - requires dependencies to be met */}
              {step.status === 'pending' && canRun && (
                <>
                  <button
                    type="button"
                    className="workflow-progress__step-action workflow-progress__step-action--run"
                    onClick={handleRunClick}
                    aria-label={`Run ${step.name}`}
                  >
                    <Play size={14} /> Run
                  </button>
                  {step.isOptional && (
                    <button
                      type="button"
                      className="workflow-progress__step-action workflow-progress__step-action--skip"
                      onClick={handleSkipClick}
                      aria-label={`Skip ${step.name}`}
                    >
                      <SkipForward size={14} /> Skip
                    </button>
                  )}
                </>
              )}
              {step.status === 'error' && (
                <button
                  type="button"
                  className="workflow-progress__step-action workflow-progress__step-action--retry"
                  onClick={handleRetryClick}
                  aria-label={`Retry ${step.name}`}
                >
                  Retry
                </button>
              )}
            </>
          )}

          {/* YOLO mode skip buttons - only when workflow is not running */}
          {!isManualMode && !isWorkflowRunning && (
            <>
              {step.status === 'pending' && (
                <button
                  type="button"
                  className="workflow-progress__step-action workflow-progress__step-action--skip"
                  onClick={handleSkipClick}
                  aria-label={`Skip ${step.name}`}
                >
                  <SkipForward size={14} /> Skip
                </button>
              )}
              {step.status === 'skipped' && (
                <button
                  type="button"
                  className="workflow-progress__step-action workflow-progress__step-action--run"
                  onClick={handleEnableClick}
                  aria-label={`Enable ${step.name}`}
                >
                  <Play size={14} /> Enable
                </button>
              )}
            </>
          )}

          {/* Test Connection button for Cloudflare Pages step */}
          {showTestButton && (
            <button
              type="button"
              className="workflow-progress__step-action workflow-progress__step-action--test"
              onClick={handleTestConnectionClick}
              disabled={testConnectionLoading}
              aria-label="Test Cloudflare connection"
              title="Test Cloudflare API connection"
            >
              {testConnectionLoading ? (
                <><Loader size={14} className="workflow-progress__status-icon--running" /> Testing...</>
              ) : (
                <><Zap size={14} /> Test</>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

interface WorkflowProgressDisplayProps {
  onStepClick?: (stepId: string) => void;
  onRunStep?: (stepId: string) => void;
  onSkipStep?: (stepId: string) => void;
  onEnableStep?: (stepId: string) => void;
  onRetryStep?: (stepId: string) => void;
}

const WorkflowProgressDisplay: React.FC<WorkflowProgressDisplayProps> = ({
  onStepClick,
  onRunStep,
  onSkipStep,
  onEnableStep,
  onRetryStep,
}) => {
  const { state, actions } = useUnifiedWorkflow();
  const { exportStepResult } = useWorkflowExport();
  const { executeStep, setEditedInputDataImmediate, setGeneratedDataImmediate } = useWorkflowStepRunner();
  const { steps, currentStepId, config, isRunning, generatedData } = state;
  const { siteConfig } = config;
  const isManualMode = config.mode === 'manual';

  // State for editing step input (uses local state for UI, context for step runner)
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [localEditedInputData, setLocalEditedInputData] = useState<unknown>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cfTestLoading, setCfTestLoading] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleTestCloudflareConnection = useCallback(async () => {
    setCfTestLoading(true);
    setToast(null);
    try {
      const data = await apiClient.get<{ success: boolean; message: string }>(
        '/test-cloudflare-connection'
      );
      setToast({ type: data.success ? 'success' : 'error', message: data.message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setToast({ type: 'error', message });
    } finally {
      setCfTestLoading(false);
    }
  }, []);

  // Get steps in execution order based on deployment target
  const deploymentTarget = siteConfig.deploymentTarget || 'production';
  const executionOrder = useMemo(() =>
    getExecutionOrderByTarget(deploymentTarget),
    [deploymentTarget]
  );
  const orderedSteps = useMemo(() => {
    return executionOrder
      .map(stepId => steps.find(s => s.id === stepId))
      .filter((step): step is WorkflowStep => step !== undefined);
  }, [steps, executionOrder]);

  const handleStepClick = (stepId: string) => {
    onStepClick?.(stepId);
  };

  const handleRunStep = async (stepId: string) => {
    if (onRunStep) {
      onRunStep(stepId);
    } else {
      await actions.runStep(stepId);
    }
  };

  const handleSkipStep = (stepId: string) => {
    if (onSkipStep) {
      onSkipStep(stepId);
    } else {
      actions.skipStep(stepId);
    }
  };

  const handleEnableStep = (stepId: string) => {
    if (onEnableStep) {
      onEnableStep(stepId);
    } else {
      actions.enableStep(stepId);
    }
  };

  const handleRetryStep = async (stepId: string) => {
    if (onRetryStep) {
      onRetryStep(stepId);
    } else {
      await actions.retryStep(stepId);
    }
  };

  const handleDownloadStep = (stepId: string) => {
    exportStepResult(stepId);
  };

  // Edit input handlers for manual mode
  const handleEditInput = useCallback((stepId: string) => {
    const editData = getStepEditData(stepId, generatedData);
    console.log(`[handleEditInput] stepId="${stepId}" editData=`, editData);
    console.log(`[handleEditInput] generatedData keys:`, Object.keys(generatedData));
    setEditingStepId(stepId);
    // Always fall back to empty object so the editor panel renders for any editable step,
    // allowing users to paste data even when no upstream data exists yet
    const resolved = editData ?? {};
    console.log(`[handleEditInput] resolved (what editor will show):`, resolved);
    setLocalEditedInputData(resolved);
  }, [generatedData]);

  const handleUseOriginal = useCallback(async () => {
    if (editingStepId) {
      const stepIdToRun = editingStepId;
      setEditingStepId(null);
      setLocalEditedInputData(null);
      // Clear any previously edited data and run step with original data
      actions.clearEditedInputData();
      await actions.runStep(stepIdToRun);
    }
  }, [editingStepId, actions]);

  const handleUseEdited = useCallback(async (editedData: unknown) => {
    if (editingStepId) {
      const stepIdToRun = editingStepId;
      console.log(`[handleUseEdited] stepId="${stepIdToRun}" running step with edited data:`, editedData);
      // Store edited data immediately (bypasses async state update)
      setEditedInputDataImmediate(stepIdToRun, editedData);
      setEditingStepId(null);
      setLocalEditedInputData(null);
      // Run step with skipDependencyCheck=true since we're providing custom input
      await executeStep(stepIdToRun, true);
    }
  }, [editingStepId, setEditedInputDataImmediate, executeStep]);

  const handleSaveInput = useCallback((editedData: unknown) => {
    if (editingStepId) {
      const outputKey = getStepOutputKey(editingStepId);
      console.log(`[handleSaveInput] stepId="${editingStepId}" outputKey="${outputKey}"`);
      console.log(`[handleSaveInput] data being saved:`, editedData);
      if (outputKey) {
        // Store the pasted data under the step's OUTPUT key in generatedData.
        // Use setGeneratedDataImmediate to update both the ref and React state
        // so the next step can read it immediately without waiting for useEffect sync.
        setGeneratedDataImmediate(outputKey, editedData);
        console.log(`[handleSaveInput] stored under key="${outputKey}" and marking step completed`);
        // Mark the step as completed
        actions.setStepStatus(editingStepId, 'completed', editedData);
      }
      setEditingStepId(null);
      setLocalEditedInputData(null);
    }
  }, [editingStepId, actions, setGeneratedDataImmediate]);

  const handleCancelEdit = useCallback(() => {
    setEditingStepId(null);
    setLocalEditedInputData(null);
  }, []);

  // Get the editing step object
  const editingStep = editingStepId ? steps.find(s => s.id === editingStepId) : null;

  // Check if a step is editable (delegates to contract helper)
  const isStepEditableFn = useCallback((stepId: string): boolean => {
    return checkStepEditable(stepId);
  }, []);

  return (
    <div className="workflow-progress">
      {/* Steps in execution order with inline editor panels */}
      <div className="workflow-progress__steps-list">
        {orderedSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepItem
              step={step}
              stepIndex={index}
              isActive={currentStepId === step.id}
              canRun={actions.canRunStep(step.id)}
              onStepClick={handleStepClick}
              onRunStep={handleRunStep}
              onSkipStep={handleSkipStep}
              onEnableStep={handleEnableStep}
              onRetryStep={handleRetryStep}
              onDownloadStep={handleDownloadStep}
              onEditInput={handleEditInput}
              onTestConnection={step.id === 'provision-cloudflare-pages' ? handleTestCloudflareConnection : undefined}
              testConnectionLoading={step.id === 'provision-cloudflare-pages' ? cfTestLoading : undefined}
              isManualMode={isManualMode}
              isWorkflowRunning={isRunning}
              isEditable={isStepEditableFn(step.id)}
            />
            {/* Inline editor panel - renders below the step being edited */}
            {editingStepId === step.id && localEditedInputData !== null && (
              <div className="workflow-progress__inline-editor">
                {step.id === 'generate-sitemap' ? (
                  <GenerateSitemapEditorPanel
                    step={step}
                    scrapedPages={(generatedData.scrapeResult as ScrapeStepResult | undefined)?.pages}
                    allocatedPages={(generatedData.allocatedSitemap as AllocatedSitemapResult | undefined)?.pages}
                    siteConfig={siteConfig}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : step.id === 'generate-content' ? (
                  <GenerateContentEditorPanel
                    step={step}
                    sitemapPages={
                      (generatedData.allocatedSitemap as AllocatedSitemapResult | undefined)?.pages ||
                      (generatedData.sitemapResult as SitemapStepResult | undefined)?.pages
                    }
                    questionnaireData={(generatedData.scrapeResult as ScrapeStepResult | undefined)?.questionnaireData}
                    siteConfig={siteConfig}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : step.id === 'download-theme' ? (
                  <DownloadThemeEditorPanel
                    step={step}
                    designSystem={(generatedData.scrapeResult as ScrapeStepResult | undefined)?.designSystem}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : step.id === 'image-picker' ? (
                  <ImagePickerEditorPanel
                    step={step}
                    pageData={(generatedData.contentResult as ContentStepResult | undefined)?.pageData}
                    siteConfig={siteConfig}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : step.id === 'prevent-hotlinking' ? (
                  <PreventHotlinkingEditorPanel
                    step={step}
                    pagesData={
                      (generatedData.imagePickerResult as { pageData?: Record<string, unknown> } | undefined)?.pageData ||
                      (generatedData.contentResult as ContentStepResult | undefined)?.pageData
                    }
                    themeData={(generatedData.themeResult as { theme?: Record<string, unknown> } | undefined)?.theme}
                    provisionResult={generatedData.provisionResult as ProvisionStepResult | undefined}
                    siteConfig={siteConfig}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : step.id === 'upload-json-to-github' ? (
                  <GithubJsonEditorPanel
                    step={step}
                    pagesData={
                      (generatedData.hotlinkPagesResult as Record<string, unknown> | undefined) ||
                      (generatedData.imagePickerResult as { pageData?: Record<string, unknown> } | undefined)?.pageData ||
                      (generatedData.contentResult as ContentStepResult | undefined)?.pageData
                    }
                    globalData={(generatedData.contentResult as ContentStepResult | undefined)?.globalData}
                    themeData={
                      (generatedData.hotlinkThemeResult as Record<string, unknown> | undefined) ||
                      (generatedData.themeResult as { theme?: Record<string, unknown> } | undefined)?.theme
                    }
                    githubRepoResult={generatedData.githubRepoResult as CreateGithubRepoResult | undefined}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <InputEditorPanel
                    step={step}
                    inputData={localEditedInputData}
                    onUseOriginal={handleUseOriginal}
                    onUseEdited={handleUseEdited}
                    onSave={handleSaveInput}
                    onCancel={handleCancelEdit}
                  />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`workflow-toast workflow-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span className="workflow-toast__message">{toast.message}</span>
          <button
            type="button"
            className="workflow-toast__close"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowProgressDisplay;
