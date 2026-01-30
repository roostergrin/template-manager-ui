import React, { useState, useCallback, useEffect } from 'react';
import { Map, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep, SiteConfig } from '../../types/UnifiedWorkflowTypes';

interface GenerateSitemapEditorPanelProps {
  step: WorkflowStep;
  scrapedPages: Record<string, unknown> | undefined;
  allocatedPages: Record<string, unknown> | undefined;
  siteConfig: SiteConfig;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const GenerateSitemapEditorPanel: React.FC<GenerateSitemapEditorPanelProps> = ({
  step,
  scrapedPages,
  allocatedPages,
  siteConfig,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Use allocated pages if available, otherwise scraped pages
  const initialPages = allocatedPages || scrapedPages;

  // Configuration state
  const [siteType, setSiteType] = useState(siteConfig.siteType || 'stinson');

  // JSON data state
  const [pagesJson, setPagesJson] = useState(
    JSON.stringify(initialPages || {}, null, 2)
  );

  // Validation state
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalPagesJson = JSON.stringify(initialPages || {}, null, 2);

  // Update change detection
  useEffect(() => {
    setHasChanges(pagesJson !== originalPagesJson);
  }, [pagesJson, originalPagesJson]);

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

  const handleRunStep = useCallback(() => {
    let parsedPages: Record<string, unknown>;

    try {
      parsedPages = JSON.parse(pagesJson);
    } catch {
      setPagesError('Invalid JSON - cannot run step');
      return;
    }

    const editedData = {
      pages: parsedPages,
      config: {
        siteType,
      },
    };

    onUseEdited(editedData);
  }, [pagesJson, siteType, onUseEdited]);

  const isValid = !pagesError;
  const hasNoData = !initialPages || Object.keys(initialPages).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--sitemap">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Map size={20} className="input-editor-panel__icon" />
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
        <p>Generate sitemap structure from scraped or allocated pages</p>
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
              aria-label="Site type for sitemap generation"
            />
            <small>Template type for sitemap structure</small>
          </div>
        </div>
      </div>

      {hasNoData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No scraped pages from previous steps. Paste your JSON content below.</span>
        </div>
      )}

      {/* JSON Editor Section */}
      <div className="input-editor-panel__json-section">
        <div className="input-editor-panel__json-field input-editor-panel__json-field--full">
          <label htmlFor="pages-json">
            Scraped/Allocated Pages *
            {pagesError && (
              <span className="input-editor-panel__error-badge">{pagesError}</span>
            )}
          </label>
          <textarea
            id="pages-json"
            value={pagesJson}
            onChange={(e) => handlePagesJsonChange(e.target.value)}
            placeholder='{"home": {...}, "about": {...}}'
            aria-label="Pages JSON data"
            className={pagesError ? 'input-editor-panel__textarea--error' : ''}
          />
          <small>Page content to generate sitemap from</small>
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

export default GenerateSitemapEditorPanel;
