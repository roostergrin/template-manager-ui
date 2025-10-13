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
};

const GenerateSitemapButton: React.FC<GenerateSitemapButtonProps> = ({
  questionnaireData,
  generateSitemap,
  generateSitemapStatus,
  generateSitemapData,
  onSitemapGenerated,
  controls,
  scrapedContent,
}) => {
  const { backendSiteType } = controls;
  const hasProcessedCurrentSuccessRef = useRef<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedPath, setSavedPath] = useState<string>('');

  useEffect(() => {
    if (
      generateSitemapStatus === 'success' &&
      generateSitemapData?.sitemap_data &&
      (generateSitemapData.sitemap_data as any).pages &&
      !hasProcessedCurrentSuccessRef.current
    ) {
      // Mark as processed to prevent duplicate calls
      hasProcessedCurrentSuccessRef.current = true;
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
    generateSitemap({
      questionnaire: questionnaireData,
      site_type: backendSiteType,
      use_page_json: true,
    });
  }, [questionnaireData, backendSiteType, generateSitemap]);

  const pagesCount = generateSitemapData?.sitemap_data
    ? Object.keys((generateSitemapData.sitemap_data as any).pages || {}).length
    : 0;

  return (
    <div className="generate-sitemap-button">
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
