import React, { useMemo, useState, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  SkipForward,
  Play,
  Loader,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Database,
  FileText,
  Server,
  Globe,
  Layout,
  Image,
  Shield,
  Upload,
  Palette,
  Map,
  Download,
  Edit3,
} from 'lucide-react';
import { useUnifiedWorkflow } from '../../contexts/UnifiedWorkflowProvider';
import { WorkflowStep, WorkflowStepStatus, WorkflowProgressEvent } from '../../types/UnifiedWorkflowTypes';
import { getYoloExecutionOrder, WORKFLOW_STEP_IDS } from '../../constants/workflowSteps';
import { useWorkflowExport } from '../../hooks/useWorkflowExport';
import { useWorkflowStepRunner } from '../../hooks/useWorkflowStepRunner';
import { STEP_INPUT_MAPPINGS, getStepInputData } from '../../constants/stepInputMappings';
import JsonViewer from './JsonViewer';
import InputEditorPanel from './InputEditorPanel';
import PreventHotlinkingEditorPanel from './PreventHotlinkingEditorPanel';
import GithubJsonEditorPanel from './GithubJsonEditorPanel';
import GenerateSitemapEditorPanel from './GenerateSitemapEditorPanel';
import GenerateContentEditorPanel from './GenerateContentEditorPanel';
import DownloadThemeEditorPanel from './DownloadThemeEditorPanel';
import ImagePickerEditorPanel from './ImagePickerEditorPanel';
import { ProvisionStepResult, CreateGithubRepoResult, ScrapeStepResult, SitemapStepResult, AllocatedSitemapResult, ContentStepResult } from '../../types/UnifiedWorkflowTypes';

// Step metadata with icons and deliverables
const STEP_METADATA: Record<string, {
  icon: React.ReactNode;
  outputs: string[];
  phase: 'infrastructure' | 'planning' | 'deployment';
}> = {
  'create-github-repo': {
    icon: <Globe size={16} />,
    outputs: ['repo_url', 'owner', 'repo_name'],
    phase: 'infrastructure',
  },
  'provision-wordpress-backend': {
    icon: <Database size={16} />,
    outputs: ['api_domain', 'credentials'],
    phase: 'infrastructure',
  },
  'provision-site': {
    icon: <Server size={16} />,
    outputs: ['bucket', 'cloudfront_id', 'pipeline_name'],
    phase: 'infrastructure',
  },
  'scrape-site': {
    icon: <Globe size={16} />,
    outputs: ['pages', 'global_markdown', 'style_overview'],
    phase: 'planning',
  },
  'create-vector-store': {
    icon: <Database size={16} />,
    outputs: ['vector_store_id'],
    phase: 'planning',
  },
  'select-template': {
    icon: <Layout size={16} />,
    outputs: ['template', 'default sitemap'],
    phase: 'planning',
  },
  'allocate-content': {
    icon: <FileText size={16} />,
    outputs: ['allocatedSitemap', 'allocated_markdown'],
    phase: 'planning',
  },
  'generate-sitemap': {
    icon: <Map size={16} />,
    outputs: ['sitemapResult.pages'],
    phase: 'planning',
  },
  'generate-content': {
    icon: <FileText size={16} />,
    outputs: ['pageData', 'globalData'],
    phase: 'planning',
  },
  'download-theme': {
    icon: <Palette size={16} />,
    outputs: ['theme.json'],
    phase: 'planning',
  },
  'image-picker': {
    icon: <Image size={16} />,
    outputs: ['updated pageData'],
    phase: 'planning',
  },
  'prevent-hotlinking': {
    icon: <Shield size={16} />,
    outputs: ['S3 policy'],
    phase: 'infrastructure',
  },
  'export-to-wordpress': {
    icon: <Upload size={16} />,
    outputs: ['WP pages updated'],
    phase: 'deployment',
  },
  'second-pass': {
    icon: <CheckCircle size={16} />,
    outputs: ['IDs fixed', 'a11y fixed'],
    phase: 'deployment',
  },
  'upload-logo': {
    icon: <Image size={16} />,
    outputs: ['logoUrl'],
    phase: 'deployment',
  },
  'upload-favicon': {
    icon: <Image size={16} />,
    outputs: ['faviconUrl'],
    phase: 'deployment',
  },
};

const PHASE_COLORS = {
  infrastructure: '#3b82f6',
  planning: '#8b5cf6',
  deployment: '#10b981',
};

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
  isManualMode: boolean;
  isWorkflowRunning: boolean;
  showDeliverables: boolean;
  isEditable?: boolean;
}

const StepStatusIcon: React.FC<{ status: WorkflowStepStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="workflow-progress__status-icon workflow-progress__status-icon--completed" size={18} />;
    case 'in_progress':
      return <Loader className="workflow-progress__status-icon workflow-progress__status-icon--running" size={18} />;
    case 'error':
      return <AlertCircle className="workflow-progress__status-icon workflow-progress__status-icon--error" size={18} />;
    case 'skipped':
      return <SkipForward className="workflow-progress__status-icon workflow-progress__status-icon--skipped" size={18} />;
    default:
      return <Clock className="workflow-progress__status-icon workflow-progress__status-icon--pending" size={18} />;
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
  isManualMode,
  isWorkflowRunning,
  showDeliverables,
  isEditable,
}) => {
  const metadata = STEP_METADATA[step.id];
  const phaseColor = metadata ? PHASE_COLORS[metadata.phase] : '#6c7086';

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

  return (
    <div className="workflow-progress__step-wrapper">
      <div
        className={`workflow-progress__step ${isActive ? 'workflow-progress__step--active' : ''} workflow-progress__step--${step.status}`}
        onClick={() => onStepClick(step.id)}
        onKeyDown={(e) => e.key === 'Enter' && onStepClick(step.id)}
        tabIndex={0}
        role="button"
        aria-label={`Step ${stepIndex + 1}: ${step.name}, Status: ${step.status}`}
        style={{ borderLeftColor: phaseColor }}
      >
        <div className="workflow-progress__step-number" style={{ backgroundColor: phaseColor }}>
          {stepIndex + 1}
        </div>

        <div className="workflow-progress__step-icon">
          {step.status === 'in_progress' ? (
            <StepStatusIcon status={step.status} />
          ) : step.status === 'completed' ? (
            <StepStatusIcon status={step.status} />
          ) : step.status === 'error' ? (
            <StepStatusIcon status={step.status} />
          ) : (
            metadata?.icon || <StepStatusIcon status={step.status} />
          )}
        </div>

        <div className="workflow-progress__step-content">
          <div className="workflow-progress__step-header">
            <span className="workflow-progress__step-name">{step.name}</span>
            <span className="workflow-progress__step-phase" style={{ color: phaseColor }}>
              {metadata?.phase}
            </span>
          </div>
          <p className="workflow-progress__step-description">{step.description}</p>

          {step.actualDurationSeconds !== undefined && (
            <span className="workflow-progress__step-duration">
              {formatDuration(step.actualDurationSeconds)}
            </span>
          )}

          {step.error && (
            <p className="workflow-progress__step-error">{step.error}</p>
          )}
        </div>

        <div className="workflow-progress__step-actions">
          {/* Download button for completed steps - always visible */}
          {step.status === 'completed' && step.result && (
            <button
              type="button"
              className="workflow-progress__step-action workflow-progress__step-action--download"
              onClick={handleDownloadClick}
              aria-label={`Download ${step.name} result`}
              title="Download JSON"
            >
              <Download size={14} />
            </button>
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
        </div>
      </div>

      {/* Deliverables connector */}
      {showDeliverables && metadata?.outputs && step.status === 'completed' && (
        <div className="workflow-progress__deliverables">
          <ArrowDown size={14} className="workflow-progress__deliverables-arrow" />
          <div className="workflow-progress__deliverables-tags">
            {metadata.outputs.map((output, i) => (
              <span key={i} className="workflow-progress__deliverable-tag">
                {output}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActivityLogProps {
  events: WorkflowProgressEvent[];
  maxEvents?: number;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ events, maxEvents = 20 }) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const displayedEvents = events.slice(0, maxEvents);

  const toggleExpand = useCallback((eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusClass = (status: WorkflowStepStatus): string => {
    switch (status) {
      case 'completed':
        return 'activity-log__event--completed';
      case 'in_progress':
        return 'activity-log__event--running';
      case 'error':
        return 'activity-log__event--error';
      case 'skipped':
        return 'activity-log__event--skipped';
      default:
        return '';
    }
  };

  if (displayedEvents.length === 0) {
    return (
      <div className="activity-log activity-log--empty">
        <p className="activity-log__empty-message">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="activity-log">
      <h4 className="activity-log__title">Activity Log</h4>
      <ul className="activity-log__list">
        {displayedEvents.map((event) => {
          const hasDetails = event.details && Object.keys(event.details).length > 0;
          const isExpanded = expandedEvents.has(event.id);

          return (
            <li
              key={event.id}
              className={`activity-log__event ${getStatusClass(event.status)} ${hasDetails ? 'activity-log__event--expandable' : ''}`}
            >
              <div
                className="activity-log__event-header"
                onClick={() => hasDetails && toggleExpand(event.id)}
                onKeyDown={(e) => e.key === 'Enter' && hasDetails && toggleExpand(event.id)}
                tabIndex={hasDetails ? 0 : -1}
                role={hasDetails ? 'button' : undefined}
                aria-expanded={hasDetails ? isExpanded : undefined}
                aria-label={hasDetails ? `${event.message} - click to ${isExpanded ? 'collapse' : 'expand'} details` : undefined}
              >
                <span className="activity-log__time">[{formatTime(event.timestamp)}]</span>
                <span className="activity-log__message">{event.message}</span>
                {hasDetails && (
                  <span className="activity-log__expand-icon">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
              </div>
              {hasDetails && isExpanded && (
                <div className="activity-log__details">
                  <JsonViewer
                    data={event.details}
                    maxStringLength={100}
                    initialExpanded={false}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
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
  const { executeStep, setEditedInputDataImmediate } = useWorkflowStepRunner();
  const { steps, currentStepId, progressEvents, config, isRunning, generatedData } = state;
  const { siteConfig } = config;
  const isManualMode = config.mode === 'manual';
  const [showDeliverables, setShowDeliverables] = useState(true);

  // State for editing step input (uses local state for UI, context for step runner)
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [localEditedInputData, setLocalEditedInputData] = useState<unknown>(null);

  const progress = useMemo(() => actions.getProgress(), [actions]);

  // Get steps in execution order
  const executionOrder = getYoloExecutionOrder();
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
    const inputData = getStepInputData(stepId, generatedData);
    setEditingStepId(stepId);
    // For specialized panels, we set localEditedInputData to empty object so the panel renders
    const specializedPanelSteps = [
      'generate-sitemap',
      'generate-content',
      'download-theme',
      'image-picker',
      'prevent-hotlinking',
      'upload-json-to-github',
    ];
    const hasSpecializedPanel = specializedPanelSteps.includes(stepId);
    setLocalEditedInputData(inputData ?? (hasSpecializedPanel ? {} : null));
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
      // Store edited data immediately (bypasses async state update)
      setEditedInputDataImmediate(stepIdToRun, editedData);
      setEditingStepId(null);
      setLocalEditedInputData(null);
      // Run step with skipDependencyCheck=true since we're providing custom input
      await executeStep(stepIdToRun, true);
    }
  }, [editingStepId, setEditedInputDataImmediate, executeStep]);

  const handleCancelEdit = useCallback(() => {
    setEditingStepId(null);
    setLocalEditedInputData(null);
  }, []);

  // Get the editing step object
  const editingStep = editingStepId ? steps.find(s => s.id === editingStepId) : null;

  // Check if a step is editable
  const isStepEditable = useCallback((stepId: string): boolean => {
    const mapping = STEP_INPUT_MAPPINGS[stepId];
    return mapping?.editable === true;
  }, []);

  return (
    <div className="workflow-progress">
      {/* Overall Progress Bar */}
      <div className="workflow-progress__header">
        <div className="workflow-progress__header-row">
          <h3 className="workflow-progress__title">Site Generation Progress</h3>
          <label className="workflow-progress__toggle">
            <input
              type="checkbox"
              checked={showDeliverables}
              onChange={(e) => setShowDeliverables(e.target.checked)}
            />
            <span>Show deliverables</span>
          </label>
        </div>
        <div className="workflow-progress__bar-container">
          <div className="workflow-progress__bar">
            <div
              className="workflow-progress__bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="workflow-progress__percentage">{progress.percentage}%</span>
        </div>
        <p className="workflow-progress__summary">
          {progress.completed} of {progress.total} steps completed
        </p>
      </div>

      {/* Legend */}
      <div className="workflow-progress__legend">
        <span className="workflow-progress__legend-item">
          <span className="workflow-progress__legend-dot" style={{ backgroundColor: PHASE_COLORS.infrastructure }} />
          Infrastructure
        </span>
        <span className="workflow-progress__legend-item">
          <span className="workflow-progress__legend-dot" style={{ backgroundColor: PHASE_COLORS.planning }} />
          Planning
        </span>
        <span className="workflow-progress__legend-item">
          <span className="workflow-progress__legend-dot" style={{ backgroundColor: PHASE_COLORS.deployment }} />
          Deployment
        </span>
      </div>

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
              isManualMode={isManualMode}
              isWorkflowRunning={isRunning}
              showDeliverables={showDeliverables && index < orderedSteps.length - 1}
              isEditable={isStepEditable(step.id)}
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
                    onCancel={handleCancelEdit}
                  />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Activity Log */}
      <ActivityLog events={progressEvents} maxEvents={10} />
    </div>
  );
};

export default WorkflowProgressDisplay;
