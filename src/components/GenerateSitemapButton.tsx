import React, { useEffect, useCallback, useRef, useState } from 'react';
import { MutationStatus } from '@tanstack/react-query';
import { Plus, CheckCircle, X } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import { QuestionnaireData, GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';
import './GenerateSitemapButton.sass';

type ControlsProps = {
  backendSiteType: string;
};

type ScrapedContentInfo = {
  domain: string;
  pagesCount: number;
  timestamp?: string;
};

export type GenerateSitemapButtonProps = {
  questionnaireData: QuestionnaireData;
  generateSitemap: (params: GenerateSitemapRequest) => void;
  generateSitemapStatus: MutationStatus;
  generateSitemapData?: GenerateSitemapResponse;
  onSitemapGenerated: (sitemapData: unknown, siteType?: string) => void;
  controls: ControlsProps;
  scrapedContent?: ScrapedContentInfo;
  fullScrapedContent?: any; // Full scraped content object for the new endpoint
  allocatedSitemap?: any; // Existing sitemap with allocated markdown
  currentSitemapPages?: any[]; // Current sitemap pages (may have allocated markdown from import)
};

const GenerateSitemapButton: React.FC<GenerateSitemapButtonProps> = ({
  questionnaireData,
  generateSitemap,
  generateSitemapStatus,
  generateSitemapData,
  onSitemapGenerated,
  controls,
  scrapedContent,
  fullScrapedContent,
  allocatedSitemap,
  currentSitemapPages,
}) => {
  const { backendSiteType } = controls;
  const hasProcessedCurrentSuccessRef = useRef<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedPath, setSavedPath] = useState<string>('');
  const [strictTemplateMode, setStrictTemplateMode] = useState(false);

  useEffect(() => {
    if (
      generateSitemapStatus === 'success' &&
      generateSitemapData?.sitemap_data &&
      (generateSitemapData.sitemap_data as any).pages &&
      !hasProcessedCurrentSuccessRef.current
    ) {
      // Mark as processed to prevent duplicate calls
      hasProcessedCurrentSuccessRef.current = true;

      console.log('✅ Sitemap generated successfully, calling onSitemapGenerated');
      console.log('📋 Generated sitemap has', Object.keys((generateSitemapData.sitemap_data as any).pages).length, 'pages');

      onSitemapGenerated(generateSitemapData.sitemap_data as unknown, backendSiteType);

      // Show success dialog
      setShowSuccessDialog(true);
      if ((generateSitemapData as any).saved_path) {
        setSavedPath((generateSitemapData as any).saved_path);
      }
    }

    // Reset the flag when status changes to pending (new generation starting)
    if (generateSitemapStatus === 'pending') {
      hasProcessedCurrentSuccessRef.current = false;
      setShowSuccessDialog(false);
    }
  }, [generateSitemapStatus, generateSitemapData, backendSiteType]); // Removed onSitemapGenerated from dependencies

  const handleClick = useCallback(() => {
    console.log('🔍 DEBUG: fullScrapedContent:', fullScrapedContent);
    console.log('🔍 DEBUG: allocatedSitemap:', allocatedSitemap);
    console.log('🔍 DEBUG: currentSitemapPages:', currentSitemapPages);

    // Check if we're in scraping mode (has scraped content)
    if (fullScrapedContent) {
      // Scraping mode - build sitemap to send
      let sitemapToSend = allocatedSitemap;

      if (!sitemapToSend && currentSitemapPages && currentSitemapPages.length > 0) {
        console.log('📋 Building sitemap from current pages');
        const pagesObject: Record<string, any> = {};
        currentSitemapPages.forEach((page) => {
          const pageTitle = page.title || 'Untitled';
          pagesObject[pageTitle] = {
            internal_id: page.id || `page-${pageTitle.toLowerCase().replace(/\s+/g, '-')}`,
            page_id: page.id || pageTitle,
            model_query_pairs: page.sections || [],
            ...(page.allocated_markdown && { allocated_markdown: page.allocated_markdown }),
            ...(page.allocation_confidence && { allocation_confidence: page.allocation_confidence }),
            ...(page.source_location && { source_location: page.source_location }),
            ...(page.mapped_scraped_page && { mapped_scraped_page: page.mapped_scraped_page }),
          };
        });

        sitemapToSend = {
          pages: pagesObject,
          modelGroups: [],
          siteType: backendSiteType,
          questionnaireData: questionnaireData || {},
        };
        console.log('✅ Built sitemap with', Object.keys(pagesObject).length, 'pages');
      }

      console.log('🚀 Sending to /generate-sitemap-from-scraped/');
      console.log(`📐 Strict Template Mode: ${strictTemplateMode}`);
      generateSitemap({
        scraped_content: fullScrapedContent,
        site_type: backendSiteType,
        sitemap: sitemapToSend,
        strict_template_mode: strictTemplateMode,
      } as any);
    } else {
      // Questionnaire/Markdown mode - send questionnaire data
      console.log('🚀 Sending to /generate-sitemap/');
      generateSitemap({
        questionnaire: questionnaireData,
        site_type: backendSiteType,
        use_page_json: false,
      } as any);
    }
  }, [fullScrapedContent, backendSiteType, allocatedSitemap, currentSitemapPages, questionnaireData, generateSitemap, strictTemplateMode]);

  const pagesCount = generateSitemapData?.sitemap_data
    ? Object.keys((generateSitemapData.sitemap_data as any).pages || {}).length
    : 0;

  return (
    <div className="generate-sitemap-button">
      {/* Strict Template Mode toggle - only show when using scraped content */}
      {fullScrapedContent && (
        <label className="generate-sitemap-button__strict-mode">
          <input
            type="checkbox"
            checked={strictTemplateMode}
            onChange={(e) => setStrictTemplateMode(e.target.checked)}
            disabled={generateSitemapStatus === 'pending'}
          />
          <span className="generate-sitemap-button__strict-mode-label">
            Strict Template Mode
          </span>
          <span className="generate-sitemap-button__strict-mode-hint">
            Follow template sections closely, only fill in content
          </span>
        </label>
      )}
      <button
        className="generate-sitemap-button__button"
        onClick={handleClick}
        aria-label="Generate Sitemap"
        tabIndex={0}
        disabled={generateSitemapStatus === 'pending'}
      >
        <Plus size={16} />
        Generate Sitemap
        <span className="generate-sitemap-button__beta-badge">Beta</span>
      </button>
      {generateSitemapStatus === 'pending' && (
        <div className="generate-sitemap-button__loading-overlay">
          <LoadingOverlay />
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="generate-sitemap-button__dialog-overlay" onClick={() => setShowSuccessDialog(false)}>
          <div className="generate-sitemap-button__dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="generate-sitemap-button__dialog-close"
              onClick={() => setShowSuccessDialog(false)}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="generate-sitemap-button__dialog-icon">
              <CheckCircle size={64} />
            </div>

            <h2 className="generate-sitemap-button__dialog-title">
              Sitemap Generated Successfully!
            </h2>

            <p className="generate-sitemap-button__dialog-message">
              Your sitemap has been generated and saved.
            </p>

            <div className="generate-sitemap-button__dialog-stats">
              <div className="generate-sitemap-button__stat">
                <span className="generate-sitemap-button__stat-value">{pagesCount}</span>
                <span className="generate-sitemap-button__stat-label">Pages</span>
              </div>
              <div className="generate-sitemap-button__stat">
                <span className="generate-sitemap-button__stat-value">{backendSiteType}</span>
                <span className="generate-sitemap-button__stat-label">Site Type</span>
              </div>
            </div>

            {savedPath && (
              <div className="generate-sitemap-button__dialog-path">
                <strong>Saved to:</strong>
                <code>{savedPath}</code>
              </div>
            )}

            <button
              className="generate-sitemap-button__dialog-button"
              onClick={() => setShowSuccessDialog(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateSitemapButton; 
