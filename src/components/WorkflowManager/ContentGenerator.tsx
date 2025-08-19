import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateContentQueryFunction } from '../../services/generateContentService';
import { generateGlobalQueryFunction } from '../../services/generateGlobalService';
import { GenerateContentRequest } from '../../types/APIServiceTypes';
import { getEffectiveQuestionnaireData, isMarkdownData } from '../../utils/questionnaireDataUtils';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import './ContentGenerator.sass';

interface ContentGeneratorProps {
  onContentGenerated?: (pagesContent: object, globalContent: object) => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  onContentGenerated
}) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [useRgTemplateAssets, setUseRgTemplateAssets] = useState(true);
  const [pagesContent, setPagesContent] = useState<Record<string, unknown> | null>(null);
  const [globalContent, setGlobalContent] = useState<Record<string, unknown> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'generate' | 'upload'>('generate');

  const queryClient = useQueryClient();

  // Use contexts instead of props
  const { state: questionnaireState } = useQuestionnaire();
  const { state: sitemapState } = useSitemap();
  const { state: appConfigState } = useAppConfig();

  // Extract data from contexts
  const questionnaireData = questionnaireState.data;
  const pages = sitemapState.pages;
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  // Get the effective questionnaire data (memoized to avoid identity changes)
  const effectiveQuestionnaireData = useMemo(() => getEffectiveQuestionnaireData(questionnaireData), [questionnaireData]);

  // File upload handlers
  const validateContentStructure = useCallback((content: any, type: 'pages' | 'global'): string | null => {
    if (type === 'pages') {
      // Basic validation for pages content
      if (typeof content !== 'object' || Array.isArray(content)) {
        return 'Pages content must be an object with page data';
      }
      
      // Handle both direct format { "8": [...] } and wrapped format { "pages": { "8": [...] } }
      const actualPagesData = content?.pages || content;
      
      // Check if the actual pages data is valid
      if (typeof actualPagesData !== 'object' || Array.isArray(actualPagesData)) {
        return 'Pages data must be an object with page IDs as keys';
      }
      
      // Check if it has at least one page
      const keys = Object.keys(actualPagesData);
      if (keys.length === 0) {
        return 'Pages content appears to be empty';
      }
      
      return null; // Valid
    } else {
      // Basic validation for global content
      if (typeof content !== 'object' || Array.isArray(content)) {
        return 'Global content must be an object with global data';
      }
      
      return null; // Valid
    }
  }, []);

  const handleFileUpload = useCallback((file: File, type: 'pages' | 'global') => {
    setUploadError(null);
    
    if (!file.name.endsWith('.json')) {
      setUploadError(`Please upload a valid JSON file for ${type} content.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        
        // Validate the content structure
        const validationError = validateContentStructure(content, type);
        if (validationError) {
          setUploadError(`Invalid ${type} content structure: ${validationError}`);
          return;
        }

        if (type === 'pages') {
          // Extract just the pages data from uploaded content (remove the "pages" wrapper if present)
          const actualPagesData = content?.pages || content;
          console.log('📁 Uploaded pages file - Raw content keys:', Object.keys(content));
          console.log('📁 Uploaded pages file - Extracted pages data keys:', Object.keys(actualPagesData));
          setPagesContent(actualPagesData);
        } else {
          setGlobalContent(content);
        }
      } catch (error) {
        setUploadError(`Error parsing ${type} JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }, [validateContentStructure]);

  const handlePagesFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'pages');
    }
  }, [handleFileUpload]);

  const handleGlobalFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'global');
    }
  }, [handleFileUpload]);

  const handleClearUploads = useCallback(() => {
    setPagesContent(null);
    setGlobalContent(null);
    setUploadError(null);
    // Clear file inputs
    const pagesInput = document.getElementById('pages-upload') as HTMLInputElement;
    const globalInput = document.getElementById('global-upload') as HTMLInputElement;
    if (pagesInput) pagesInput.value = '';
    if (globalInput) globalInput.value = '';
  }, []);

  // Stable request snapshot captured at generation start
  const [requestSnapshot, setRequestSnapshot] = useState<GenerateContentRequest | null>(null);

  // Fetch global content
  const {
    data: globalData,
    status: globalStatus,
    error: globalError,
  } = useQuery({
    queryKey: ['generate-global', requestSnapshot as GenerateContentRequest],
    queryFn: generateGlobalQueryFunction,
    enabled: shouldFetch && !!requestSnapshot,
  });

  // Fetch pages content
  const {
    data: pagesData,
    status: pagesStatus,
    error: pagesError,
  } = useQuery({
    queryKey: ['generate-content', requestSnapshot as GenerateContentRequest],
    queryFn: generateContentQueryFunction,
    enabled: shouldFetch && !!requestSnapshot,
  });

  // Debug logging for query states
  useEffect(() => {
    console.log('🔍 Content Generator Debug:');
    console.log('📊 shouldFetch:', shouldFetch);
    console.log('🔄 isStarted:', isStarted);
    console.log('📝 Pages Status:', pagesStatus);
    console.log('🌐 Global Status:', globalStatus);
    console.log('📄 Pages Data:', pagesData ? 'Present' : 'Missing');
    console.log('🌍 Global Data:', globalData ? 'Present' : 'Missing');
    console.log('❌ Pages Error:', pagesError?.message || 'None');
    console.log('❌ Global Error:', globalError?.message || 'None');
    console.log('🔑 Request Snapshot:', requestSnapshot);
  }, [shouldFetch, isStarted, pagesStatus, globalStatus, pagesData, globalData, pagesError, globalError, requestSnapshot]);

  // Handle successful content generation
  useEffect(() => {
    console.log('📝 Pages useEffect FIRED - Status:', pagesStatus, 'Data present:', !!pagesData);
    console.log('📝 Pages useEffect - pagesData type:', typeof pagesData, 'keys:', pagesData ? Object.keys(pagesData) : 'none');
    if (pagesStatus === 'success' && pagesData) {
      // Extract just the pages data from the API response (remove the "pages" wrapper)
      const actualPagesData = (pagesData as any)?.pages || pagesData;
      console.log('✅ Setting pages content (extracted from API response):', Object.keys(actualPagesData));
      console.log('🔍 Raw API response keys:', Object.keys(pagesData));
      console.log('🔍 Extracted pages data keys:', Object.keys(actualPagesData));
      setPagesContent(actualPagesData);
    } else {
      console.log('❌ Not setting pages content - status:', pagesStatus, 'data:', !!pagesData);
    }
  }, [pagesStatus, pagesData]);

  useEffect(() => {
    console.log('🌐 Global useEffect FIRED - Status:', globalStatus, 'Data present:', !!globalData);
    if (globalStatus === 'success' && globalData) {
      const extracted = (globalData as any)?.global_data ?? (globalData as unknown as Record<string, unknown>);
      setGlobalContent(extracted);
    }
  }, [globalStatus, globalData]);

  // Notify parent when both contents are ready
  useEffect(() => {
    if (pagesContent && globalContent && onContentGenerated) {
      onContentGenerated(pagesContent, globalContent);
    }
  }, [pagesContent, globalContent]);

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
    console.log('🚀 Starting content generation...');
    
    // Invalidate existing queries to force fresh requests
    queryClient.invalidateQueries({ queryKey: ['generate-content'] });
    queryClient.invalidateQueries({ queryKey: ['generate-global'] });
    console.log('🧹 Invalidated React Query cache');
    
    // Capture stable snapshot of the request
    const snapshot: GenerateContentRequest = {
      sitemap_data: {
        pages,
        questionnaireData: effectiveQuestionnaireData,
      },
      site_type: siteType,
      assign_images: useRgTemplateAssets,
    };
    setRequestSnapshot(snapshot);

    setIsStarted(true);
    setShouldFetch(true);
    setPagesContent(null);
    setGlobalContent(null);
    
    console.log('🧹 Clearing previous content states');
  }, [queryClient, pages, effectiveQuestionnaireData, siteType, useRgTemplateAssets]);

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

      {/* Mode Selection */}
      <div className="mode-selection">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${uploadMode === 'generate' ? 'mode-tab--active' : ''}`}
            onClick={() => setUploadMode('generate')}
          >
            🤖 Generate Content
          </button>
          <button
            className={`mode-tab ${uploadMode === 'upload' ? 'mode-tab--active' : ''}`}
            onClick={() => setUploadMode('upload')}
          >
            📁 Upload Content
          </button>
        </div>
      </div>

      {uploadMode === 'generate' ? (
        <>
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
        </>
      ) : (
        <>
          {/* Manual Upload Section */}
          <div className="upload-section">
            <div className="upload-info">
              <h4>📁 Upload Pre-Generated Content</h4>
              <p>Upload your previously generated content JSON files to skip the generation process.</p>
            </div>

            <div className="upload-controls">
              <div className="upload-group">
                <label htmlFor="pages-upload" className="upload-label">
                  📄 Pages Content (JSON)
                </label>
                <input
                  type="file"
                  id="pages-upload"
                  accept=".json"
                  onChange={handlePagesFileChange}
                  className="file-input"
                />
                {pagesContent && (
                  <span className="upload-status upload-status--success">
                    ✅ Pages content loaded
                  </span>
                )}
              </div>

              <div className="upload-group">
                <label htmlFor="global-upload" className="upload-label">
                  🌐 Global Content (JSON)
                </label>
                <input
                  type="file"
                  id="global-upload"
                  accept=".json"
                  onChange={handleGlobalFileChange}
                  className="file-input"
                />
                {globalContent && (
                  <span className="upload-status upload-status--success">
                    ✅ Global content loaded
                  </span>
                )}
              </div>
            </div>

            {/* Sample Structure Guide */}
            <details className="sample-structure">
              <summary>💡 View Expected JSON Structure</summary>
              <div className="structure-content">
                <div className="structure-example">
                  <h6>Pages Content Structure:</h6>
                  <pre>{`{
  "homepage": {
    "hero": {
      "title": "Your Practice Name",
      "subtitle": "Tagline here",
      "content": "Main content..."
    }
  },
  "about": {
    "title": "About Us",
    "content": "About page content..."
  }
}`}</pre>
                </div>
                <div className="structure-example">
                  <h6>Global Content Structure:</h6>
                  <pre>{`{
  "practice_name": "Your Practice",
  "phone": "123-456-7890",
  "address": "123 Main St",
  "colors": {
    "primary": "#007bff",
    "secondary": "#6c757d"
  }
}`}</pre>
                </div>
              </div>
            </details>

            {(pagesContent || globalContent) && (
              <button
                className="clear-button"
                onClick={handleClearUploads}
              >
                🗑️ Clear Uploaded Content
              </button>
            )}
          </div>
        </>
      )}

      {/* Upload Error Display */}
      {uploadError && (
        <div className="error-section">
          <div className="error-message">
            <strong>Upload Error:</strong> {uploadError}
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="status-section">
        <div className="status-item">
          <span className="status-label">Pages Content:</span>
          <span className={`status-value ${pagesContent ? 'status-value--success' : `status-value--${pagesStatus}`}`}>
            {pagesContent ? 'loaded' : pagesStatus === 'pending' ? 'generating' : pagesStatus === 'error' ? 'error' : 'idle'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Global Content:</span>
          <span className={`status-value ${globalContent ? 'status-value--success' : `status-value--${globalStatus}`}`}>
            {globalContent ? 'loaded' : globalStatus === 'pending' ? 'generating' : globalStatus === 'error' ? 'error' : 'idle'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {hasError && uploadMode === 'generate' && (
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
      {(isComplete || (pagesContent && globalContent)) && (
        <div className="success-section">
          <h4>✅ Content {uploadMode === 'upload' ? 'Uploaded' : 'Generated'} Successfully!</h4>
          
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

          {uploadMode === 'upload' && (
            <div className="upload-success-info">
              <p>💡 <strong>Tip:</strong> Your uploaded content is now ready to be used in the Repository Updater and WordPress Updater sections.</p>
            </div>
          )}

          {uploadMode === 'generate' && (
            <div className="generation-success-info">
              <p>💡 <strong>Next Steps:</strong> Your generated content is now ready! You can download the JSON files or proceed to the WordPress Updater section to push this content to your site.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;