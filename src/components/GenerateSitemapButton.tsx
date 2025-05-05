import React, { useEffect, useCallback } from 'react';
import { MutationStatus } from '@tanstack/react-query';
import LoadingOverlay from './LoadingOverlay';
import { QuestionnaireData, GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';

type ControlsProps = {
  usePageJson: boolean;
  toggleUsePageJson: () => void;
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
  const { usePageJson, toggleUsePageJson, backendSiteType } = controls;

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
      use_page_json: usePageJson,
    });
  }, [questionnaireData, backendSiteType, usePageJson, generateSitemap]);

  return (
    <div className="flex flex-col gap-2 items-start mb-4">
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium" aria-label="Current Site Type" tabIndex={0}>
          Current Site Type:
          <span className="text-blue-700 ml-1">{backendSiteType}</span>
        </span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={usePageJson}
            onChange={toggleUsePageJson}
            aria-label="Use Page JSON"
            tabIndex={0}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span className="text-gray-700">Use Page JSON</span>
        </label>
      </div>
      {generateSitemapStatus === 'pending' && <LoadingOverlay />}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={handleClick}
        aria-label="Generate Sitemap"
        tabIndex={0}
        disabled={generateSitemapStatus === 'pending'}
      >
        Generate Sitemap
      </button>
    </div>
  );
};

export default GenerateSitemapButton; 