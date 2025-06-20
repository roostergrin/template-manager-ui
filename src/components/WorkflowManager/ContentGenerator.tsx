import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import generateContentService from '../../services/generateContentService';
import generateGlobalService from '../../services/generateGlobalService';
import { GenerateContentRequest } from '../../types/APIServiceTypes';
import { getEffectiveQuestionnaireData, isMarkdownData } from '../../utils/questionnaireDataUtils';
import './ContentGenerator.sass';

interface ContentGeneratorProps {
  pages: unknown;
  questionnaireData: unknown;
  siteType: string;
  onContentGenerated?: (pagesContent: object, globalContent: object) => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  pages,
  questionnaireData,
  siteType,
  onContentGenerated
}) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [useRgTemplateAssets, setUseRgTemplateAssets] = useState(true);
  const [pagesContent, setPagesContent] = useState<object | null>(null);
  const [globalContent, setGlobalContent] = useState<object | null>(null);

  // Get the effective questionnaire data
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);

  // Prepare request object
  const req: GenerateContentRequest = {
    sitemap_data: {
      pages,
      questionnaireData: effectiveQuestionnaireData,
    },
    site_type: siteType,
    assign_images: useRgTemplateAssets,
  };

  // Fetch global content
  const {
    data: globalData,
    status: globalStatus,
    error: globalError,
  } = useQuery({
    queryKey: ['generate-global', req],
    queryFn: generateGlobalService,
    enabled: shouldFetch,
  });

  // Fetch pages content
  const {
    data: pagesData,
    status: pagesStatus,
    error: pagesError,
  } = useQuery({
    queryKey: ['generate-content', req],
    queryFn: generateContentService,
    enabled: shouldFetch,
  });

  // Handle successful content generation
  useEffect(() => {
    if (pagesStatus === 'success' && pagesData) {
      setPagesContent(pagesData);
    }
  }, [pagesStatus, pagesData]);

  useEffect(() => {
    if (globalStatus === 'success' && globalData) {
      setGlobalContent(globalData);
    }
  }, [globalStatus, globalData]);

  // Notify parent when both contents are ready
  useEffect(() => {
    if (pagesContent && globalContent && onContentGenerated) {
      onContentGenerated(pagesContent, globalContent);
    }
  }, [pagesContent, globalContent, onContentGenerated]);

  // Reset to idle after both queries complete
  useEffect(() => {
    if (
      isStarted &&
      (pagesStatus === 'success' || pagesStatus === 'error') &&
      (globalStatus === 'success' || globalStatus === 'error')
    ) {
      setIsStarted(false);
      setShouldFetch(false);
    }
  }, [isStarted, pagesStatus, globalStatus]);

  const handleGenerateContent = useCallback(() => {
    setIsStarted(true);
    setShouldFetch(true);
    setPagesContent(null);
    setGlobalContent(null);
  }, []);

  const handleUseRgTemplateAssetsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUseRgTemplateAssets(event.target.checked);
  }, []);

  const createDownloadUrl = useCallback((content: object, filename: string) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadPages = useCallback(() => {
    if (pagesContent) {
      createDownloadUrl(pagesContent, 'pages-content.json');
    }
  }, [pagesContent, createDownloadUrl]);

  const handleDownloadGlobal = useCallback(() => {
    if (globalContent) {
      createDownloadUrl(globalContent, 'global-content.json');
    }
  }, [globalContent, createDownloadUrl]);

  const isGenerating = isStarted && (pagesStatus === 'pending' || globalStatus === 'pending');
  const hasError = pagesStatus === 'error' || globalStatus === 'error';
  const isComplete = pagesStatus === 'success' && globalStatus === 'success';

  return (
    <div className="content-generator">
      {/* Data Source Indicator */}
      {isMarkdownData(questionnaireData) && (
        <div className="markdown-info">
          <p>
            <strong>📝 Using Markdown Data Source:</strong> Content generation will use the markdown content as questionnaire data.
          </p>
        </div>
      )}

      {/* Options */}
      <div className="options-section">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="use-rg-template-assets"
            checked={useRgTemplateAssets}
            onChange={handleUseRgTemplateAssetsChange}
          />
          <label htmlFor="use-rg-template-assets">
            Use images from rg-templates-assets
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="generate-button"
        onClick={handleGenerateContent}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating Content...' : 'Generate Content'}
      </button>

      {/* Status Display */}
      <div className="status-section">
        <div className="status-item">
          <span className="status-label">Pages Content:</span>
          <span className={`status-value status-value--${pagesStatus}`}>
            {isStarted ? pagesStatus : 'idle'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Global Content:</span>
          <span className={`status-value status-value--${globalStatus}`}>
            {isStarted ? globalStatus : 'idle'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="error-section">
          {pagesError && (
            <div className="error-message">
              <strong>Pages Error:</strong> {pagesError.message}
            </div>
          )}
          {globalError && (
            <div className="error-message">
              <strong>Global Error:</strong> {globalError.message}
            </div>
          )}
        </div>
      )}

      {/* Success Display */}
      {isComplete && (
        <div className="success-section">
          <h4>✅ Content Generated Successfully!</h4>
          
          {/* Content Previews */}
          <div className="content-previews">
            {pagesContent && (
              <div className="preview-block">
                <div className="preview-header">
                  <h5>Pages Content Preview</h5>
                  <button className="download-button" onClick={handleDownloadPages}>
                    📥 Download Pages
                  </button>
                </div>
                <pre className="content-preview">
                  {JSON.stringify(pagesContent, null, 2).substring(0, 300)}...
                </pre>
              </div>
            )}

            {globalContent && (
              <div className="preview-block">
                <div className="preview-header">
                  <h5>Global Content Preview</h5>
                  <button className="download-button" onClick={handleDownloadGlobal}>
                    📥 Download Global
                  </button>
                </div>
                <pre className="content-preview">
                  {JSON.stringify(globalContent, null, 2).substring(0, 300)}...
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator; 