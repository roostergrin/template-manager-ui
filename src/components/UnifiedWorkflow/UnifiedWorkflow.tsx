import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
  Settings,
  Zap,
  List,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Edit3,
  FlaskConical,
  Trash2,
  Download,
} from 'lucide-react';
import { useUnifiedWorkflow } from '../../contexts/UnifiedWorkflowProvider';
import WorkflowProgressDisplay from './WorkflowProgressDisplay';
import WorkflowDiagram from './WorkflowDiagram';
import BatchModePanel from './BatchModePanel';
import InterventionPanel from './InterventionPanel';
import InputEditorPanel from './InputEditorPanel';
import PreventHotlinkingEditorPanel from './PreventHotlinkingEditorPanel';
import GithubJsonEditorPanel from './GithubJsonEditorPanel';
import ExportPanel from './ExportPanel';
import CleanupPanel from './CleanupPanel';
import ThemeJsonDebugViewer from '../ThemeJsonDebugViewer';
import { getStepEditData } from '../../constants/stepInputMappings';
import { AVAILABLE_TEMPLATES, getStepById } from '../../constants/workflowSteps';
import { WorkflowMode, SiteConfig, TemplateType } from '../../types/UnifiedWorkflowTypes';
import { WORKFLOW_STEP_IDS } from '../../constants/workflowSteps';
import { useWorkflowStepRunner } from '../../hooks/useWorkflowStepRunner';
import { useYoloMode } from '../../hooks/useYoloMode';
import { useBatchMode } from '../../hooks/useBatchMode';
import { getMockConfig, setMockConfig } from '../../mocks';
import './UnifiedWorkflow.sass';

interface ModeOption {
  id: WorkflowMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Step-by-step control',
    icon: <List size={20} />,
  },
  {
    id: 'yolo',
    label: 'YOLO',
    description: 'Automated execution',
    icon: <Zap size={20} />,
  },
  {
    id: 'batch',
    label: 'Batch',
    description: 'Process multiple sites',
    icon: <Upload size={20} />,
  },
];

interface ConfigurationPanelProps {
  config: SiteConfig;
  onConfigChange: (config: Partial<SiteConfig>) => void;
  onTemplateTypeChange?: (templateType: TemplateType) => void;
  disabled?: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
  onTemplateTypeChange,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleInputChange = (field: keyof SiteConfig, value: string | boolean) => {
    console.log('[DEBUG] handleInputChange called:', field, value);
    onConfigChange({ [field]: value });

    // Trigger template type change callback when templateType is changed
    if (field === 'templateType' && onTemplateTypeChange) {
      onTemplateTypeChange(value as TemplateType);
    }
  };

  return (
    <div className="config-panel">
      <button
        type="button"
        className="config-panel__header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle configuration panel"
      >
        <Settings size={18} />
        <span className="config-panel__title">Site Configuration</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isExpanded && (
        <div className="config-panel__content">
          <div className="config-panel__grid">
            <div className="config-panel__field">
              <label htmlFor="domain" className="config-panel__label">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                className="config-panel__input"
                value={config.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="example.com"
                disabled={disabled}
              />
            </div>

            <div className="config-panel__field">
              <label htmlFor="template" className="config-panel__label">
                Template
              </label>
              <select
                id="template"
                className="config-panel__select"
                value={config.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                disabled={disabled}
              >
                {AVAILABLE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-panel__field">
              <label htmlFor="templateType" className="config-panel__label">
                Template Type
              </label>
              <div className="config-panel__radio-group">
                <label className="config-panel__radio-label">
                  <input
                    type="radio"
                    name="templateType"
                    value="json"
                    checked={config.templateType === 'json'}
                    onChange={() => handleInputChange('templateType', 'json')}
                    disabled={disabled}
                  />
                  <span className="config-panel__radio-text">
                    <strong>JSON</strong>
                    <span className="config-panel__radio-hint">ai-template-* (no WordPress backend)</span>
                  </span>
                </label>
                <label className="config-panel__radio-label">
                  <input
                    type="radio"
                    name="templateType"
                    value="wordpress"
                    checked={config.templateType === 'wordpress'}
                    onChange={() => handleInputChange('templateType', 'wordpress')}
                    disabled={disabled}
                  />
                  <span className="config-panel__radio-text">
                    <strong>WordPress</strong>
                    <span className="config-panel__radio-hint">rg-template-* (with WordPress backend)</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="config-panel__field">
              <label htmlFor="deploymentTarget" className="config-panel__label">
                Deployment Target
              </label>
              <div className="config-panel__radio-group">
                <label className="config-panel__radio-label">
                  <input
                    type="radio"
                    name="deploymentTarget"
                    value="production"
                    checked={config.deploymentTarget !== 'demo'}
                    onChange={() => handleInputChange('deploymentTarget', 'production')}
                    disabled={disabled}
                  />
                  <span className="config-panel__radio-text">
                    <strong>Production (AWS)</strong>
                    <span className="config-panel__radio-hint">S3 + CloudFront + CodePipeline</span>
                  </span>
                </label>
                <label className="config-panel__radio-label">
                  <input
                    type="radio"
                    name="deploymentTarget"
                    value="demo"
                    checked={config.deploymentTarget === 'demo'}
                    onChange={() => handleInputChange('deploymentTarget', 'demo')}
                    disabled={disabled}
                  />
                  <span className="config-panel__radio-text">
                    <strong>Demo (Cloudflare Pages)</strong>
                    <span className="config-panel__radio-hint">demo-rooster org + Cloudflare Pages</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="config-panel__field">
              <label htmlFor="siteType" className="config-panel__label">
                Site Type
              </label>
              <select
                id="siteType"
                className="config-panel__select"
                value={config.siteType}
                onChange={(e) => handleInputChange('siteType', e.target.value)}
                disabled={disabled}
              >
                {AVAILABLE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-panel__field">
              <label htmlFor="scrapeDomain" className="config-panel__label">
                Scrape Domain <span className="config-panel__required">*</span>
              </label>
              <input
                type="text"
                id="scrapeDomain"
                className="config-panel__input"
                value={config.scrapeDomain || ''}
                onChange={(e) => handleInputChange('scrapeDomain', e.target.value)}
                placeholder="existing-site.com"
                disabled={disabled}
                required
              />
            </div>

            <div className="config-panel__field config-panel__field--checkbox">
              <label className="config-panel__checkbox-label">
                <input
                  type="checkbox"
                  checked={config.useFirecrawl ?? true}
                  onChange={(e) => handleInputChange('useFirecrawl', e.target.checked)}
                  disabled={disabled}
                />
                <span>Use Firecrawl (anti-bot + branding extraction)</span>
              </label>
            </div>

            <div className="config-panel__field">
              <label className="config-panel__label">
                Max Pages to Scrape
                <input
                  type="number"
                  className="config-panel__input"
                  value={config.maxScrapePages ?? 50}
                  onChange={(e) => handleInputChange('maxScrapePages', parseInt(e.target.value, 10) || 50)}
                  min={1}
                  max={50}
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="config-panel__field config-panel__field--checkbox">
              <label className="config-panel__checkbox-label">
                <input
                  type="checkbox"
                  checked={config.preserveDoctorPhotos}
                  onChange={(e) => handleInputChange('preserveDoctorPhotos', e.target.checked)}
                  disabled={disabled}
                />
                <span>Preserve doctor photos during image updates</span>
              </label>
            </div>

            <div className="config-panel__field config-panel__field--checkbox">
              <label className="config-panel__checkbox-label">
                <input
                  type="checkbox"
                  checked={config.enableImagePicker}
                  onChange={(e) => handleInputChange('enableImagePicker', e.target.checked)}
                  disabled={disabled}
                />
                <span>Enable Image Picker</span>
              </label>
            </div>

            <div className="config-panel__field config-panel__field--checkbox">
              <label className="config-panel__checkbox-label">
                <input
                  type="checkbox"
                  checked={config.enableHotlinking}
                  onChange={(e) => handleInputChange('enableHotlinking', e.target.checked)}
                  disabled={disabled}
                />
                <span>Enable Hotlink Protection</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NavigationLinksProps {
  domain: string;
  githubRepo?: string;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({
  domain,
  githubRepo,
}) => {
  if (!domain) return null;

  // Auto-derive WordPress admin URL from domain (e.g., example.com -> api-example-com.roostergrintemplates.com)
  const domainSlug = domain.replace(/\./g, '-');
  const wpAdminUrl = `https://api-${domainSlug}.roostergrintemplates.com/wp-admin/`;

  return (
    <div className="navigation-links">
      <h4 className="navigation-links__title">Quick Links</h4>
      <div className="navigation-links__list">
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="navigation-links__link"
        >
          <ExternalLink size={14} />
          View JSON Site
        </a>
        <a
          href={wpAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="navigation-links__link"
        >
          <ExternalLink size={14} />
          WordPress Admin
        </a>
        {githubRepo && (
          <a
            href={`https://github.com/roostergrin/${githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="navigation-links__link"
          >
            <ExternalLink size={14} />
            GitHub Repo
          </a>
        )}
      </div>
    </div>
  );
};

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

  // Mock mode state
  const [mockModeEnabled, setMockModeEnabled] = useState(() => getMockConfig().enabled);

  // Cleanup panel state
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);

  // Export panel state
  const [showExportPanel, setShowExportPanel] = useState(false);

  const handleMockModeToggle = useCallback((enabled: boolean) => {
    setMockConfig({ enabled });
    setMockModeEnabled(enabled);
  }, []);

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
    return getStepEditData(pendingPreStepInput, generatedData);
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
      <div className="unified-workflow__mode-selector">
        <h3 className="unified-workflow__mode-title">Execution Mode</h3>
        <div className="unified-workflow__mode-options">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`unified-workflow__mode-option ${mode === option.id ? 'unified-workflow__mode-option--active' : ''}`}
              onClick={() => handleModeChange(option.id)}
              disabled={isRunning}
              aria-label={`Select ${option.label} mode: ${option.description}`}
            >
              <span className="unified-workflow__mode-icon">{option.icon}</span>
              <span className="unified-workflow__mode-label">{option.label}</span>
              <span className="unified-workflow__mode-description">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mock Mode Toggle */}
      <div className="unified-workflow__mock-toggle">
        <label className="unified-workflow__mock-label">
          <input
            type="checkbox"
            checked={mockModeEnabled}
            onChange={(e) => handleMockModeToggle(e.target.checked)}
            disabled={isRunning}
          />
          <FlaskConical size={16} />
          <span>Mock Mode</span>
          <span className="unified-workflow__mock-hint">
            (use fake data, no backend required)
          </span>
        </label>
      </div>

      {/* Workflow Diagram - shows execution order and deliverables */}
      <WorkflowDiagram />

      {/* Configuration Panel - shown for manual and yolo modes */}
      {mode !== 'batch' && (
        <ConfigurationPanel
          config={siteConfig}
          onConfigChange={actions.setSiteConfig}
          onTemplateTypeChange={handleTemplateTypeChange}
          disabled={isRunning}
        />
      )}

      {/* Batch Mode Panel */}
      {mode === 'batch' && (
        <BatchModePanel
          onProcessSite={executeStep}
          disabled={isRunning}
        />
      )}

      {/* Theme JSON Debug Viewer - shows when design system data is available */}
      {(generatedData.scrapeResult as { design_system?: Record<string, unknown> } | undefined)?.design_system && (
        <div className="unified-workflow__theme-debug">
          <ThemeJsonDebugViewer
            designSystem={(generatedData.scrapeResult as { design_system: Record<string, unknown> }).design_system as import('../DesignSystemViewer').DesignSystem}
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="unified-workflow__controls">
        {!isRunning ? (
          <button
            type="button"
            className="unified-workflow__control-btn unified-workflow__control-btn--start"
            onClick={handleStartWorkflow}
            disabled={(!siteConfig.domain || !siteConfig.scrapeDomain) && mode !== 'batch'}
            aria-label="Start workflow"
          >
            <Play size={18} />
            {mode === 'yolo' ? 'Start YOLO Mode' : mode === 'batch' ? 'Start Batch' : 'Start Workflow'}
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                type="button"
                className="unified-workflow__control-btn unified-workflow__control-btn--resume"
                onClick={handleResumeWorkflow}
                aria-label="Resume workflow"
              >
                <Play size={18} />
                Resume
              </button>
            ) : (
              <button
                type="button"
                className="unified-workflow__control-btn unified-workflow__control-btn--pause"
                onClick={handlePauseWorkflow}
                aria-label="Pause workflow"
              >
                <Pause size={18} />
                Pause
              </button>
            )}
            <button
              type="button"
              className="unified-workflow__control-btn unified-workflow__control-btn--stop"
              onClick={handleStopWorkflow}
              aria-label="Stop workflow"
            >
              <Square size={18} />
              Stop
            </button>
          </>
        )}
        {lastExecutedStep && !isRunning && (
          <button
            type="button"
            className="unified-workflow__control-btn unified-workflow__control-btn--retry"
            onClick={handleRetryLastStep}
            aria-label={`Retry step: ${lastExecutedStep.name}`}
          >
            <RefreshCw size={18} />
            Retry {lastExecutedStep.name}
          </button>
        )}
        <button
          type="button"
          className="unified-workflow__control-btn unified-workflow__control-btn--reset"
          onClick={handleResetWorkflow}
          aria-label="Reset workflow"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>

      {/* YOLO Mode Options */}
      {mode === 'yolo' && (
        <div className="unified-workflow__yolo-options">
          {/* Intervention Mode Toggle */}
          <div className="unified-workflow__intervention-toggle">
            <label className="unified-workflow__intervention-label">
              <input
                type="checkbox"
                checked={interventionMode}
                onChange={(e) => handleInterventionToggle(e.target.checked)}
                disabled={isRunning}
              />
              <Eye size={16} />
              <span>Intervention Mode</span>
              <span className="unified-workflow__intervention-hint">
                (pause after each step for inspection)
              </span>
            </label>
          </div>

          {/* Pre-Step Input Editing Toggle */}
          <div className="unified-workflow__prestep-toggle">
            <label className="unified-workflow__prestep-label">
              <input
                type="checkbox"
                checked={preStepPauseEnabled}
                onChange={(e) => handlePreStepPauseToggle(e.target.checked)}
                disabled={isRunning}
              />
              <Edit3 size={16} />
              <span>Pre-Step Editing</span>
              <span className="unified-workflow__prestep-hint">
                (edit input data before each step)
              </span>
            </label>
          </div>

          {/* Export Button */}
          <div className="unified-workflow__export-toggle">
            <button
              type="button"
              className="unified-workflow__export-btn"
              onClick={() => setShowExportPanel(true)}
              aria-label="Open export panel"
            >
              <Download size={16} />
              <span>Export Data</span>
            </button>
          </div>
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

      {/* Export Panel Modal */}
      {showExportPanel && (
        <div className="unified-workflow__export-overlay">
          <ExportPanel onClose={() => setShowExportPanel(false)} />
        </div>
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

      {/* Cleanup Button - always available when not running */}
      {!isRunning && (
        <div className="unified-workflow__cleanup-section">
          <button
            type="button"
            className="unified-workflow__cleanup-btn"
            onClick={() => setShowCleanupPanel(true)}
            aria-label="Open cleanup panel to delete provisioned infrastructure"
          >
            <Trash2 size={18} />
            {siteConfig.domain ? (
              <>Cleanup <strong>{siteConfig.domain}</strong></>
            ) : (
              'Cleanup Infrastructure'
            )}
          </button>
          <span className="unified-workflow__cleanup-hint">
            {siteConfig.domain
              ? 'Delete AWS resources and GitHub repo for this domain'
              : 'Delete AWS resources and GitHub repo for any domain'}
          </span>
        </div>
      )}

      {/* Cleanup Panel Modal */}
      {showCleanupPanel && (
        <div className="unified-workflow__cleanup-overlay">
          <CleanupPanel onClose={() => setShowCleanupPanel(false)} />
        </div>
      )}
    </div>
  );
};

export default UnifiedWorkflow;
