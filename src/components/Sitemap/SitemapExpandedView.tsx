import React from 'react';
import PageList from './PageList';

const SitemapExpandedView: React.FC = () => {
  return (
    <div className="sitemap-expanded-view">
      <div className="sitemap-expanded-view__header">
        <h3 className="sitemap-expanded-view__title">Expanded View (550px)</h3>
        <p className="sitemap-expanded-view__description">
          Full editing experience with show/delete buttons, page IDs, and query inputs
        </p>
      </div>
      
      <PageList />
    </div>
  );
};

export default SitemapExpandedView;