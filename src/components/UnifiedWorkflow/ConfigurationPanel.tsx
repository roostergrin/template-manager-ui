import React, { useState, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SiteConfig, TemplateType, WorkflowMode, WorkflowStep } from '../../types/UnifiedWorkflowTypes';
import { AVAILABLE_TEMPLATES } from '../../constants/workflowSteps';

export interface ConfigurationPanelProps {
  config: SiteConfig;
  onConfigChange: (config: Partial<SiteConfig>) => void;
  onTemplateTypeChange?: (templateType: TemplateType) => void;
  onImagePickerToggle?: (enabled: boolean) => void;
  steps: WorkflowStep[];
  disabled?: boolean;
  interventionMode?: boolean;
  onInterventionToggle?: (enabled: boolean) => void;
  preStepPauseEnabled?: boolean;
  onPreStepPauseToggle?: (enabled: boolean) => void;
  onStartWorkflow?: () => void;
  onResetWorkflow?: () => void;
  mode?: WorkflowMode;
  canStart?: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
  onTemplateTypeChange,
  onImagePickerToggle,
  steps,
  disabled = false,
  interventionMode = false,
  onInterventionToggle,
  preStepPauseEnabled = false,
  onPreStepPauseToggle,
  onStartWorkflow,
  onResetWorkflow,
  mode: workflowMode,
  canStart = true,
}) => {
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  const estimatedMinutes = useMemo(() => {
    let totalSeconds = steps
      .filter(s => s.status !== 'skipped')
      .reduce((sum, s) => sum + s.estimatedDurationSeconds, 0);

    // Model adjustment: nano is ~4x faster for content gen (300s -> 75s)
    if (config.contentModel === 'gpt-5-nano') {
      totalSeconds -= 225;
    }

    // Home page only: content gen drops from 300s to ~50s
    if (config.homePageOnly) {
      totalSeconds -= 250;
    }

    // Both combined shouldn't double-count content gen savings
    if (config.contentModel === 'gpt-5-nano' && config.homePageOnly) {
      totalSeconds += 200; // add back overlap (only subtract ~275 total, not 475)
    }

    // Real-world overhead: API latency, retries, queuing add ~2x
    totalSeconds = Math.round(totalSeconds * 2);

    return Math.max(1, Math.round(totalSeconds / 60));
  }, [steps, config.contentModel, config.homePageOnly]);

  const [domainManuallyEdited, setDomainManuallyEdited] = useState(false);

  const handleInputChange = (field: keyof SiteConfig, value: string | boolean | number) => {
    console.log('[DEBUG] handleInputChange called:', field, value);
    const updates: Partial<SiteConfig> = { [field]: value };

    // Auto-fill domain from scrapeDomain unless user has manually edited domain
    // Strips protocol, www, trailing slashes, then derives a short name:
    //   https://www.drcraigortho.com/ -> drcraigortho
    //   https://example.net -> example-net
    //   example.org/path -> example-org
    if (field === 'scrapeDomain' && !domainManuallyEdited && typeof value === 'string') {
      let cleaned = value.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
      if (cleaned) {
        const parts = cleaned.split('.');
        const tld = parts.length > 1 ? parts[parts.length - 1] : '';
        const name = parts.slice(0, -1).join('');
        updates.domain = tld === 'com' || !tld ? name : `${name}-${tld}`;
      } else {
        updates.domain = '';
      }
    }

    if (field === 'domain') {
      setDomainManuallyEdited(true);
    }

    onConfigChange(updates);

    // Trigger template type change callback when templateType is changed
    if (field === 'templateType' && onTemplateTypeChange) {
      onTemplateTypeChange(value as TemplateType);
    }
  };

  return (
    <div className="config-panel-v2">
      <div className="config-panel-v2__cards">
        {/* Site Details */}
        <div className="config-panel-v2__card config-panel-v2__card--site">
          <div className="config-panel-v2__card-body">
            <div className="config-panel-v2__field">
              <label htmlFor="scrapeDomain" className="config-panel-v2__label">
                Scrape Domain <span className="config-panel-v2__required">*</span>
              </label>
              <input
                type="text"
                id="scrapeDomain"
                className="config-panel-v2__input"
                value={config.scrapeDomain || ''}
                onChange={(e) => handleInputChange('scrapeDomain', e.target.value)}
                placeholder="existing-site.com"
                disabled={disabled}
                required
              />
            </div>
            <div className="config-panel-v2__field">
              <label htmlFor="domain" className="config-panel-v2__label">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                className="config-panel-v2__input"
                value={config.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="example.com"
                disabled={disabled}
              />
            </div>

            {onStartWorkflow && !disabled && (
              <div className="config-panel-v2__actions">
                <button
                  type="button"
                  className="config-panel-v2__start-btn"
                  onClick={onStartWorkflow}
                  disabled={!canStart}
                >
                  <Play size={16} />
                  {workflowMode === 'yolo' ? 'Start YOLO Mode' : workflowMode === 'batch' ? 'Start Batch' : 'Start Workflow'}
                </button>
                {onResetWorkflow && (
                  <button
                    type="button"
                    className="config-panel-v2__reset-btn"
                    onClick={onResetWorkflow}
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Options - inline row */}
        <div className="config-panel-v2__options-row">
          <select
            id="contentModel"
            className="config-panel-v2__select config-panel-v2__select--inline"
            value={config.contentModel || 'gpt-5-mini'}
            onChange={(e) => handleInputChange('contentModel', e.target.value)}
            disabled={disabled}
          >
            <option value="gpt-5-mini">gpt-5-mini</option>
            <option value="gpt-5-nano">gpt-5-nano</option>
          </select>

          <div className="config-panel-v2__toggle-row">
            <label className="config-panel-v2__toggle">
              <input
                type="checkbox"
                checked={config.homePageOnly || false}
                onChange={(e) => handleInputChange('homePageOnly', e.target.checked)}
                disabled={disabled}
              />
              <span className="config-panel-v2__toggle-track" />
            </label>
            <span className="config-panel-v2__toggle-text">Home page only</span>
          </div>

          <div className="config-panel-v2__toggle-row">
            <label className="config-panel-v2__toggle">
              <input
                type="checkbox"
                checked={!config.enableImagePicker}
                onChange={(e) => {
                  const skipImagePicker = e.target.checked;
                  handleInputChange('enableImagePicker', !skipImagePicker);
                  onImagePickerToggle?.(!skipImagePicker);
                }}
                disabled={disabled}
              />
              <span className="config-panel-v2__toggle-track" />
            </label>
            <span className="config-panel-v2__toggle-text">Skip images</span>
          </div>

          <span className="config-panel-v2__time-pill">
            <Clock size={14} />
            ~{estimatedMinutes} min
          </span>
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="config-panel-v2__card config-panel-v2__card--advanced">
        <button
          type="button"
          className="config-panel-v2__card-header config-panel-v2__card-header--clickable"
          onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
          aria-expanded={isAdvancedExpanded}
        >
          <h3 className="config-panel-v2__card-title">Advanced</h3>
          {isAdvancedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedExpanded && (
          <div className="config-panel-v2__card-body">
            <div className="config-panel-v2__advanced-grid">
              <div className="config-panel-v2__field">
                <label htmlFor="template" className="config-panel-v2__label">
                  Template
                </label>
                <select
                  id="template"
                  className="config-panel-v2__select"
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

              <div className="config-panel-v2__field">
                <label htmlFor="templateType" className="config-panel-v2__label">
                  Template Type
                </label>
                <select
                  id="templateType"
                  className="config-panel-v2__select"
                  value={config.templateType}
                  onChange={(e) => handleInputChange('templateType', e.target.value)}
                  disabled={disabled}
                >
                  <option value="json">JSON (static site)</option>
                  <option value="wordpress">WordPress (CMS backend)</option>
                </select>
              </div>

              <div className="config-panel-v2__field">
                <label htmlFor="deploymentTarget" className="config-panel-v2__label">
                  Deployment Target
                </label>
                <select
                  id="deploymentTarget"
                  className="config-panel-v2__select"
                  value={config.deploymentTarget || 'production'}
                  onChange={(e) => handleInputChange('deploymentTarget', e.target.value)}
                  disabled={disabled}
                >
                  <option value="production">Production (AWS)</option>
                  <option value="demo">Demo (Cloudflare Pages)</option>
                </select>
              </div>

              <div className="config-panel-v2__field">
                <label htmlFor="maxScrapePages" className="config-panel-v2__label">
                  Max Pages
                </label>
                <input
                  type="number"
                  id="maxScrapePages"
                  className="config-panel-v2__input"
                  value={config.maxScrapePages ?? 50}
                  onChange={(e) => handleInputChange('maxScrapePages', parseInt(e.target.value, 10) || 50)}
                  min={1}
                  max={50}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="config-panel-v2__toggles">
              <div className="config-panel-v2__toggle-row">
                <label className="config-panel-v2__toggle">
                  <input
                    type="checkbox"
                    checked={config.useFirecrawl ?? true}
                    onChange={(e) => handleInputChange('useFirecrawl', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="config-panel-v2__toggle-track" />
                </label>
                <span className="config-panel-v2__toggle-text">Use Firecrawl</span>
              </div>

              <div className="config-panel-v2__toggle-row">
                <label className="config-panel-v2__toggle">
                  <input
                    type="checkbox"
                    checked={config.preserveDoctorPhotos}
                    onChange={(e) => handleInputChange('preserveDoctorPhotos', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="config-panel-v2__toggle-track" />
                </label>
                <span className="config-panel-v2__toggle-text">Preserve doctor photos</span>
              </div>

              <div className="config-panel-v2__toggle-row">
                <label className="config-panel-v2__toggle">
                  <input
                    type="checkbox"
                    checked={config.enableHotlinking}
                    onChange={(e) => handleInputChange('enableHotlinking', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="config-panel-v2__toggle-track" />
                </label>
                <span className="config-panel-v2__toggle-text">Enable hotlink protection</span>
              </div>

              <div className="config-panel-v2__toggle-row">
                <label className="config-panel-v2__toggle">
                  <input
                    type="checkbox"
                    checked={interventionMode}
                    onChange={(e) => onInterventionToggle?.(e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="config-panel-v2__toggle-track" />
                </label>
                <span className="config-panel-v2__toggle-text">Intervention mode</span>
              </div>

              <div className="config-panel-v2__toggle-row">
                <label className="config-panel-v2__toggle">
                  <input
                    type="checkbox"
                    checked={preStepPauseEnabled}
                    onChange={(e) => onPreStepPauseToggle?.(e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="config-panel-v2__toggle-track" />
                </label>
                <span className="config-panel-v2__toggle-text">Pre-step editing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPanel;
