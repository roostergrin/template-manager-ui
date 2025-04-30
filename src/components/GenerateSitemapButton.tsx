import React from 'react';
import { QueryStatus } from '@tanstack/react-query';
import LoadingOverlay from './LoadingOverlay';

export type GenerateSitemapButtonProps = {
  questionnaireData: Record<string, unknown>;
  backendSiteType: string;
  usePageJson: boolean;
  generateSitemap: (params: { questionnaire: Record<string, unknown>; site_type: string; use_page_json: boolean }) => void;
  generateSitemapStatus: QueryStatus;
  generateSitemapData: any;
  onSitemapGenerated: (sitemapData: any) => void;
};

const GenerateSitemapButton: React.FC<GenerateSitemapButtonProps> = ({
  questionnaireData,
  backendSiteType,
  usePageJson,
  generateSitemap,
  generateSitemapStatus,
  generateSitemapData,
  onSitemapGenerated,
}) => {
  React.useEffect(() => {
    if (
      generateSitemapStatus === 'success' &&
      generateSitemapData &&
      generateSitemapData.sitemap_data &&
      generateSitemapData.sitemap_data.pages
    ) {
      onSitemapGenerated(generateSitemapData.sitemap_data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSitemapStatus, generateSitemapData]);

  const handleClick = React.useCallback(() => {
    generateSitemap({
      questionnaire: questionnaireData,
      site_type: backendSiteType,
      use_page_json: usePageJson,
    });
  }, [questionnaireData, backendSiteType, usePageJson, generateSitemap]);

  return (
    <>
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
    </>
  );
};

export default GenerateSitemapButton; 