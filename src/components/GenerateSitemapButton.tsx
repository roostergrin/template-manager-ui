import React, { useEffect, useCallback } from 'react';
import { MutationStatus } from '@tanstack/react-query';
import LoadingOverlay from './LoadingOverlay';
import { QuestionnaireData, GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';
import './GenerateSitemapButton.sass';

type ControlsProps = {
  backendSiteType: string;
};

export type GenerateSitemapButtonProps = {
  questionnaireData: QuestionnaireData;
  generateSitemap: (params: GenerateSitemapRequest) => void;
  generateSitemapStatus: MutationStatus;
  generateSitemapData?: GenerateSitemapResponse;
  onSitemapGenerated: (sitemapData: unknown) => void;
  controls: ControlsProps;
};

const GenerateSitemapButton: React.FC<GenerateSitemapButtonProps> = ({
  questionnaireData,
  generateSitemap,
  generateSitemapStatus,
  generateSitemapData,
  onSitemapGenerated,
  controls,
}) => {
  const { backendSiteType } = controls;

  useEffect(() => {
    if (
      generateSitemapStatus === 'success' &&
      generateSitemapData?.sitemap_data &&
      (generateSitemapData.sitemap_data as any).pages
    ) {
      onSitemapGenerated(generateSitemapData.sitemap_data as unknown);
    }
  }, [generateSitemapStatus, generateSitemapData, onSitemapGenerated]);

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
        <h3 className="generate-sitemap-button__title">Generate Sitemap</h3>
      </div>
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
