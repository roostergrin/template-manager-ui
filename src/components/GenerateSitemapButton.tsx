import React, { useEffect, useCallback, useRef } from 'react';
import { MutationStatus } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
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
    }

    // Reset the flag when status changes to pending (new generation starting)
    if (generateSitemapStatus === 'pending') {
      hasProcessedCurrentSuccessRef.current = false;
    }
  }, [generateSitemapStatus, generateSitemapData, backendSiteType]); // Removed onSitemapGenerated from dependencies

  const handleClick = useCallback(() => {
    generateSitemap({
      questionnaire: questionnaireData,
      site_type: backendSiteType,
      use_page_json: true,
    });
  }, [questionnaireData, backendSiteType, generateSitemap]);

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
    </div>
  );
};

export default GenerateSitemapButton; 
