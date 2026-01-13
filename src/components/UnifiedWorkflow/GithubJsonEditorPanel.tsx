import React, { useState, useCallback, useEffect } from 'react';
import { Github, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep, CreateGithubRepoResult } from '../../types/UnifiedWorkflowTypes';

interface GithubJsonEditorPanelProps {
  step: WorkflowStep;
  pagesData: Record<string, unknown> | undefined;
  globalData: Record<string, unknown> | undefined;
  themeData: Record<string, unknown> | undefined;
  githubRepoResult: CreateGithubRepoResult | undefined;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const GithubJsonEditorPanel: React.FC<GithubJsonEditorPanelProps> = ({
  step,
  pagesData,
  globalData,
  themeData,
  githubRepoResult,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Configuration state
  const [owner, setOwner] = useState(githubRepoResult?.owner || 'roostergrin');
  const [repo, setRepo] = useState(githubRepoResult?.repo || '');
  const [branch, setBranch] = useState('master');

  // JSON data state
  const [pagesJson, setPagesJson] = useState(
    JSON.stringify(pagesData || {}, null, 2)
  );
  const [globalDataJson, setGlobalDataJson] = useState(
    JSON.stringify(globalData || {}, null, 2)
  );
  const [themeJson, setThemeJson] = useState(
    JSON.stringify(themeData || {}, null, 2)
  );

  // Validation state
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [globalDataError, setGlobalDataError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalPagesJson = JSON.stringify(pagesData || {}, null, 2);
  const originalGlobalDataJson = JSON.stringify(globalData || {}, null, 2);
  const originalThemeJson = JSON.stringify(themeData || {}, null, 2);

  // Update change detection
  useEffect(() => {
    const pagesChanged = pagesJson !== originalPagesJson;
    const globalDataChanged = globalDataJson !== originalGlobalDataJson;
    const themeChanged = themeJson !== originalThemeJson;
    setHasChanges(pagesChanged || globalDataChanged || themeChanged);
  }, [pagesJson, globalDataJson, themeJson, originalPagesJson, originalGlobalDataJson, originalThemeJson]);

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

  const handleGlobalDataJsonChange = useCallback((value: string) => {
    setGlobalDataJson(value);
    try {
      JSON.parse(value);
      setGlobalDataError(null);
    } catch (e) {
      setGlobalDataError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleThemeJsonChange = useCallback((value: string) => {
    setThemeJson(value);
    if (!value.trim()) {
      setThemeError(null);
      return;
    }
    try {
      JSON.parse(value);
      setThemeError(null);
    } catch (e) {
      setThemeError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleRunStep = useCallback(() => {
    // Validate all JSON fields
    let parsedPages: Record<string, unknown>;
    let parsedGlobalData: Record<string, unknown>;
    let parsedTheme: Record<string, unknown> | undefined;

    try {
      parsedPages = JSON.parse(pagesJson);
    } catch {
      setPagesError('Invalid JSON - cannot run step');
      return;
    }

    try {
      parsedGlobalData = JSON.parse(globalDataJson);
    } catch {
      setGlobalDataError('Invalid JSON - cannot run step');
      return;
    }

    if (themeJson.trim()) {
      try {
        parsedTheme = JSON.parse(themeJson);
      } catch {
        setThemeError('Invalid JSON - cannot run step');
        return;
      }
    }

    const editedData = {
      pages: parsedPages,
      globalData: parsedGlobalData,
      theme: parsedTheme,
      config: {
        owner,
        repo,
        branch,
      },
    };

    onUseEdited(editedData);
  }, [pagesJson, globalDataJson, themeJson, owner, repo, branch, onUseEdited]);

  const isValid = !pagesError && !globalDataError && !themeError;
  const hasNoPagesData = !pagesData || Object.keys(pagesData).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--github">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Github size={20} className="input-editor-panel__icon" />
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
        <p>Upload pages.json, globalData.json, and theme.json to GitHub repository</p>
      </div>

      {/* Configuration Section */}
      <div className="input-editor-panel__config-section">
        <h5 className="input-editor-panel__section-title">GitHub Repository</h5>
        <div className="input-editor-panel__config-grid">
          <div className="input-editor-panel__config-field">
            <label htmlFor="github-owner">Owner *</label>
            <input
              id="github-owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="roostergrin"
              aria-label="GitHub repository owner"
            />
          </div>

          <div className="input-editor-panel__config-field">
            <label htmlFor="github-repo">Repository *</label>
            <input
              id="github-repo"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="ai-template-example-com"
              aria-label="GitHub repository name"
            />
          </div>

          <div className="input-editor-panel__config-field">
            <label htmlFor="github-branch">Branch</label>
            <input
              id="github-branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="master"
              aria-label="Git branch"
            />
          </div>
        </div>
      </div>

      {hasNoPagesData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No page data from previous steps. Paste your JSON content below.</span>
        </div>
      )}

      {/* JSON Editors Section */}
      <div className="input-editor-panel__json-section">
        <div className="input-editor-panel__json-grid input-editor-panel__json-grid--three">
          {/* Pages JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="pages-json">
              pages.json *
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
            <small>Page content uploaded to data/pages.json</small>
          </div>

          {/* GlobalData JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="globaldata-json">
              globalData.json *
              {globalDataError && (
                <span className="input-editor-panel__error-badge">{globalDataError}</span>
              )}
            </label>
            <textarea
              id="globaldata-json"
              value={globalDataJson}
              onChange={(e) => handleGlobalDataJsonChange(e.target.value)}
              placeholder='{"siteName": "...", "navigation": [...]}'
              aria-label="Global data JSON"
              className={globalDataError ? 'input-editor-panel__textarea--error' : ''}
            />
            <small>Global site data uploaded to data/globalData.json</small>
          </div>

          {/* Theme JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="theme-json">
              theme.json
              {themeError && (
                <span className="input-editor-panel__error-badge">{themeError}</span>
              )}
            </label>
            <textarea
              id="theme-json"
              value={themeJson}
              onChange={(e) => handleThemeJsonChange(e.target.value)}
              placeholder='{"colors": {...}, "fonts": {...}}'
              aria-label="Theme JSON data"
              className={themeError ? 'input-editor-panel__textarea--error' : ''}
            />
            <small>Theme config uploaded to data/theme.json (optional)</small>
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
          {!hasNoPagesData && (
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
            disabled={!isValid || !owner.trim() || !repo.trim()}
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

export default GithubJsonEditorPanel;
