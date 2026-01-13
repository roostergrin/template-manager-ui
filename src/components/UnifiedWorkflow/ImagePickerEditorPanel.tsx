import React, { useState, useCallback, useEffect } from 'react';
import { Image, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep, SiteConfig } from '../../types/UnifiedWorkflowTypes';

interface ImagePickerEditorPanelProps {
  step: WorkflowStep;
  pageData: Record<string, unknown> | undefined;
  siteConfig: SiteConfig;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const ImagePickerEditorPanel: React.FC<ImagePickerEditorPanelProps> = ({
  step,
  pageData,
  siteConfig,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Configuration state
  const [preserveDoctorPhotos, setPreserveDoctorPhotos] = useState(
    siteConfig.preserveDoctorPhotos ?? true
  );

  // JSON data state
  const [pageDataJson, setPageDataJson] = useState(
    JSON.stringify(pageData || {}, null, 2)
  );

  // Validation state
  const [pageDataError, setPageDataError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for change detection
  const originalPageDataJson = JSON.stringify(pageData || {}, null, 2);

  // Update change detection
  useEffect(() => {
    setHasChanges(pageDataJson !== originalPageDataJson);
  }, [pageDataJson, originalPageDataJson]);

  // Validate JSON on change
  const handlePageDataJsonChange = useCallback((value: string) => {
    setPageDataJson(value);
    try {
      JSON.parse(value);
      setPageDataError(null);
    } catch (e) {
      setPageDataError(e instanceof SyntaxError ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleRunStep = useCallback(() => {
    let parsedPageData: Record<string, unknown>;

    try {
      parsedPageData = JSON.parse(pageDataJson);
    } catch {
      setPageDataError('Invalid JSON - cannot run step');
      return;
    }

    const editedData = {
      pageData: parsedPageData,
      config: {
        preserveDoctorPhotos,
      },
    };

    onUseEdited(editedData);
  }, [pageDataJson, preserveDoctorPhotos, onUseEdited]);

  const isValid = !pageDataError;
  const hasNoData = !pageData || Object.keys(pageData).length === 0;

  return (
    <div className="input-editor-panel input-editor-panel--image-picker">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Image size={20} className="input-editor-panel__icon" />
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
        <p>Update images in page content while preserving doctor photos</p>
      </div>

      {/* Configuration Section */}
      <div className="input-editor-panel__config-section">
        <h5 className="input-editor-panel__section-title">Configuration</h5>
        <div className="input-editor-panel__config-grid">
          <div className="input-editor-panel__config-field">
            <label className="input-editor-panel__checkbox-wrapper">
              <input
                type="checkbox"
                checked={preserveDoctorPhotos}
                onChange={(e) => setPreserveDoctorPhotos(e.target.checked)}
              />
              <span>Preserve Doctor Photos</span>
            </label>
            <small>Keep existing doctor/staff photos during image updates</small>
          </div>
        </div>
      </div>

      {hasNoData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No page data from content generation. Paste your JSON content below.</span>
        </div>
      )}

      {/* JSON Editor Section */}
      <div className="input-editor-panel__json-section">
        <div className="input-editor-panel__json-field input-editor-panel__json-field--full">
          <label htmlFor="page-data-json">
            Page Data *
            {pageDataError && (
              <span className="input-editor-panel__error-badge">{pageDataError}</span>
            )}
          </label>
          <textarea
            id="page-data-json"
            value={pageDataJson}
            onChange={(e) => handlePageDataJsonChange(e.target.value)}
            placeholder='{"home": {...}, "about": {...}}'
            aria-label="Page data JSON"
            className={pageDataError ? 'input-editor-panel__textarea--error' : ''}
          />
          <small>Generated page content with image placeholders</small>
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

export default ImagePickerEditorPanel;
