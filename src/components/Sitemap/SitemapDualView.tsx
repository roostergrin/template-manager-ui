import React from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import SitemapCompactView from './SitemapCompactView';
import SitemapExpandedView from './SitemapExpandedView';

type SitemapDualViewProps = {
  pages: SitemapSection[];
  currentModels: string[];
  updatePageTitle: (id: string, title: string) => void;
  updatePageWordpressId: (id: string, wpId: string) => void;
  updatePageItems: (id: string, items: SitemapItem[]) => void;
  removePage: (id: string) => void;
  addPage: () => void;
};

const SitemapDualView: React.FC<SitemapDualViewProps> = ({
  pages,
  currentModels,
  updatePageTitle,
  updatePageWordpressId,
  updatePageItems,
  removePage,
  addPage,
}) => {
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
          <SitemapCompactView
            pages={pages}
            currentModels={currentModels}
            updatePageTitle={updatePageTitle}
            updatePageWordpressId={updatePageWordpressId}
            updatePageItems={updatePageItems}
            removePage={removePage}
            addPage={addPage}
          />
        </div>
        
        <div className="sitemap-dual-view__section">
          <SitemapExpandedView
            pages={pages}
            currentModels={currentModels}
            updatePageTitle={updatePageTitle}
            updatePageWordpressId={updatePageWordpressId}
            updatePageItems={updatePageItems}
            removePage={removePage}
            addPage={addPage}
          />
        </div>
      </div>
    </div>
  );
};

export default SitemapDualView;