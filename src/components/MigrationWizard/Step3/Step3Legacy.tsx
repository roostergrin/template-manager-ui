import React, { useState, useEffect, useRef } from 'react';
import { Loader2, GitBranch, FileText, FileJson } from 'lucide-react';
import { useAppConfig } from '../../../contexts/AppConfigProvider';
import { useSitemap } from '../../../contexts/SitemapProvider';
import { useMigrationWizard } from '../../../contexts/MigrationWizardProvider';
import GenerateSitemapButton from '../../GenerateSitemapButton';
import GeneratedSitemapSelector from '../../GeneratedSitemapSelector';
import SitemapViewToggle from '../../Sitemap/SitemapViewToggle';
import JsonExportImport from '../../Sitemap/JsonExportImport';
import RagWorkflow from '../RagWorkflow';
import useImportExport from '../../../hooks/useImportExport';
import useGenerateSitemap from '../../../hooks/useGenerateSitemap';
import useAllocateContent from '../../../hooks/useAllocateContent';
import useFirstPassAllocation from '../../../hooks/useFirstPassAllocation';
import useSecondPassAllocation from '../../../hooks/useSecondPassAllocation';
import { getBackendSiteTypeForModelGroup } from '../../../utils/modelGroupKeyToBackendSiteType';
import { getEffectiveQuestionnaireData } from '../../../utils/questionnaireDataUtils';
import { modelGroups } from '../../../modelGroups';
import { VectorStore } from '../../../types/SitemapTypes';
import './Step3Legacy.sass';

const Step3Legacy: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState } = useAppConfig();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { exportJson, importJson } = useImportExport();
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const [allocateContentData, allocateContentStatus, allocateContentMutation] = useAllocateContent();
  const [firstPassData, firstPassStatus, firstPassMutation] = useFirstPassAllocation();
  const [secondPassData, secondPassStatus, secondPassMutation] = useSecondPassAllocation();
  const [selectorResetTrigger, setSelectorResetTrigger] = useState(0);
  const [localVectorStore, setLocalVectorStore] = useState<VectorStore | null>(null);
  const hasSavedAllocationRef = useRef(false);

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';
  const pages = sitemapState.pages;
  const pagesCount = pages.length;

  // Use vector store from context (selected in Step 2) or local selection
  const selectedVectorStore = localVectorStore || state.selectedVectorStore;

  const metadata = state.scrapedContent?.metadata;
  const hasAllocatedMarkdown = pages.some(page => page.allocated_markdown);
  const hasModelQueryPairs = pages.some(page => page.items && page.items.length > 0);

  const isFirstPassPending = firstPassStatus === 'pending';
  const isSecondPassPending = secondPassStatus === 'pending';
  const isAllocating = allocateContentStatus === 'pending';

  // Handle vector store selection from RAG workflow
  const handleVectorStoreSelect = (vs: VectorStore | null) => {
    setLocalVectorStore(vs);
    if (vs) {
      actions.setSelectedVectorStore(vs);
    }
  };

  // Handle First Pass
  const handleFirstPass = () => {
    if (!selectedVectorStore || !state.scrapedContent) return;

    const pagesObject: Record<string, any> = {};
    pages.forEach((page) => {
      const pageTitle = page.title || 'Untitled';
      pagesObject[pageTitle] = {
        internal_id: page.id,
        page_id: page.wordpress_id || page.id,
        title: pageTitle,
        model_query_pairs: [],
      };
    });

    firstPassMutation({
      vector_store_id: selectedVectorStore.vector_store_id,
      sitemap_pages: pagesObject,
      domain: state.scrapedContent.domain,
    });
  };

  // Handle Second Pass
  const handleSecondPass = () => {
    if (!selectedVectorStore || !state.scrapedContent) return;

    const pagesObject: Record<string, any> = {};
    pages.forEach((page) => {
      const pageTitle = page.title || 'Untitled';
      pagesObject[pageTitle] = {
        internal_id: page.id,
        page_id: page.wordpress_id || page.id,
        title: pageTitle,
        model_query_pairs: (page.items || []).map((item: any) => ({
          model: item.model,
          query: item.query,
          internal_id: item.id,
        })),
      };
    });

    secondPassMutation({
      vector_store_id: selectedVectorStore.vector_store_id,
      sitemap_pages: pagesObject,
      domain: state.scrapedContent.domain,
    });
  };

  // Handle legacy allocation
  const handleAllocate = () => {
    if (!state.scrapedContent || pages.length === 0) return;

    const pagesObject: Record<string, any> = {};
    pages.forEach((page) => {
      const pageTitle = page.title || 'Untitled';
      pagesObject[pageTitle] = {
        internal_id: page.id,
        page_id: page.wordpress_id || page.id,
        title: pageTitle,
        model_query_pairs: (page.items || []).map((item: any) => ({
          model: item.model,
          query: item.query,
          internal_id: item.id,
        })),
      };
    });

    allocateContentMutation({
      scraped_content: state.scrapedContent,
      sitemap: { pages: pagesObject },
      site_type: backendSiteType,
    });
  };

  // Handle First Pass success
  useEffect(() => {
    if (firstPassStatus === 'success' && firstPassData?.enhanced_sitemap) {
      const enhancedPages = firstPassData.enhanced_sitemap.pages;
      const updatedPages = pages.map(page => {
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
          };
        }
        return page;
      });
      sitemapActions.setPages(updatedPages);
    }
  }, [firstPassStatus, firstPassData]);

  // Handle Second Pass success
  useEffect(() => {
    if (secondPassStatus === 'success' && secondPassData?.enhanced_sitemap) {
      const enhancedPages = secondPassData.enhanced_sitemap.pages;
      const updatedPages = pages.map(page => {
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
      actions.setAllocatedPagesSitemap(updatedPages);
    }
  }, [secondPassStatus, secondPassData]);

  // Handle legacy allocation success
  useEffect(() => {
    if (allocateContentStatus === 'success' && allocateContentData?.enhanced_sitemap && !hasSavedAllocationRef.current) {
      hasSavedAllocationRef.current = true;
      actions.setAllocatedSitemap({
        ...allocateContentData.enhanced_sitemap,
        allocation_summary: allocateContentData.allocation_summary,
      });
    }
  }, [allocateContentStatus, allocateContentData]);

  useEffect(() => {
    if (allocateContentStatus === 'pending') {
      hasSavedAllocationRef.current = false;
    }
  }, [allocateContentStatus]);

  // Handle sitemap generation
  const handleSitemapGenerated = (sitemapData: unknown, siteType?: string) => {
    sitemapActions.handleGeneratedSitemap(sitemapData, siteType);
  };

  // Handle RAG-generated sitemap
  const handleRagSitemapGenerated = (sitemapData: Record<string, any>, savedPath: string) => {
    handleSitemapGenerated(sitemapData, backendSiteType);
  };

  if (!state.scrapedContent) {
    return (
      <div className="step3-legacy__empty">
        <p>No scraped content available. Please complete Step 1 first.</p>
      </div>
    );
  }

  return (
    <div className="step3-legacy">
      {/* Two-Pass Allocation Section */}
      <section className="step3-legacy__section">
        <h3 className="step3-legacy__section-title">Two-Pass RAG Allocation</h3>

        <div className="step3-legacy__two-pass-buttons">
          <button
            className="step3-legacy__btn step3-legacy__btn--secondary"
            onClick={handleFirstPass}
            disabled={isFirstPassPending || !selectedVectorStore}
            title={!selectedVectorStore ? 'Select a vector store first' : 'Analyze content and suggest page sections'}
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

          <button
            className="step3-legacy__btn step3-legacy__btn--primary"
            onClick={handleSecondPass}
            disabled={isSecondPassPending || !selectedVectorStore || !hasModelQueryPairs}
            title={!selectedVectorStore ? 'Select a vector store first' : !hasModelQueryPairs ? 'Run First Pass first' : 'Allocate markdown content'}
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
        <div className="step3-legacy__status">
          {selectedVectorStore && (
            <span className="step3-legacy__status-item">
              Vector Store: {selectedVectorStore.vector_store_id.substring(0, 20)}...
            </span>
          )}
          {firstPassStatus === 'success' && firstPassData && (
            <span className="step3-legacy__status-item step3-legacy__status-item--success">
              First Pass: {firstPassData.summary.total_sections_suggested} sections suggested
            </span>
          )}
          {secondPassStatus === 'success' && secondPassData && (
            <span className="step3-legacy__status-item step3-legacy__status-item--success">
              Second Pass: {secondPassData.summary.allocated_pages} pages allocated
            </span>
          )}
        </div>

        {/* Legacy Single-Pass */}
        <div className="step3-legacy__legacy-allocate">
          <button
            className="step3-legacy__btn step3-legacy__btn--outline"
            onClick={handleAllocate}
            disabled={isAllocating || pages.length === 0}
          >
            {isAllocating ? (
              <>
                <Loader2 className="spinning" size={18} />
                Allocating...
              </>
            ) : (
              'Legacy: Allocate from Scraped Content'
            )}
          </button>
        </div>
      </section>

      {/* RAG Workflow */}
      <section className="step3-legacy__section">
        <h3 className="step3-legacy__section-title">RAG Workflow</h3>
        <RagWorkflow
          domain={state.scrapedContent.domain || ''}
          siteType={backendSiteType}
          scrapedContent={state.scrapedContent}
          onSitemapGenerated={handleRagSitemapGenerated}
          onVectorStoreSelect={handleVectorStoreSelect}
        />
      </section>

      {/* Generate Sitemap */}
      <section className="step3-legacy__section">
        <h3 className="step3-legacy__section-title">Generate Sitemap</h3>
        <div className="step3-legacy__info-row">
          <span className="step3-legacy__badge">{backendSiteType}</span>
          <span className="step3-legacy__badge">{state.scrapedContent.domain}</span>
          <span className="step3-legacy__badge">{pagesCount} pages</span>
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
          currentSitemapPages={pages}
        />
      </section>

      {/* Sitemap Editor */}
      <section className="step3-legacy__section">
        <h3 className="step3-legacy__section-title">Sitemap Editor</h3>
        <div className="step3-legacy__selector-row">
          <GeneratedSitemapSelector
            onSelectSitemap={sitemapActions.handleSelectStoredSitemap}
            resetTrigger={selectorResetTrigger}
          />
        </div>
        <SitemapViewToggle />
      </section>

      {/* Export/Import */}
      <section className="step3-legacy__section">
        <h3 className="step3-legacy__section-title">Export / Import</h3>
        <JsonExportImport exportJson={exportJson} importJson={importJson} />
      </section>
    </div>
  );
};

export default Step3Legacy;
