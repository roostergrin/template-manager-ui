import React from 'react';
import SitemapCompactView from './SitemapCompactView';
import SitemapExpandedView from './SitemapExpandedView';

const SitemapDualView: React.FC = () => {
  return (
    <div className="sitemap-dual-view">
      <div className="sitemap-dual-view__header">
        <h2 className="sitemap-dual-view__title">Sitemap Builder - Dual View</h2>
        <p className="sitemap-dual-view__description">
          Compare compact and expanded views side by side
        </p>
      </div>
      
      <div className="sitemap-dual-view__container">
        <div className="sitemap-dual-view__section">
          <SitemapCompactView />
        </div>
        
        <div className="sitemap-dual-view__section">
          <SitemapExpandedView />
        </div>
      </div>
    </div>
  );
};

export default SitemapDualView;