import React from 'react';
import PageList from './PageList';

const SitemapCompactView: React.FC = () => {
  return (
    <div className="sitemap-compact-view">
      <div className="sitemap-compact-view__header">
        <h3 className="sitemap-compact-view__title">Compact View (225px)</h3>
        <p className="sitemap-compact-view__description">
          Essential page editing with show/delete buttons and page IDs
        </p>
      </div>
      
      <PageList />
    </div>
  );
};

export default SitemapCompactView;