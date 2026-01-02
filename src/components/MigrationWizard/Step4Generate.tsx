import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Download, Copy, Check, Sparkles } from 'lucide-react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useGenerateContentForScraped from '../../hooks/useGenerateContentForScraped';
import useGenerateGlobal from '../../hooks/useGenerateGlobal';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import { sanitizePracticeContext, getSanitizationStats } from '../../utils/sanitizePracticeContext';
import './Step4Generate.sass';

const formatElapsedTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
};

const Step4Generate: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: sitemapState } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  const [generateContentData, generateContentStatus, generateContentMutation] = useGenerateContentForScraped();
  const [globalContentData, globalContentStatus, generateGlobalMutation] = useGenerateGlobal();
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [useSitePool, setUseSitePool] = useState(true);  // Default to site-wide pool for image deduplication
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [globalStartTime, setGlobalStartTime] = useState<number | null>(null);
  const [globalElapsedTime, setGlobalElapsedTime] = useState<number>(0);

  // Update elapsed time while content generation is in progress
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (generateContentStatus === 'pending' && startTime) {
      setElapsedTime(Date.now() - startTime);
      intervalId = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generateContentStatus, startTime]);

  // Update elapsed time while global generation is in progress
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (globalContentStatus === 'pending' && globalStartTime) {
      setGlobalElapsedTime(Date.now() - globalStartTime);
      intervalId = setInterval(() => {
        setGlobalElapsedTime(Date.now() - globalStartTime);
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [globalContentStatus, globalStartTime]);

  if (!state.scrapedContent) {
    return (
      <div className="step-4-generate__empty">
        <p>No scraped content available. Please complete Step 1 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
          Go to Step 1
        </button>
      </div>
    );
  }

  if (!sitemapState.pages || sitemapState.pages.length === 0) {
    return (
      <div className="step-4-generate__empty">
        <p>No sitemap structure available. Please complete Step 3.5 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('structure')}>
          Go to Step 3.5
        </button>
      </div>
    );
  }

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';
  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

  const handleGenerate = async () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    try {
      // Check if we have allocated sitemap (with allocated_markdown per page)
      // Priority: Use sitemap state (current) if it has allocated data, otherwise fall back to cached allocated sitemap
      const hasAllocatedDataInSitemap = Array.isArray(sitemapState.pages)
        ? sitemapState.pages.some((page: any) => page.allocated_markdown)
        : Object.values(sitemapState.pages).some((page: any) => page.allocated_markdown);

      const useAllocatedSitemap = hasAllocatedDataInSitemap ||
        (state.allocatedSitemap && Object.keys(state.allocatedSitemap.pages || {}).length > 0);

      if (useAllocatedSitemap) {
        console.log('🎯 Using ALLOCATED SITEMAP with per-page markdown content');
        console.log(`📊 Source: ${hasAllocatedDataInSitemap ? 'sitemapState (current)' : 'state.allocatedSitemap (cached)'}`);

        // Log from whichever source we're using
        const sourcePages = hasAllocatedDataInSitemap ? sitemapState.pages : state.allocatedSitemap.pages;
        const pagesArray = Array.isArray(sourcePages) ? sourcePages : Object.entries(sourcePages).map(([key, page]) => page);

        console.log('📊 Total pages:', pagesArray.length);

        // Log allocated content details
        pagesArray.forEach((pageData: any) => {
          const markdown = pageData.allocated_markdown;
          const pageKey = pageData.title || pageData.id || 'unknown';
          if (markdown) {
            console.log(`  ✓ ${pageKey}: ${markdown.length} chars allocated`);
          } else {
            console.log(`  ✗ ${pageKey}: NO allocated markdown`);
          }
        });
      } else {
        console.log('📝 Using REGULAR SITEMAP with combined markdown context');
      }

      // Combine global_markdown and all page markdowns into a single context string
      // (This is only used as fallback if no allocated sitemap)
      const rawMarkdown = [
        '# Global Content',
        state.scrapedContent.global_markdown,
        '\n# Pages',
        ...Object.entries(state.scrapedContent.pages).map(([url, markdown]) =>
          `\n## ${url}\n${markdown}`
        )
      ].join('\n\n');

      // Sanitize the markdown to remove noise (SVG data URIs, Google Maps tiles, etc.)
      const allMarkdown = sanitizePracticeContext(rawMarkdown);
      const sanitizationStats = getSanitizationStats(rawMarkdown, allMarkdown);

      console.log('🔍 Scraped content being sent to backend:');
      console.log('- Global markdown length:', state.scrapedContent.global_markdown.length, 'characters');
      console.log('- Number of pages:', Object.keys(state.scrapedContent.pages).length);
      console.log('- Raw combined markdown length:', rawMarkdown.length, 'characters');
      console.log('- Sanitized markdown length:', allMarkdown.length, 'characters');
      console.log(`- Removed ${sanitizationStats.removedChars} chars (${sanitizationStats.removedPercent}% reduction)`);

      // Convert scraped markdown content to questionnaire data format
      // The backend expects questionnaire data, so we put all scraped content in practiceDetails
      const questionnaireDataFromScrape = {
        practiceDetails: allMarkdown,
        siteVision: '',
        primaryAudience: '',
        secondaryAudience: '',
        demographics: '',
        uniqueQualities: '',
        contentCreation: 'new' as const,
        hasBlog: false,
        blogType: '',
        topTreatments: '',
        writingStyle: '',
        topicsToAvoid: '',
        communityEngagement: '',
        testimonials: '',
        patientExperience: '',
        financialOptions: '',
        // Add metadata to indicate this is from scraped content
        _isScrapedContent: true,
        _domain: state.scrapedContent.domain,
        _scrapedAt: state.scrapedContent.metadata.scraped_at,
      };

      // Prepare pages data to send to backend
      // Use sitemapState as primary source (it's the current state), fall back to cached allocated sitemap
      const pagesToSend = hasAllocatedDataInSitemap
        ? sitemapState.pages
        : (state.allocatedSitemap?.pages || sitemapState.pages);

      // Log detailed information about what we're sending
      const pagesCount = Array.isArray(pagesToSend) ? pagesToSend.length : Object.keys(pagesToSend).length;
      console.log('📦 Request payload:', {
        sitemap_pages_count: pagesCount,
        using_allocated_sitemap: useAllocatedSitemap,
        data_source: hasAllocatedDataInSitemap ? 'sitemapState' : 'allocatedSitemap',
        questionnaire_practiceDetails_length: questionnaireDataFromScrape.practiceDetails.length,
        site_type: backendSiteType,
        assign_images: true,
      });

      // Validation: Ensure we're sending what we expect
      if (useAllocatedSitemap) {
        const pagesArray = Array.isArray(pagesToSend) ? pagesToSend : Object.values(pagesToSend);
        const pagesWithAllocated = pagesArray.filter((p: any) => p.allocated_markdown);

        if (pagesWithAllocated.length === 0) {
          console.error('⚠️ WARNING: Expected allocated sitemap but no pages have allocated_markdown!');
          console.error('This suggests a state management issue. Check if Step 3.5 properly saved allocated data.');
          console.error('Current sitemap state:', sitemapState.pages);
          console.error('Migration wizard allocated sitemap:', state.allocatedSitemap);
        } else {
          console.log(`✅ Validation passed: ${pagesWithAllocated.length}/${pagesArray.length} pages have allocated_markdown`);
        }

        // Log sample page data to verify allocated_markdown is present
        const samplePage = pagesArray[0];
        if (samplePage) {
          console.log('📋 Sample page data being sent:', {
            title: samplePage.title,
            hasAllocatedMarkdown: !!samplePage.allocated_markdown,
            allocatedMarkdownLength: samplePage.allocated_markdown?.length || 0,
            hasSourceLocation: !!samplePage.source_location,
            hasAllocationConfidence: !!samplePage.allocation_confidence,
            modelQueryPairsCount: samplePage.model_query_pairs?.length || 0,
          });

          // Log the actual queries being sent
          if (samplePage.model_query_pairs) {
            console.log('📋 First 3 model_query_pairs being sent:');
            samplePage.model_query_pairs.slice(0, 3).forEach((pair: any, idx: number) => {
              console.log(`  ${idx + 1}. ${pair.model}: "${pair.query}"`);
            });
          }
        }

      }

      const result = await generateContentMutation({
        sitemap_data: {
          pages: pagesToSend,
          questionnaireData: questionnaireDataFromScrape as any,
        },
        site_type: backendSiteType,
        assign_images: true,
        use_site_pool: useSitePool,
      });

      actions.setGeneratedContent(result);
    } catch (error) {
      console.error('Content generation failed:', error);
    }
  };

  const handleDownload = () => {
    if (!generateContentData) return;
    const blob = new Blob([JSON.stringify(generateContentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!generateContentData) return;
    navigator.clipboard.writeText(JSON.stringify(generateContentData, null, 2));
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleGenerateGlobal = async () => {
    setGlobalStartTime(Date.now());
    setGlobalElapsedTime(0);
    try {
      // Sanitize global markdown to remove noise (SVG data URIs, map tiles, etc.)
      const sanitizedGlobalMarkdown = state.scrapedContent
        ? sanitizePracticeContext(state.scrapedContent.global_markdown)
        : '';

      await generateGlobalMutation({
        sitemap_data: {
          pages: sitemapState.pages,
          questionnaireData: state.scrapedContent ? {
            practiceDetails: sanitizedGlobalMarkdown,
            _isScrapedContent: true,
            _domain: state.scrapedContent.domain,
          } : {},
        },
        site_type: backendSiteType,
      });
    } catch (error) {
      console.error('Global content generation failed:', error);
    }
  };

  const isGenerating = generateContentStatus === 'pending';
  const hasGenerated = generateContentStatus === 'success' && generateContentData;
  const isGeneratingGlobal = globalContentStatus === 'pending';
  const hasGeneratedGlobal = globalContentStatus === 'success' && globalContentData;

  const globalMarkdownLength = state.scrapedContent.global_markdown.length;
  const totalScrapedChars = globalMarkdownLength + Object.values(state.scrapedContent.pages).reduce((sum, md) => sum + md.length, 0);

  return (
    <div className="step-4-generate">
      <div className="step-4-generate__summary">
        <h3>Ready to Generate Content</h3>
        <div className="step-4-generate__info">
          <div className="info-badge">
            <span className="info-badge__label">Domain:</span>
            <span className="info-badge__value">{state.scrapedContent.domain}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Pages Scraped:</span>
            <span className="info-badge__value">{pagesCount}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Site Type:</span>
            <span className="info-badge__value">{backendSiteType}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Sitemap Sections:</span>
            <span className="info-badge__value">{sitemapState.pages.length}</span>
          </div>
        </div>
        <div className="step-4-generate__context-info">
          <p>
            📝 Using scraped content as context: <strong>{totalScrapedChars.toLocaleString()}</strong> characters from <strong>{pagesCount + 1}</strong> sources (global + {pagesCount} pages)
          </p>
        </div>
        <div className="step-4-generate__options">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={useSitePool}
              onChange={(e) => setUseSitePool(e.target.checked)}
            />
            <span className="checkbox-label">
              Use site-wide image pool (prevents duplicate images across pages)
            </span>
          </label>
        </div>
      </div>

      <div className="step-4-generate__actions">
        {!hasGenerated && (
          <>
            <button
              className="btn btn--primary btn--large"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="spinning" size={20} />
                  Generating Content...
                </>
              ) : (
                <>
                  ✨ Generate Content
                </>
              )}
            </button>
            <button
              className="btn btn--secondary btn--large"
              onClick={handleGenerateGlobal}
              disabled={isGeneratingGlobal}
              style={{ marginLeft: '1rem' }}
            >
              {isGeneratingGlobal ? (
                <>
                  <Loader2 className="spinning" size={20} />
                  Generating Global...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Global Content
                </>
              )}
            </button>
          </>
        )}

        {hasGenerated && (
          <div className="step-4-generate__success">
            <div className="success-message">
              <CheckCircle size={24} className="success-icon" />
              <p>Content generated successfully!{elapsedTime > 0 && <span className="success-time"> ({formatElapsedTime(elapsedTime)})</span>}</p>
            </div>
            <div className="action-buttons">
              <button className="btn btn--primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="spinning" size={18} />
                    Regenerating...
                  </>
                ) : (
                  '✨ Generate Again'
                )}
              </button>
              <button className="btn btn--secondary" onClick={handleDownload}>
                <Download size={18} />
                Download JSON
              </button>
              <button className="btn btn--secondary" onClick={handleCopy}>
                {copiedToClipboard ? <Check size={18} /> : <Copy size={18} />}
                {copiedToClipboard ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="step-4-generate__progress">
          <Loader2 className="progress-spinner spinning" size={48} />
          <p>Generating content from your scraped data and sitemap structure...</p>
          <p className="progress-note">This may take a minute or two.</p>
          {elapsedTime > 0 && (
            <p className="progress-timer">Elapsed: {formatElapsedTime(elapsedTime)}</p>
          )}
        </div>
      )}

      {isGeneratingGlobal && (
        <div className="step-4-generate__progress">
          <Loader2 className="progress-spinner spinning" size={48} />
          <p>Generating global content (header, footer, contact info)...</p>
          <p className="progress-note">This may take a moment.</p>
          {globalElapsedTime > 0 && (
            <p className="progress-timer">Elapsed: {formatElapsedTime(globalElapsedTime)}</p>
          )}
        </div>
      )}

      {hasGeneratedGlobal && globalContentData && (
        <div className="step-4-generate__success">
          <div className="success-message">
            <CheckCircle size={24} className="success-icon" />
            <p>Global content generated successfully!{globalElapsedTime > 0 && <span className="success-time"> ({formatElapsedTime(globalElapsedTime)})</span>}</p>
          </div>
          <div className="step-4-generate__preview">
            <h4>Global Content Preview</h4>
            <textarea
              className="content-preview"
              value={JSON.stringify(globalContentData, null, 2)}
              readOnly
              rows={12}
            />
          </div>
        </div>
      )}

      {hasGenerated && generateContentData && (
        <div className="step-4-generate__preview">
          <h4>Generated Content Preview</h4>
          <textarea
            className="content-preview"
            value={JSON.stringify(generateContentData, null, 2)}
            readOnly
            rows={12}
          />
        </div>
      )}
    </div>
  );
};

export default Step4Generate;
