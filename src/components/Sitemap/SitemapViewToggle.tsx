import React from 'react';
import PageList from './PageList';

interface SitemapViewToggleProps {
  headerControls?: React.ReactNode;
  contentSourceInfo?: {
    domain: string;
    pagesCount: number;
  };
  additionalActions?: React.ReactNode;
  exportImportControls?: React.ReactNode;
}

const SitemapViewToggle: React.FC<SitemapViewToggleProps> = (props) => {
  return (
    <div className="sitemap-view-container">
      <PageList {...props} />
    </div>
  );
};

export default SitemapViewToggle;