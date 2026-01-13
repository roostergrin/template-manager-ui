import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep, ProvisionStepResult, SiteConfig } from '../../types/UnifiedWorkflowTypes';

interface PreventHotlinkingEditorPanelProps {
  step: WorkflowStep;
  pagesData: Record<string, unknown> | undefined;
  themeData: Record<string, unknown> | undefined;
  provisionResult: ProvisionStepResult | undefined;
  siteConfig: SiteConfig;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const PreventHotlinkingEditorPanel: React.FC<PreventHotlinkingEditorPanelProps> = ({
  step,
  pagesData,
  themeData,
  provisionResult,
  siteConfig,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Configuration state
  const [siteIdentifier, setSiteIdentifier] = useState(
    siteConfig.domain?.replace(/\./g, '-') || ''
  );
  const [bucketName, setBucketName] = useState(provisionResult?.bucket || '');
  const [cloudFrontDomain, setCloudFrontDomain] = useState(
    provisionResult?.assets_cdn_domain || ''
  );

  // JSON data state
  const [pagesJson, setPagesJson] = useState(
    JSON.stringify(pagesData || {}, null, 2)
  );
  const [themeJson, setThemeJson] = useState(
    JSON.stringify(themeData || {}, null, 2)
  );

  // Validation state
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalPagesJson = JSON.stringify(pagesData || {}, null, 2);
  const originalThemeJson = JSON.stringify(themeData || {}, null, 2);

  // Update change detection
  useEffect(() => {
    const pagesChanged = pagesJson !== originalPagesJson;
    const themeChanged = themeJson !== originalThemeJson;
    setHasChanges(pagesChanged || themeChanged);
  }, [pagesJson, themeJson, originalPagesJson, originalThemeJson]);

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
    let parsedTheme: Record<string, unknown> | undefined;

    try {
      parsedPages = JSON.parse(pagesJson);
    } catch {
      setPagesError('Invalid JSON - cannot run step');
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
      theme: parsedTheme,
      config: {
        siteIdentifier,
        bucketName: bucketName || siteIdentifier,
        cloudFrontDomain,
      },
    };

    onUseEdited(editedData);
  }, [pagesJson, themeJson, siteIdentifier, bucketName, cloudFrontDomain, onUseEdited]);

  const isValid = !pagesError && !themeError;
  const hasNoPagesData = !pagesData || Object.keys(pagesData).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--hotlinking">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Shield size={20} className="input-editor-panel__icon" />
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
        <p>Sync images to S3 and replace URLs with CloudFront CDN URLs</p>
      </div>

      {/* Configuration Section */}
      <div className="input-editor-panel__config-section">
        <h5 className="input-editor-panel__section-title">Configuration</h5>
        <div className="input-editor-panel__config-grid">
          <div className="input-editor-panel__config-field">
            <label htmlFor="site-identifier">Site Identifier *</label>
            <input
              id="site-identifier"
              type="text"
              value={siteIdentifier}
              onChange={(e) => setSiteIdentifier(e.target.value)}
              placeholder="e.g., example-com"
              aria-label="Site identifier for S3 prefix"
            />
            <small>Used as prefix for S3 filenames</small>
          </div>

          <div className="input-editor-panel__config-field">
            <label htmlFor="bucket-name">S3 Bucket Name</label>
            <input
              id="bucket-name"
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="Uses site identifier if empty"
              aria-label="S3 bucket name"
            />
            <small>Leave empty to use site identifier</small>
          </div>

          <div className="input-editor-panel__config-field">
            <label htmlFor="cloudfront-domain">CloudFront Domain</label>
            <input
              id="cloudfront-domain"
              type="text"
              value={cloudFrontDomain}
              onChange={(e) => setCloudFrontDomain(e.target.value)}
              placeholder="e.g., d123abc.cloudfront.net"
              aria-label="CloudFront distribution domain"
            />
            <small>From provision step (optional)</small>
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
        <div className="input-editor-panel__json-grid">
          {/* Pages JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="pages-json">
              Pages JSON *
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
            <small>Page data with image URLs to sync to S3</small>
          </div>

          {/* Theme JSON */}
          <div className="input-editor-panel__json-field">
            <label htmlFor="theme-json">
              Theme JSON
              {themeError && (
                <span className="input-editor-panel__error-badge">{themeError}</span>
              )}
            </label>
            <textarea
              id="theme-json"
              value={themeJson}
              onChange={(e) => handleThemeJsonChange(e.target.value)}
              placeholder='{"logo_url": "...", "favicon_url": "..."}'
              aria-label="Theme JSON data"
              className={themeError ? 'input-editor-panel__textarea--error' : ''}
            />
            <small>Theme data with logo/favicon URLs (optional)</small>
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
            disabled={!isValid || !siteIdentifier.trim()}
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

export default PreventHotlinkingEditorPanel;
