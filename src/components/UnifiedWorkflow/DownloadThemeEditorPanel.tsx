import React, { useState, useCallback, useEffect } from 'react';
import { Palette, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep } from '../../types/UnifiedWorkflowTypes';

interface DownloadThemeEditorPanelProps {
  step: WorkflowStep;
  designSystem: Record<string, unknown> | undefined;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const DownloadThemeEditorPanel: React.FC<DownloadThemeEditorPanelProps> = ({
  step,
  designSystem,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // JSON data state
  const [designSystemJson, setDesignSystemJson] = useState(
    JSON.stringify(designSystem || {}, null, 2)
  );

  // Validation state
  const [designSystemError, setDesignSystemError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalDesignSystemJson = JSON.stringify(designSystem || {}, null, 2);

  // Update change detection
  useEffect(() => {
    setHasChanges(designSystemJson !== originalDesignSystemJson);
  }, [designSystemJson, originalDesignSystemJson]);

  // Validate JSON on change
  const handleDesignSystemJsonChange = useCallback((value: string) => {
    setDesignSystemJson(value);
    try {
      JSON.parse(value);
      setDesignSystemError(null);
    } catch (e) {
      setDesignSystemError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleRunStep = useCallback(() => {
    let parsedDesignSystem: Record<string, unknown>;

    try {
      parsedDesignSystem = JSON.parse(designSystemJson);
    } catch {
      setDesignSystemError('Invalid JSON - cannot run step');
      return;
    }

    const editedData = {
      designSystem: parsedDesignSystem,
    };

    onUseEdited(editedData);
  }, [designSystemJson, onUseEdited]);

  const isValid = !designSystemError;
  const hasNoData = !designSystem || Object.keys(designSystem).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--theme">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Palette size={20} className="input-editor-panel__icon" />
          <h4 className="input-editor-panel__title">
            Edit Input: {step.name}
          </h4>
        </div>
        <button
          type="button"
          className="input-editor-panel__close"
          onClick={onCancel}
          aria-label="Cancel and stop workflow"
        >
          <X size={20} />
        </button>
      </div>

      <div className="input-editor-panel__description">
        <p>Generate theme.json from design system extracted during scraping</p>
      </div>

      {hasNoData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No design system from scrape step. Paste your JSON content below.</span>
        </div>
      )}

      {/* JSON Editor Section */}
      <div className="input-editor-panel__json-section">
        <div className="input-editor-panel__json-field input-editor-panel__json-field--full">
          <label htmlFor="design-system-json">
            Design System *
            {designSystemError && (
              <span className="input-editor-panel__error-badge">{designSystemError}</span>
            )}
          </label>
          <textarea
            id="design-system-json"
            value={designSystemJson}
            onChange={(e) => handleDesignSystemJsonChange(e.target.value)}
            placeholder='{"colors": {...}, "fonts": {...}, "logo_url": "..."}'
            aria-label="Design system JSON data"
            className={designSystemError ? 'input-editor-panel__textarea--error' : ''}
          />
          <small>Design tokens (colors, fonts, logos) to generate theme.json</small>
        </div>
      </div>

      <div className="input-editor-panel__footer">
        <div className="input-editor-panel__status">
          {hasChanges && isValid && (
            <span className="input-editor-panel__changes-badge">
              Changes pending
            </span>
          )}
        </div>

        <div className="input-editor-panel__actions">
          <button
            type="button"
            className="input-editor-panel__btn input-editor-panel__btn--cancel"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X size={16} />
            Cancel
          </button>
          {!hasNoData && (
            <button
              type="button"
              className="input-editor-panel__btn input-editor-panel__btn--skip"
              onClick={onUseOriginal}
              aria-label="Use original data"
            >
              <SkipForward size={16} />
              Use Original
            </button>
          )}
          <button
            type="button"
            className="input-editor-panel__btn input-editor-panel__btn--continue"
            onClick={handleRunStep}
            disabled={!isValid}
            aria-label="Run step with this data"
          >
            <Play size={16} />
            Run Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadThemeEditorPanel;
