import React, { useState, useEffect, useRef } from 'react';
import { List, FileJson, Loader2, GitBranch, FileText } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import SitemapViewToggle from '../Sitemap/SitemapViewToggle';
import JsonExportImport from '../Sitemap/JsonExportImport';
import RagWorkflow from './RagWorkflow';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import useAllocateContent from '../../hooks/useAllocateContent';
import useFirstPassAllocation from '../../hooks/useFirstPassAllocation';
import useSecondPassAllocation from '../../hooks/useSecondPassAllocation';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import { getEffectiveQuestionnaireData } from '../../utils/questionnaireDataUtils';
import { modelGroups } from '../../modelGroups';
import { VectorStore } from '../../types/SitemapTypes';
import './Step3Structure.sass';

type SitemapSource = 'default' | 'allocated' | 'scraped';

const Step3Structure: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { exportJson, importJson } = useImportExport();
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const [allocateContentData, allocateContentStatus, allocateContentMutation] = useAllocateContent();
  const [firstPassData, firstPassStatus, firstPassMutation] = useFirstPassAllocation();
  const [secondPassData, secondPassStatus, secondPassMutation] = useSecondPassAllocation();
  const [selectorResetTrigger, setSelectorResetTrigger] = useState(0);
  const [sitemapSource, setSitemapSource] = useState<SitemapSource>('default');
  const [extractedSitemap, setExtractedSitemap] = useState<any>(null);
  const [selectedVectorStore, setSelectedVectorStore] = useState<VectorStore | null>(null);
  const hasSavedAllocationRef = useRef(false);
  const hasRestoredSourceRef = useRef(false);

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';
  const pages = sitemapState.pages;

  // Helper function to merge allocated data into pages
  const mergeAllocatedDataIntoPages = (pages: any[], allocatedPages?: Record<string, any>) => {
    if (!allocatedPages) return pages;

    return pages.map(page => {
      // Try to find matching allocated page by title or path
      let matchingAllocatedPage: any = null;

      // Generate the page key from the current page's path (same logic as handleAllocate)
      let pageKey = 'unknown';
      if (page.path === '/') {
        pageKey = 'home';
      } else if (page.path) {
        pageKey = page.path.substring(1).replace(/\//g, '_');
      } else if (page.title) {
        pageKey = page.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }

      // Look for matching allocated page by key or title
      for (const [key, allocatedPage] of Object.entries(allocatedPages)) {
        if (key === pageKey || key === page.title || (allocatedPage as any).title === page.title) {
          matchingAllocatedPage = allocatedPage;
          break;
        }
      }

      if (matchingAllocatedPage) {
        return {
          ...page,
          allocated_markdown: matchingAllocatedPage.allocated_markdown,
          allocation_confidence: matchingAllocatedPage.allocation_confidence,
          source_location: matchingAllocatedPage.source_location,
          mapped_scraped_page: matchingAllocatedPage.mapped_scraped_page,
        };
      }

      return page;
    });
  };

  // Restore last selected source on mount
  useEffect(() => {
    if (state.scrapedContent && !hasRestoredSourceRef.current) {
      const lastSource = actions.getPersistedLastSource();
      console.log('🔍 Restoring last selected source:', lastSource);

      if (lastSource) {
        // Don't call handleSitemapSourceChange here to avoid loading logic
        // Just set the state and let the next useEffect handle the restoration
        setSitemapSource(lastSource);
      }

      hasRestoredSourceRef.current = true;
    }
  }, [state.scrapedContent]);

  // Save allocated sitemap to wizard state when allocation succeeds (only once)
  useEffect(() => {
    if (allocateContentStatus === 'success' && allocateContentData?.enhanced_sitemap && !hasSavedAllocationRef.current) {
      console.log('✅ Allocation successful, saving to wizard state and merging into sitemap');
      hasSavedAllocationRef.current = true;

      // Save to wizard state - store the full enhanced_sitemap
      actions.setAllocatedSitemap({
        ...allocateContentData.enhanced_sitemap, // Full sitemap structure with pages, modelGroups, siteType, etc.
        allocation_summary: allocateContentData.allocation_summary, // Add allocation summary for UI display
      });

      // Merge allocated data into current sitemap pages
      const allocatedPages = allocateContentData.enhanced_sitemap.pages;
      const updatedPages = mergeAllocatedDataIntoPages(sitemapState.pages, allocatedPages);

      // Save the allocated pages to the wizard state for later retrieval
      actions.setAllocatedPagesSitemap(updatedPages);

      // Update current sitemap view
      sitemapActions.setPages(updatedPages);

      // Auto-switch to 'allocated' mode
      console.log('🔄 Auto-switching to allocated view after successful allocation');
      setSitemapSource('allocated');
      actions.saveLastSelectedSource('allocated');
    }
  }, [allocateContentStatus, allocateContentData]);

  // Reset the saved flag when starting a new allocation
  useEffect(() => {
    if (allocateContentStatus === 'pending') {
      hasSavedAllocationRef.current = false;
    }
  }, [allocateContentStatus]);

  // Handle First Pass success - update sitemap with suggested model_query_pairs
  useEffect(() => {
    if (firstPassStatus === 'success' && firstPassData?.enhanced_sitemap) {
      console.log('✅ First Pass successful, updating sitemap with suggested sections');

      const enhancedPages = firstPassData.enhanced_sitemap.pages;

      // Update sitemap pages with model_query_pairs (items)
      const updatedPages = sitemapState.pages.map(page => {
        // Find matching enhanced page
        const matchingPage = enhancedPages[page.title];
        if (matchingPage && matchingPage.model_query_pairs) {
          return {
            ...page,
            items: matchingPage.model_query_pairs.map((mqp: any) => ({
              model: mqp.model,
              query: mqp.query,
              id: mqp.internal_id,
              useDefault: mqp.use_default || false,
            })),
            has_content: matchingPage.has_content,
            content_confidence: matchingPage.content_confidence,
          };
        }
        return page;
      });

      sitemapActions.setPages(updatedPages);
      console.log(`📊 Updated ${updatedPages.length} pages with suggested sections`);
    }
  }, [firstPassStatus, firstPassData]);

  // Handle Second Pass success - update sitemap with allocated markdown
  useEffect(() => {
    if (secondPassStatus === 'success' && secondPassData?.enhanced_sitemap) {
      console.log('✅ Second Pass successful, updating sitemap with allocated markdown');

      const enhancedPages = secondPassData.enhanced_sitemap.pages;

      // Update sitemap pages with allocated_markdown
      const updatedPages = sitemapState.pages.map(page => {
        // Find matching enhanced page
        const matchingPage = enhancedPages[page.title];
        if (matchingPage) {
          return {
            ...page,
            allocated_markdown: matchingPage.allocated_markdown,
          };
        }
        return page;
      });

      sitemapActions.setPages(updatedPages);

      // Also save to wizard state for persistence
      actions.setAllocatedPagesSitemap(updatedPages);

      console.log(`📝 Updated ${updatedPages.length} pages with allocated markdown`);
    }
  }, [secondPassStatus, secondPassData]);

  // Helper function to extract sitemap from scraped content
  const extractSitemapFromScrapedContent = () => {
    if (!state.scrapedContent) {
      console.log('❌ No scraped content available');
      return null;
    }

    const scrapedPageUrls = Object.keys(state.scrapedContent.pages || {});
    console.log('📄 Extracting sitemap from scraped pages:', scrapedPageUrls.length, 'pages');

    const pagesObject: Record<string, any> = {};

    scrapedPageUrls.forEach((url, index) => {
      // Convert URL to page title
      const pathParts = url.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
      const title = pathParts.length > 0
        ? pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/_/g, ' ')
        : 'Home';

      const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
      const pageId = pathParts.length > 0 ? pathParts.join('_') : 'home';
      const internalId = `scraped-${pageId}-${Date.now()}-${index}`;

      console.log(`  ✓ Page ${index + 1}: "${url}" → "${formattedTitle}" (id: ${pageId})`);

      // Include the markdown content from the scraped page
      const markdownContent = state.scrapedContent.pages[url] || '';

      pagesObject[formattedTitle] = {
        internal_id: internalId,
        page_id: pageId,
        allocated_markdown: markdownContent, // Include markdown from scraped content
        source_location: url,
        model_query_pairs: [] // Empty - no sections for scraped pages yet
      };
    });

    const result = { pages: pagesObject };
    console.log('✅ Extracted sitemap structure:', result);
    return result;
  };

  // On initial mount, restore the appropriate sitemap based on the selected source
  useEffect(() => {
    if (state.scrapedContent && hasRestoredSourceRef.current && sitemapState.pages.length === 0) {
      console.log('📋 Initial load - restoring pages for source:', sitemapSource);

      if (sitemapSource === 'default') {
        // Load default template
        const selectedGroup = modelGroups[selectedModelGroupKey];
        if (selectedGroup && selectedGroup.templates.length > 0) {
          const firstTemplate = selectedGroup.templates[0];
          const jsonString = JSON.stringify(firstTemplate.data);
          sitemapActions.importPagesFromJson(jsonString);
          console.log('✅ Loaded default template pages');
        }
      } else if (sitemapSource === 'allocated' && state.allocatedPagesSitemap && state.allocatedPagesSitemap.length > 0) {
        // Restore allocated pages
        console.log('✅ Restoring allocated pages:', state.allocatedPagesSitemap.length, 'pages');
        sitemapActions.setPages(state.allocatedPagesSitemap);
      } else if (sitemapSource === 'scraped' && state.generatedScrapedSitemap && state.generatedScrapedSitemap.length > 0) {
        // Restore generated scraped pages
        console.log('✅ Restoring generated scraped sitemap:', state.generatedScrapedSitemap.length, 'pages');
        sitemapActions.setPages(state.generatedScrapedSitemap);
      } else if (sitemapSource === 'scraped') {
        // Extract from scraped content
        const scrapedSitemap = extractSitemapFromScrapedContent();
        if (scrapedSitemap) {
          const jsonString = JSON.stringify(scrapedSitemap);
          sitemapActions.importPagesFromJson(jsonString);
          setExtractedSitemap(scrapedSitemap);
          console.log('✅ Extracted and loaded scraped pages');
        }
      }
    }
  }, [hasRestoredSourceRef.current, sitemapSource]); // Run when source is restored

  if (!state.scrapedContent) {
    return (
      <div className="step-3-structure__empty">
        <p>No scraped content available. Please complete Step 1 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
          Go to Step 1
        </button>
      </div>
    );
  }

  const handleAllocate = () => {
    console.log('🚀 Starting content allocation...');
    console.log('  📄 Scraped content domain:', state.scrapedContent?.domain);
    console.log('  📋 Sitemap pages:', sitemapState.pages.length);
    console.log('  🏷️  Site type:', backendSiteType);

    // Build the scraped content in the format the backend expects
    const scrapedContentForBackend = {
      scraped_content: {
        success: true,
        domain: state.scrapedContent?.domain || 'unknown',
        global_markdown: state.scrapedContent?.global_markdown || '',
        pages: state.scrapedContent?.pages || {},
        metadata: state.scrapedContent?.metadata || {},
      }
    };

    // Build the sitemap in the format the backend expects
    const sitemapForBackend = {
      pages: sitemapState.pages.reduce((acc: any, page: any) => {
        // Handle missing path gracefully
        let pageKey = 'unknown';
        if (page.path === '/') {
          pageKey = 'home';
        } else if (page.path) {
          pageKey = page.path.substring(1).replace(/\//g, '_');
        } else if (page.title) {
          // Fallback: use title as page key
          pageKey = page.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }

        console.log(`  📄 Processing page: "${page.title}" -> key: "${pageKey}"`);

        acc[pageKey] = {
          page_id: pageKey,
          title: page.title || pageKey,
          model_query_pairs: page.items || []
        };
        return acc;
      }, {}),
      questionnaireData: {},
      siteType: backendSiteType
    };

    console.log('📦 Request payload:', {
      sitemap_pages_count: Object.keys(sitemapForBackend.pages).length,
      scraped_pages_count: Object.keys(scrapedContentForBackend.scraped_content.pages).length,
      site_type: backendSiteType,
    });

    // Call the mutation
    allocateContentMutation({
      sitemap: sitemapForBackend,
      scraped_content: scrapedContentForBackend,
      site_type: backendSiteType,
    });
  };

  // Handler for vector store selection from RagWorkflow
  const handleVectorStoreSelect = (vs: VectorStore | null) => {
    console.log('📦 Vector store selected:', vs?.vector_store_id);
    setSelectedVectorStore(vs);
  };

  // First Pass: Suggest sections (model_query_pairs)
  const handleFirstPass = () => {
    if (!selectedVectorStore) {
      console.error('❌ No vector store selected');
      return;
    }

    console.log('🔍 Starting First Pass: Suggesting sections...');
    console.log('  📦 Vector Store:', selectedVectorStore.vector_store_id);
    console.log('  📋 Sitemap pages:', sitemapState.pages.length);

    // Build sitemap for backend
    const sitemapForBackend = {
      pages: sitemapState.pages.map(page => ({
        title: page.title,
        path: page.slug,
        slug: page.slug,
        description: page.description || '',
        id: page.id,
      })),
      siteType: backendSiteType,
    };

    firstPassMutation({
      sitemap: sitemapForBackend,
      vector_store_id: selectedVectorStore.vector_store_id,
      site_type: backendSiteType,
    });
  };

  // Second Pass: Allocate markdown using model_query_pairs
  const handleSecondPass = () => {
    if (!selectedVectorStore) {
      console.error('❌ No vector store selected');
      return;
    }

    console.log('📝 Starting Second Pass: Allocating markdown...');
    console.log('  📦 Vector Store:', selectedVectorStore.vector_store_id);
    console.log('  📋 Sitemap pages:', sitemapState.pages.length);

    // Build sitemap with model_query_pairs for backend
    const sitemapForBackend = {
      pages: sitemapState.pages.map(page => ({
        title: page.title,
        path: page.slug,
        slug: page.slug,
        description: page.description || '',
        id: page.id,
        model_query_pairs: page.items || [],
        items: page.items || [],
      })),
      siteType: backendSiteType,
    };

    secondPassMutation({
      sitemap: sitemapForBackend,
      vector_store_id: selectedVectorStore.vector_store_id,
      site_type: backendSiteType,
    });
  };

  const handleSitemapSourceChange = (source: SitemapSource) => {
    console.log('🔄 Sitemap source changed to:', source);
    setSitemapSource(source);

    // Save the selected source to localStorage
    actions.saveLastSelectedSource(source);

    if (source === 'default') {
      console.log('📋 Loading default sitemap from template (clean, no allocation)...');
      // Load clean default sitemap from selected template
      const selectedGroup = modelGroups[selectedModelGroupKey];
      if (selectedGroup && selectedGroup.templates.length > 0) {
        const firstTemplate = selectedGroup.templates[0];
        const jsonString = JSON.stringify(firstTemplate.data);
        console.log('✅ Importing default template pages');
        sitemapActions.importPagesFromJson(jsonString);
      }
    } else if (source === 'allocated') {
      console.log('📝 Loading allocated pages from wizard state...');
      // Load the saved allocated pages sitemap
      if (state.allocatedPagesSitemap && state.allocatedPagesSitemap.length > 0) {
        console.log('✅ Restoring allocated pages:', state.allocatedPagesSitemap.length, 'pages');
        sitemapActions.setPages(state.allocatedPagesSitemap);
      } else {
        console.log('⚠️ No allocated pages available, falling back to default');
        // Fallback to default if no allocated pages exist
        const selectedGroup = modelGroups[selectedModelGroupKey];
        if (selectedGroup && selectedGroup.templates.length > 0) {
          const firstTemplate = selectedGroup.templates[0];
          const jsonString = JSON.stringify(firstTemplate.data);
          sitemapActions.importPagesFromJson(jsonString);
        }
      }
    } else if (source === 'scraped') {
      console.log('🌐 Loading scraped pages...');
      console.log('🔍 DEBUG: state.generatedScrapedSitemap:', state.generatedScrapedSitemap);

      // Check if a generated sitemap exists for scraped pages
      if (state.generatedScrapedSitemap && state.generatedScrapedSitemap.length > 0) {
        console.log('✅ Loading previously generated scraped sitemap:', state.generatedScrapedSitemap.length, 'pages');
        console.log('🔍 DEBUG: First page from generated sitemap:', state.generatedScrapedSitemap[0]);
        sitemapActions.setPages(state.generatedScrapedSitemap);
        console.log('🔍 DEBUG: Called setPages with', state.generatedScrapedSitemap.length, 'pages');
        console.log('🔍 DEBUG: Current sitemapState.pages after setPages:', sitemapState.pages.length, 'pages');
      } else {
        console.log('📄 No generated sitemap found, extracting from scraped content...');
        console.log('🔍 DEBUG: generatedScrapedSitemap is', state.generatedScrapedSitemap === null ? 'null' : state.generatedScrapedSitemap === undefined ? 'undefined' : 'empty array');
        // Extract and use sitemap from scraped content
        const scrapedSitemap = extractSitemapFromScrapedContent();
        if (scrapedSitemap) {
          const jsonString = JSON.stringify(scrapedSitemap);
          console.log('📤 Importing scraped pages to sitemap:', jsonString.substring(0, 200) + '...');
          sitemapActions.importPagesFromJson(jsonString);
          setExtractedSitemap(scrapedSitemap);
          console.log('✅ Scraped pages imported successfully (with allocated markdown already included)');
        } else {
          console.log('❌ Failed to extract scraped sitemap');
        }
      }
    }
  };

  const metadata = state.scrapedContent.metadata;
  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

  const isAllocating = allocateContentStatus === 'pending';
  const hasAllocated = state.allocatedPagesSitemap && state.allocatedPagesSitemap.length > 0;
  const allocatedPagesCount = state.allocatedPagesSitemap?.length || 0;

  // Two-pass allocation status
  const isFirstPassPending = firstPassStatus === 'pending';
  const isSecondPassPending = secondPassStatus === 'pending';
  const hasModelQueryPairs = sitemapState.pages.some(page => page.items && page.items.length > 0);
  const hasAllocatedMarkdown = sitemapState.pages.some(page => page.allocated_markdown);

  // Wrapper for onSitemapGenerated to save to wizard state when on scraped pages
  const handleSitemapGenerated = (sitemapData: unknown, siteType?: string) => {
    console.log('🎯 Sitemap generated, current source:', sitemapSource);
    console.log('🔍 DEBUG: sitemapData received:', sitemapData);

    // Call the original handler from SitemapProvider which updates the sitemap state
    sitemapActions.handleGeneratedSitemap(sitemapData, siteType);

    // If we're on scraped pages, also save to wizard state for persistence
    if (sitemapSource === 'scraped') {
      console.log('💾 Saving generated sitemap to wizard state for scraped pages');

      // The sitemapActions.handleGeneratedSitemap internally calls useSitemapImport's handleGeneratedSitemap
      // which converts the sitemap data to pages. We need to do the same conversion here.
      // Extract pages from the sitemap data
      if (sitemapData && typeof sitemapData === 'object' && (sitemapData as any).pages) {
        const pagesObj = (sitemapData as any).pages;
        console.log('🔍 DEBUG: Pages object has', Object.keys(pagesObj).length, 'pages');

        const pagesArray = Object.entries(pagesObj).map(([title, pageData]: [string, any]) => ({
          id: pageData.internal_id,
          title,
          wordpress_id: pageData.page_id || '',
          items: (pageData.model_query_pairs || []).map((item: any) => ({
            model: item.model,
            query: item.query,
            id: item.internal_id,
            useDefault: Boolean(item.use_default),
          })),
          // Preserve allocation fields if they exist
          ...(pageData.allocated_markdown && { allocated_markdown: pageData.allocated_markdown }),
          ...(pageData.allocation_confidence !== undefined && { allocation_confidence: pageData.allocation_confidence }),
          ...(pageData.source_location && { source_location: pageData.source_location }),
          ...(pageData.mapped_scraped_page && { mapped_scraped_page: pageData.mapped_scraped_page }),
        }));

        console.log('🔍 DEBUG: Converted to pages array:', pagesArray.length, 'pages');
        console.log('🔍 DEBUG: First converted page:', pagesArray[0]);

        actions.setGeneratedScrapedSitemap(pagesArray);
        console.log('✅ Saved', pagesArray.length, 'generated pages to wizard state');
        console.log('🔍 DEBUG: Called actions.setGeneratedScrapedSitemap');

        // Keep the view on scraped pages after generation
        actions.saveLastSelectedSource('scraped');
      } else {
        console.error('❌ sitemapData is missing or invalid:', sitemapData);
      }
    } else {
      console.log('ℹ️ Not on scraped pages (source:', sitemapSource, '), skipping save to wizard state');
    }
  };

  // Handler for RAG-generated sitemap
  const handleRagSitemapGenerated = (sitemapData: Record<string, any>, savedPath: string) => {
    console.log('🎯 RAG sitemap generated');
    console.log('  📄 Saved to:', savedPath);
    console.log('  📋 Pages:', Object.keys(sitemapData.pages || {}).length);

    // Use the same handler as regular sitemap generation
    handleSitemapGenerated(sitemapData, backendSiteType);
  };

  const headerControls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div className="step-3-structure__sitemap-source">
        <label className="step-3-structure__sitemap-source-label">PAGES:</label>
        <div className="step-3-structure__sitemap-source-options">
          <button
            className={`step-3-structure__source-option ${sitemapSource === 'default' ? 'active' : ''}`}
            onClick={() => handleSitemapSourceChange('default')}
          >
            <List size={18} />
            <span>Default Pages</span>
          </button>
          <button
            className={`step-3-structure__source-option ${sitemapSource === 'allocated' ? 'active' : ''}`}
            onClick={() => handleSitemapSourceChange('allocated')}
            disabled={!hasAllocated}
            title={hasAllocated ? 'View pages with allocated markdown content' : 'No allocated content yet - click "Allocate Markdown to Pages" first'}
          >
            <List size={18} />
            <span>Allocated Pages {hasAllocated ? `(${allocatedPagesCount})` : ''}</span>
          </button>
          <button
            className={`step-3-structure__source-option ${sitemapSource === 'scraped' ? 'active' : ''}`}
            onClick={() => handleSitemapSourceChange('scraped')}
          >
            <FileJson size={18} />
            <span>Scraped Pages ({pagesCount})</span>
          </button>
        </div>
      </div>

      <div className="step-3-structure__allocate-section">
        {/* Two-Pass RAG Allocation Buttons */}
        <div className="step-3-structure__two-pass-buttons">
          {/* First Pass Button - Suggest Sections */}
          <button
            className="btn btn--secondary"
            onClick={handleFirstPass}
            disabled={isFirstPassPending || !selectedVectorStore || sitemapSource === 'allocated'}
            title={!selectedVectorStore ? 'Select a vector store in RAG Workflow first' : 'Analyze content and suggest page sections'}
          >
            {isFirstPassPending ? (
              <>
                <Loader2 className="spinning" size={18} />
                Analyzing...
              </>
            ) : (
              <>
                <GitBranch size={18} />
                First Pass: Suggest Sections
              </>
            )}
          </button>

          {/* Second Pass Button - Allocate Markdown */}
          <button
            className="btn btn--primary"
            onClick={handleSecondPass}
            disabled={isSecondPassPending || !selectedVectorStore || !hasModelQueryPairs || sitemapSource === 'allocated'}
            title={!selectedVectorStore ? 'Select a vector store first' : !hasModelQueryPairs ? 'Run First Pass to populate sections first' : 'Allocate markdown content to sections'}
          >
            {isSecondPassPending ? (
              <>
                <Loader2 className="spinning" size={18} />
                Allocating...
              </>
            ) : (
              <>
                <FileText size={18} />
                Second Pass: Allocate Markdown
              </>
            )}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="step-3-structure__pass-status">
          {selectedVectorStore?.vector_store_id && (
            <span style={{ color: '#666', fontSize: '0.85rem' }}>
              Vector Store: {selectedVectorStore.vector_store_id.substring(0, 20)}...
            </span>
          )}
          {firstPassStatus === 'success' && firstPassData && (
            <span style={{ color: 'green', fontSize: '0.85rem' }}>
              ✓ First Pass: {firstPassData.summary.total_sections_suggested} sections suggested
            </span>
          )}
          {secondPassStatus === 'success' && secondPassData && (
            <span style={{ color: 'green', fontSize: '0.85rem' }}>
              ✓ Second Pass: {secondPassData.summary.allocated_pages} pages allocated
            </span>
          )}
          {hasAllocatedMarkdown && (
            <span style={{ color: 'green', fontSize: '0.85rem' }}>
              ✓ Pages have allocated markdown
            </span>
          )}
        </div>

        {/* Legacy Single-Pass Button (for scraped content flow) */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            className="btn btn--outline"
            onClick={handleAllocate}
            disabled={isAllocating || !sitemapState.pages || sitemapState.pages.length === 0 || sitemapSource === 'allocated'}
            title="Legacy allocation using scraped content (no vector store needed)"
          >
            {isAllocating ? (
              <>
                <Loader2 className="spinning" size={18} />
                Allocating Content...
              </>
            ) : (
              '📋 Legacy: Allocate from Scraped Content'
            )}
          </button>
          {hasAllocated && (
            <span style={{ color: 'green', fontSize: '0.9rem', marginLeft: '1rem' }}>
              ✓ Content allocated successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const sitemapTitle = sitemapState.sitemapName
    ? `Currently using: ${sitemapState.sitemapName}`
    : 'Currently using the default sitemap';

  const handleUseDefaultSitemap = () => {
    const selectedGroup = modelGroups[selectedModelGroupKey];
    if (selectedGroup && selectedGroup.templates.length > 0) {
      const firstTemplate = selectedGroup.templates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      sitemapActions.importPagesFromJson(jsonString);
      setSelectorResetTrigger(prev => prev + 1); // Increment to trigger reset
    }
  };

  const isScrapedPages = sitemapSource === 'scraped';
  const isAllocatedPages = sitemapSource === 'allocated';
  const canEditSitemap = sitemapSource === 'default'; // Only allow editing default sitemap

  const additionalActions = (
    <div className="step-3-structure__sitemap-wrapper">
      <div className="step-3-structure__header-row">
        <h3 className="step-3-structure__sitemap-title">{sitemapTitle}</h3>
      </div>
      <div className="step-3-structure__additional-actions">
        <div className="step-3-structure__history-row">
          <div style={{ flex: 1, minWidth: 250 }}>
            <GeneratedSitemapSelector
              onSelectSitemap={sitemapActions.handleSelectStoredSitemap}
              resetTrigger={selectorResetTrigger}
              disabled={!canEditSitemap}
            />
          </div>
          <button
            className="step-3-structure__default-button"
            onClick={handleUseDefaultSitemap}
            disabled={!canEditSitemap}
          >
            Use Default Sitemap
          </button>
        </div>
        <div className="step-3-structure__generate-row">
          <div className="step-3-structure__info-badges">
            <div className="step-3-structure__template-badge">
              <span className="step-3-structure__template-name">{backendSiteType}</span>
            </div>
            <div className="step-3-structure__domain-badge">
              <span className="step-3-structure__badge-label">Domain:</span>
              <span className="step-3-structure__badge-value">{state.scrapedContent.domain || 'Unknown'}</span>
            </div>
            <div className="step-3-structure__pages-badge">
              <span className="step-3-structure__badge-label">Pages:</span>
              <span className="step-3-structure__badge-value">{pagesCount}</span>
            </div>
          </div>
          <GenerateSitemapButton
            questionnaireData={getEffectiveQuestionnaireData(state.scrapedContent) as any}
            generateSitemap={generateSitemap}
            generateSitemapStatus={generateSitemapStatus}
            generateSitemapData={generateSitemapData}
            onSitemapGenerated={handleSitemapGenerated}
            controls={{ backendSiteType }}
            scrapedContent={{
              domain: state.scrapedContent.domain || 'Unknown',
              pagesCount: pagesCount,
              timestamp: metadata?.scraped_at,
            }}
            fullScrapedContent={state.scrapedContent}
            allocatedSitemap={state.allocatedSitemap}
            currentSitemapPages={sitemapState.pages}
          />
        </div>
        
        {/* RAG Workflow - Multi-step sitemap generation */}
        <div className="step-3-structure__rag-section">
          <RagWorkflow
            domain={state.scrapedContent.domain || ''}
            siteType={backendSiteType}
            scrapedContent={state.scrapedContent}
            onSitemapGenerated={handleRagSitemapGenerated}
            onVectorStoreSelect={handleVectorStoreSelect}
          />
        </div>
        <div className="step-3-structure__export-import-row">
          <JsonExportImport exportJson={exportJson} importJson={importJson} />
        </div>
      </div>
    </div>
  );

  // Get allocation summary
  const allocationSummary = state.allocatedSitemap?.allocation_summary;

  // Allocation summary banner component
  const AllocationSummaryBanner = () => {
    if (!allocationSummary) return null;

    const unmappedScrapedPages = allocationSummary.unmapped_scraped_pages || [];
    const unmappedSitemapPages = allocationSummary.unmapped_sitemap_pages || [];

    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>✅ Content Allocation Summary</h3>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {allocationSummary.allocated_pages} of {allocationSummary.total_pages} pages allocated
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: unmappedScrapedPages.length > 0 || unmappedSitemapPages.length > 0 ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Success Rate:</span>
            <strong>{(allocationSummary.allocation_rate * 100).toFixed(1)}%</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Avg Confidence:</span>
            <strong>{(allocationSummary.average_confidence * 100).toFixed(1)}%</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Content:</span>
            <strong>{allocationSummary.total_content_length.toLocaleString()} chars</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Images:</span>
            <strong>{allocationSummary.total_images}</strong>
          </div>
        </div>

        {/* Unmapped Pages Warning */}
        {(unmappedSitemapPages.length > 0 || unmappedScrapedPages.length > 0) && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '0.75rem',
            borderRadius: '6px',
            marginTop: '0.75rem'
          }}>
            {unmappedSitemapPages.length > 0 && (
              <div style={{ marginBottom: unmappedScrapedPages.length > 0 ? '0.5rem' : '0' }}>
                <strong style={{ fontSize: '0.9rem' }}>⚠️ {unmappedSitemapPages.length} Sitemap Page(s) Without Content:</strong>
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.95 }}>
                  {unmappedSitemapPages.join(', ')}
                </div>
              </div>
            )}
            {unmappedScrapedPages.length > 0 && (
              <div>
                <strong style={{ fontSize: '0.9rem' }}>📦 {unmappedScrapedPages.length} Unused Scraped Page(s):</strong>
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.95 }}>
                  {unmappedScrapedPages.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="step-3-structure">
      <SitemapViewToggle
        headerControls={headerControls}
        contentSourceInfo={{
          domain: state.scrapedContent.domain || 'Unknown',
          pagesCount: pagesCount
        }}
        additionalActions={
          <>
            <AllocationSummaryBanner />
            {additionalActions}
          </>
        }
      />
    </div>
  );
};

export default Step3Structure;
