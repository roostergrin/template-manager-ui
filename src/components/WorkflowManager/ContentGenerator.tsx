import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateContentQueryFunction } from '../../services/generateContentService';
import { generateGlobalQueryFunction } from '../../services/generateGlobalService';
import { GenerateContentRequest } from '../../types/APIServiceTypes';
import { getEffectiveQuestionnaireData, isMarkdownData } from '../../utils/questionnaireDataUtils';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import { createPreserveImageMap, injectPreserveImageIntoContent, PreserveImageMap } from '../../utils/injectPreserveImage';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useProgressTracking from '../../hooks/useProgressTracking';
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
  const [generateGlobal, setGenerateGlobal] = useState(true);
  const [pagesContent, setPagesContent] = useState<Record<string, unknown> | null>(null);
  const [globalContent, setGlobalContent] = useState<Record<string, unknown> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'generate' | 'upload'>('generate');

  // Ref to track if parent has been notified for current content (prevents infinite loop)
  const hasNotifiedParentRef = useRef(false);

  // Ref to store preserve_image values from sitemap when generation starts
  const preserveImageMapRef = useRef<PreserveImageMap>(new Map());

  const queryClient = useQueryClient();

  // Use contexts instead of props
  const { state: questionnaireState } = useQuestionnaire();
  const { state: sitemapState } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  const { updateTaskStatus } = useProgressTracking();

  // Extract data from contexts
  const questionnaireData = questionnaireState.data;
  const pages = sitemapState.pages;
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  // Get the effective questionnaire data (memoized to avoid identity changes)
  const effectiveQuestionnaireData = useMemo(() => getEffectiveQuestionnaireData(questionnaireData), [questionnaireData]);

  // Helper function to inject preserve_image from stored ref into generated content
  const injectPreserveImage = useCallback((generatedContent: Record<string, any>): Record<string, any> => {
    console.log('📸 Starting preserve_image injection. Stored pages:', Array.from(preserveImageMapRef.current.keys()));

    // Log details for debugging
    for (const [pageKey, itemMap] of preserveImageMapRef.current.entries()) {
      console.log(`📸 Page "${pageKey}" has preserve_image at indices:`, Array.from(itemMap.entries()));
    }

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMapRef.current);

    // Log what was injected
    for (const [pageKey, components] of Object.entries(result)) {
      if (Array.isArray(components)) {
        components.forEach((comp: any, idx: number) => {
          if (comp.preserve_image) {
            console.log(`📸 Injected preserve_image=true for "${pageKey}" component ${idx} (${comp.acf_fc_layout || 'unknown'})`);
          }
        });
      }
    }

    return result;
  }, []);

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
    enabled: shouldFetch && !!requestSnapshot && generateGlobal,
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

      // Inject preserve_image from sitemap into generated content
      const pagesWithPreserveImage = injectPreserveImage(actualPagesData);
      setPagesContent(pagesWithPreserveImage);
    } else {
      console.log('❌ Not setting pages content - status:', pagesStatus, 'data:', !!pagesData);
    }
  }, [pagesStatus, pagesData, injectPreserveImage]);

  useEffect(() => {
    console.log('🌐 Global useEffect FIRED - Status:', globalStatus, 'Data present:', !!globalData, 'Generate Global:', generateGlobal);
    if (!generateGlobal) {
      // If generate-global is disabled, set empty global content
      setGlobalContent({});
    } else if (globalStatus === 'success' && globalData) {
      const extracted = (globalData as any)?.global_data ?? (globalData as unknown as Record<string, unknown>);
      setGlobalContent(extracted);
    }
  }, [globalStatus, globalData, generateGlobal]);

  // Reset notification flag when content is cleared (allows re-notification with new content)
  useEffect(() => {
    if (!pagesContent || !globalContent) {
      hasNotifiedParentRef.current = false;
    }
  }, [pagesContent, globalContent]);

  // Notify parent when both contents are ready (only once per content set)
  useEffect(() => {
    if (pagesContent && globalContent && onContentGenerated && !hasNotifiedParentRef.current) {
      hasNotifiedParentRef.current = true;
      onContentGenerated(pagesContent, globalContent);
      updateTaskStatus('planning', 'contentGeneration', 'completed');
    }
  }, [pagesContent, globalContent, onContentGenerated, updateTaskStatus]);

  // Reset to idle after both queries complete
  useEffect(() => {
    if (
      isStarted &&
      (pagesStatus === 'success' || pagesStatus === 'error') &&
      (!generateGlobal || globalStatus === 'success' || globalStatus === 'error')
    ) {
      setIsStarted(false);
      setShouldFetch(false);
    }
  }, [isStarted, pagesStatus, globalStatus, generateGlobal]);

  const handleGenerateContent = useCallback(() => {
    console.log('🚀 Starting content generation...');

    // Invalidate existing queries to force fresh requests
    queryClient.invalidateQueries({ queryKey: ['generate-content'] });
    if (generateGlobal) {
      queryClient.invalidateQueries({ queryKey: ['generate-global'] });
    }
    console.log('🧹 Invalidated React Query cache');

    // Store preserve_image values from current sitemap before generation
    // Log the raw sitemap pages for debugging
    console.log('📸 === PRESERVE_IMAGE DEBUG START ===');
    console.log('📸 Raw sitemap pages count:', pages.length);
    pages.forEach((page, pageIdx) => {
      console.log(`📸 Page[${pageIdx}]: title="${page.title}" id="${page.id}" wordpress_id="${page.wordpress_id}"`);
      console.log(`📸   Items count: ${page.items.length}`);
      page.items.forEach((item, itemIdx) => {
        console.log(`📸   Item[${itemIdx}]: model="${item.model}" preserve_image=${item.preserve_image} (type: ${typeof item.preserve_image})`);
      });
    });

    // Convert sitemap pages to the format expected by createPreserveImageMap
    const sitemapPagesForMap = pages.map(page => ({
      id: page.id,
      title: page.title,
      wordpress_id: page.wordpress_id,
      items: page.items.map(item => ({
        id: item.id,
        model: item.model,
        query: item.query,
        preserve_image: item.preserve_image,
      })),
    }));

    preserveImageMapRef.current = createPreserveImageMap(sitemapPagesForMap);

    // Log what was stored for debugging
    console.log('📸 After createPreserveImageMap - Total pages with preserve_image:', preserveImageMapRef.current.size);
    if (preserveImageMapRef.current.size === 0) {
      console.log('📸 WARNING: No preserve_image values were stored!');
    }
    for (const [pageKey, itemMap] of preserveImageMapRef.current.entries()) {
      console.log(`📸 Stored preserve_image for "${pageKey}":`, Array.from(itemMap.entries()));
    }
    console.log('📸 === PRESERVE_IMAGE DEBUG END ===');

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
    updateTaskStatus('planning', 'contentGeneration', 'in-progress');

    console.log('🧹 Clearing previous content states');
  }, [queryClient, pages, effectiveQuestionnaireData, siteType, useRgTemplateAssets, generateGlobal, updateTaskStatus]);

  const handleUseRgTemplateAssetsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUseRgTemplateAssets(event.target.checked);
  }, []);

  const handleGenerateGlobalChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setGenerateGlobal(event.target.checked);
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

  const isGenerating = isStarted && (pagesStatus === 'pending' || (generateGlobal && globalStatus === 'pending'));
  const hasError = pagesStatus === 'error' || (generateGlobal && globalStatus === 'error');
  const isComplete = pagesStatus === 'success' && (!generateGlobal || globalStatus === 'success');

  // Update progress tracking based on status
  useEffect(() => {
    if (hasError) {
      updateTaskStatus('planning', 'contentGeneration', 'error');
    }
  }, [hasError, updateTaskStatus]);

  return (
    <div className="content-generator">
      {/* Data Source Indicator */}
      {isMarkdownData(questionnaireData) && (
        <div className="markdown-info">
          <p>
            <strong>Using Markdown Data Source:</strong> Content generation will use the markdown content as questionnaire data.
          </p>
        </div>
      )}

      {/* Mode Selection */}
      <div className="content-mode-selector">
        <h4 className="content-mode-selector__title">Select Content Method</h4>
        <div className="content-mode-selector__options">
          <button
            className={`content-mode-selector__option ${uploadMode === 'generate' ? 'content-mode-selector__option--active' : ''}`}
            onClick={() => setUploadMode('generate')}
          >
            <span className="content-mode-selector__option-label">🤖 Generate Content</span>
            <span className="content-mode-selector__option-description">Automatically create content from questionnaire</span>
          </button>
          <button
            className={`content-mode-selector__option ${uploadMode === 'upload' ? 'content-mode-selector__option--active' : ''}`}
            onClick={() => setUploadMode('upload')}
          >
            <span className="content-mode-selector__option-label">📁 Upload Content</span>
            <span className="content-mode-selector__option-description">Upload pre-existing content files</span>
          </button>
        </div>
      </div>

      <div className="content-generator__content">
        {uploadMode === 'generate' ? (
          <>
            {/* Options */}
            <div className="options-section">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  className="checkbox"
                  id="generate-global"
                  checked={generateGlobal}
                  onChange={handleGenerateGlobalChange}
                />
                <label htmlFor="generate-global">
                  Generate global content (site-wide information)
                </label>
              </div>
              
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  className="checkbox"
                  id="use-rg-template-assets"
                  checked={useRgTemplateAssets}
                  onChange={handleUseRgTemplateAssetsChange}
                />
                <label htmlFor="use-rg-template-assets">
                  Assign images automatically (includes Adobe licensed assets)
                </label>
              </div>
              
              {useRgTemplateAssets && (
                <div className="adobe-assets-indicator">
                  <div className="adobe-assets-header">
                    <span className="adobe-icon">🎨</span>
                    <strong>Adobe Licensed Assets Mode</strong>
                  </div>
                  <div className="adobe-assets-description">
                    When ImageSelectionHints are detected in content, the system will use <strong>keywordMode=AND</strong> to search Adobe's licensed asset library for contextually appropriate images.
                  </div>
                  <div className="adobe-assets-example">
                    💡 Hint categories like "Home Hero" → "smiling AND dentist AND patient"
                  </div>
                </div>
              )}
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
                    Pages Content (JSON)
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
                      Pages content loaded
                    </span>
                  )}
                </div>

                <div className="upload-group">
                  <label htmlFor="global-upload" className="upload-label">
                    Global Content (JSON)
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
                      Global content loaded
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
          <span className={`status-value ${globalContent ? 'status-value--success' : !generateGlobal ? 'status-value--disabled' : `status-value--${globalStatus}`}`}>
            {!generateGlobal ? 'disabled' : globalContent ? 'loaded' : globalStatus === 'pending' ? 'generating' : globalStatus === 'error' ? 'error' : 'idle'}
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
          {globalError && generateGlobal && (
            <div className="error-message">
              <strong>Global Error:</strong> {globalError.message}
            </div>
          )}
        </div>
      )}

      {/* Success Display */}
      {(isComplete || (pagesContent && globalContent)) && (
        <div className="success-section">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Content {uploadMode === 'upload' ? 'Uploaded' : 'Generated'} Successfully!</h4>
          </div>
          
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
    </div>
  );
};

export default ContentGenerator;
