import React, { useEffect, useCallback, useRef } from 'react';
import { MutationStatus } from '@tanstack/react-query';
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
  onSitemapGenerated: (sitemapData: unknown) => void;
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

  useEffect(() => {
    if (
      generateSitemapStatus === 'success' &&
      generateSitemapData?.sitemap_data &&
      (generateSitemapData.sitemap_data as any).pages &&
      !hasProcessedCurrentSuccessRef.current
    ) {
      // Mark as processed to prevent duplicate calls
      hasProcessedCurrentSuccessRef.current = true;
      onSitemapGenerated(generateSitemapData.sitemap_data as unknown);
    }
    
    // Reset the flag when status changes to pending (new generation starting)
    if (generateSitemapStatus === 'pending') {
      hasProcessedCurrentSuccessRef.current = false;
    }
  }, [generateSitemapStatus, generateSitemapData]); // Removed onSitemapGenerated from dependencies

  const handleClick = useCallback(() => {
    generateSitemap({
      questionnaire: questionnaireData,
      site_type: backendSiteType,
      use_page_json: true,
    });
  }, [questionnaireData, backendSiteType, generateSitemap]);

  return (
    <div className="generate-sitemap-button">
      <div className="generate-sitemap-button__header">
        <h3 className="generate-sitemap-button__title">Generate New Sitemap <span className="generate-sitemap-button__beta-badge">Beta</span></h3>
      </div>

      {scrapedContent && (
        <div className="generate-sitemap-button__content-source">
          <h4 className="generate-sitemap-button__content-source-title">Content Source</h4>
          <div className="generate-sitemap-button__content-info">
            <div className="generate-sitemap-button__info-item">
              <span className="generate-sitemap-button__info-label">Domain:</span>
              <span className="generate-sitemap-button__info-value">{scrapedContent.domain}</span>
            </div>
            <div className="generate-sitemap-button__info-item">
              <span className="generate-sitemap-button__info-label">Pages:</span>
              <span className="generate-sitemap-button__info-value">{scrapedContent.pagesCount}</span>
            </div>
            {scrapedContent.timestamp && (
              <div className="generate-sitemap-button__info-item">
                <span className="generate-sitemap-button__info-label">Scraped:</span>
                <span className="generate-sitemap-button__info-value">
                  {new Date(scrapedContent.timestamp).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="generate-sitemap-button__info-section">
        <div
          className="generate-sitemap-button__site-type-info"
          aria-label="Current Site Type"
          tabIndex={0}
        >
          <span className="generate-sitemap-button__site-type-label">
            Current Site Type:
          </span>
          <span className="generate-sitemap-button__site-type-value">
            {backendSiteType}
          </span>
        </div>
        <div className="generate-sitemap-button__page-json-info">
          Using Page JSON
        </div>
      </div>

      <div className="generate-sitemap-button__action-section">
        <button
          className="generate-sitemap-button__button"
          onClick={handleClick}
          aria-label="Generate Sitemap"
          tabIndex={0}
          disabled={generateSitemapStatus === 'pending'}
        >
          Generate Sitemap
        </button>
        {generateSitemapStatus === 'pending' && (
          <div className="generate-sitemap-button__loading-overlay">
            <LoadingOverlay />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateSitemapButton; 
