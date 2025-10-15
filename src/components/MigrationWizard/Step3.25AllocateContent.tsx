import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useAllocateContent from '../../hooks/useAllocateContent';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import ContentAllocationViewer from './ContentAllocationViewer';
import './Step3.25AllocateContent.sass';

const Step3_25AllocateContent: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: sitemapState } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  const [allocateContentData, allocateContentStatus, allocateContentMutation] = useAllocateContent();
  const hasSavedRef = useRef(false);

  // Save allocated sitemap to wizard state when mutation succeeds (only once)
  useEffect(() => {
    if (allocateContentStatus === 'success' && allocateContentData?.enhanced_sitemap && !hasSavedRef.current) {
      console.log('✅ Allocation successful, saving to wizard state');
      hasSavedRef.current = true;
      actions.setAllocatedSitemap({
        pages: allocateContentData.enhanced_sitemap.pages,
        allocation_summary: allocateContentData.allocation_summary,
      });
    }
  }, [allocateContentStatus, allocateContentData]);

  // Reset the saved flag when starting a new allocation
  useEffect(() => {
    if (allocateContentStatus === 'pending') {
      hasSavedRef.current = false;
    }
  }, [allocateContentStatus]);

  // Validation checks
  if (!state.scrapedContent) {
    return (
      <div className="step-3-25-allocate__empty">
        <AlertCircle size={48} />
        <p>No scraped content available. Please complete Step 1 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
          Go to Step 1
        </button>
      </div>
    );
  }

  if (!sitemapState.pages || sitemapState.pages.length === 0) {
    return (
      <div className="step-3-25-allocate__empty">
        <AlertCircle size={48} />
        <p>No sitemap structure available. Please complete Step 3 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('structure')}>
          Go to Step 3
        </button>
      </div>
    );
  }

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';
  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

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
    console.log('📦 Full sitemap:', sitemapForBackend);
    console.log('📦 Full scraped content structure:', scrapedContentForBackend);

    // Call the mutation
    allocateContentMutation({
      sitemap: sitemapForBackend,
      scraped_content: scrapedContentForBackend,
      site_type: backendSiteType,
    });
  };

  const isAllocating = allocateContentStatus === 'pending';
  const hasAllocated = allocateContentStatus === 'success' && allocateContentData;
  const hasFailed = allocateContentStatus === 'error';

  // Check if we have allocated sitemap from previous allocation
  const displaySitemap = state.allocatedSitemap || (hasAllocated ? {
    pages: allocateContentData.enhanced_sitemap.pages,
    allocation_summary: allocateContentData.allocation_summary,
  } : null);

  return (
    <div className="step-3-25-allocate">
      <div className="step-header">
        <h2>Step 3.5: Allocate Content to Pages</h2>
        <p>
          Match scraped content from <strong>{state.scrapedContent.domain}</strong> to your sitemap pages.
          This helps ensure each page gets relevant content before final generation.
        </p>
      </div>

      <div className="step-3-25-allocate__summary">
        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-label">Scraped Domain</span>
            <span className="card-value">{state.scrapedContent.domain}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Pages Scraped</span>
            <span className="card-value">{pagesCount}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Sitemap Pages</span>
            <span className="card-value">{sitemapState.pages.length}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Site Type</span>
            <span className="card-value">{backendSiteType}</span>
          </div>
        </div>
      </div>

      <div className="step-3-25-allocate__actions">
        {!hasAllocated && !displaySitemap && (
          <button
            className="btn btn--primary btn--large"
            onClick={handleAllocate}
            disabled={isAllocating}
          >
            {isAllocating ? (
              <>
                <Loader2 className="spinning" size={20} />
                Allocating Content...
              </>
            ) : (
              <>
                📋 Allocate Content to Pages
              </>
            )}
          </button>
        )}

        {hasAllocated && (
          <div className="success-banner">
            <CheckCircle size={24} className="success-icon" />
            <div className="success-content">
              <p className="success-title">Content Allocated Successfully!</p>
              <p className="success-message">
                {allocateContentData?.message || 'Content has been allocated to pages'}
              </p>
            </div>
            <button
              className="btn btn--secondary"
              onClick={handleAllocate}
              disabled={isAllocating}
            >
              {isAllocating ? (
                <>
                  <Loader2 className="spinning" size={18} />
                  Re-allocating...
                </>
              ) : (
                '🔄 Re-allocate'
              )}
            </button>
          </div>
        )}

        {hasFailed && (
          <div className="error-banner">
            <AlertCircle size={24} className="error-icon" />
            <div className="error-content">
              <p className="error-title">Allocation Failed</p>
              <p className="error-message">
                There was an error allocating content. Please try again.
              </p>
            </div>
            <button
              className="btn btn--primary"
              onClick={handleAllocate}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {isAllocating && (
        <div className="step-3-25-allocate__progress">
          <Loader2 className="progress-spinner spinning" size={64} />
          <p className="progress-title">Allocating content to pages...</p>
          <p className="progress-note">
            The AI is reading your scraped content and categorizing it into the appropriate pages.
            This may take a minute or two.
          </p>
        </div>
      )}

      {displaySitemap && (
        <>
          <ContentAllocationViewer allocatedSitemap={displaySitemap} />

          <div className="step-3-25-allocate__next-step">
            <div className="next-step-banner">
              <div className="next-step-content">
                <h3>Ready for Content Generation</h3>
                <p>
                  Content has been allocated to {displaySitemap.allocation_summary?.allocated_pages || 0} pages.
                  Proceed to generate the final content using this allocation.
                </p>
              </div>
              <button
                className="btn btn--primary btn--large"
                onClick={() => actions.setCurrentStep('generate')}
              >
                Continue to Generation
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Step3_25AllocateContent;
