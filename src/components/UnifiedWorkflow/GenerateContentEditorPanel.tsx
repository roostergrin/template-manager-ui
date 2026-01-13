import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep, SiteConfig } from '../../types/UnifiedWorkflowTypes';

interface GenerateContentEditorPanelProps {
  step: WorkflowStep;
  sitemapPages: Record<string, unknown> | undefined;
  questionnaireData: Record<string, unknown> | undefined;
  siteConfig: SiteConfig;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const GenerateContentEditorPanel: React.FC<GenerateContentEditorPanelProps> = ({
  step,
  sitemapPages,
  questionnaireData,
  siteConfig,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Configuration state
  const [siteType, setSiteType] = useState(siteConfig.siteType || 'stinson');
  const [assignImages, setAssignImages] = useState(true);

  // JSON data state
  const [pagesJson, setPagesJson] = useState(
    JSON.stringify(sitemapPages || {}, null, 2)
  );
  const [questionnaireJson, setQuestionnaireJson] = useState(
    JSON.stringify(questionnaireData || {}, null, 2)
  );

  // Validation state
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalPagesJson = JSON.stringify(sitemapPages || {}, null, 2);
  const originalQuestionnaireJson = JSON.stringify(questionnaireData || {}, null, 2);

  // Update change detection
  useEffect(() => {
    const pagesChanged = pagesJson !== originalPagesJson;
    const questionnaireChanged = questionnaireJson !== originalQuestionnaireJson;
    setHasChanges(pagesChanged || questionnaireChanged);
  }, [pagesJson, questionnaireJson, originalPagesJson, originalQuestionnaireJson]);

  // Validate JSON on change
  const handlePagesJsonChange = useCallback((value: string) => {
    setPagesJson(value);
    try {
      JSON.parse(value);
      setPagesError(null);
    } catch (e) {
      setPagesError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleQuestionnaireJsonChange = useCallback((value: string) => {
    setQuestionnaireJson(value);
    if (!value.trim()) {
      setQuestionnaireError(null);
      return;
    }
    try {
      JSON.parse(value);
      setQuestionnaireError(null);
    } catch (e) {
      setQuestionnaireError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleRunStep = useCallback(() => {
    let parsedPages: Record<string, unknown>;
    let parsedQuestionnaire: Record<string, unknown> | undefined;

    try {
      parsedPages = JSON.parse(pagesJson);
    } catch {
      setPagesError('Invalid JSON - cannot run step');
      return;
    }

    if (questionnaireJson.trim()) {
      try {
        parsedQuestionnaire = JSON.parse(questionnaireJson);
      } catch {
        setQuestionnaireError('Invalid JSON - cannot run step');
        return;
      }
    }

    const editedData = {
      pages: parsedPages,
      questionnaireData: parsedQuestionnaire,
      config: {
        siteType,
        assignImages,
      },
    };

    onUseEdited(editedData);
  }, [pagesJson, questionnaireJson, siteType, assignImages, onUseEdited]);

  const isValid = !pagesError && !questionnaireError;
  const hasNoData = !sitemapPages || Object.keys(sitemapPages).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--content">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <FileText size={20} className="input-editor-panel__icon" />
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
        <p>Generate page content from sitemap structure</p>
      </div>

      {/* Configuration Section */}
      <div className="input-editor-panel__config-section">
        <h5 className="input-editor-panel__section-title">Configuration</h5>
        <div className="input-editor-panel__config-grid">
          <div className="input-editor-panel__config-field">
            <label htmlFor="site-type">Site Type</label>
            <input
              id="site-type"
              type="text"
              value={siteType}
              onChange={(e) => setSiteType(e.target.value)}
              placeholder="e.g., stinson, dental"
              aria-label="Site type for content generation"
            />
            <small>Template type for content structure</small>
          </div>
          <div className="input-editor-panel__config-field">
            <label className="input-editor-panel__checkbox-wrapper">
              <input
                type="checkbox"
                checked={assignImages}
                onChange={(e) => setAssignImages(e.target.checked)}
              />
              <span>Assign Images</span>
            </label>
            <small>Auto-assign images to content sections</small>
          </div>
        </div>
      </div>

      {hasNoData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No sitemap pages from previous steps. Paste your JSON content below.</span>
        </div>
      )}

      {/* JSON Editors Section */}
      <div className="input-editor-panel__json-section">
        <div className="input-editor-panel__json-grid">
          {/* Sitemap Pages JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="pages-json">
              Sitemap Pages *
              {pagesError && (
                <span className="input-editor-panel__error-badge">{pagesError}</span>
              )}
            </label>
            <textarea
              id="pages-json"
              value={pagesJson}
              onChange={(e) => handlePagesJsonChange(e.target.value)}
              placeholder='{"home": {...}, "about": {...}}'
              aria-label="Sitemap pages JSON"
              className={pagesError ? 'input-editor-panel__textarea--error' : ''}
            />
            <small>Sitemap structure for content generation</small>
          </div>

          {/* Questionnaire JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="questionnaire-json">
              Questionnaire Data
              {questionnaireError && (
                <span className="input-editor-panel__error-badge">{questionnaireError}</span>
              )}
            </label>
            <textarea
              id="questionnaire-json"
              value={questionnaireJson}
              onChange={(e) => handleQuestionnaireJsonChange(e.target.value)}
              placeholder='{"practice_name": "...", "services": [...]}'
              aria-label="Questionnaire JSON data"
              className={questionnaireError ? 'input-editor-panel__textarea--error' : ''}
            />
            <small>Business info for content personalization (optional)</small>
          </div>
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

export default GenerateContentEditorPanel;
