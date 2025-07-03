import React from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import PageList from './PageList';

type SitemapCompactViewProps = {
  pages: SitemapSection[];
  currentModels: string[];
  updatePageTitle: (id: string, title: string) => void;
  updatePageWordpressId: (id: string, wpId: string) => void;
  updatePageItems: (id: string, items: SitemapItem[]) => void;
  removePage: (id: string) => void;
  addPage: () => void;
};

const SitemapCompactView: React.FC<SitemapCompactViewProps> = ({
  pages,
  currentModels,
  updatePageTitle,
  updatePageWordpressId,
  updatePageItems,
  removePage,
  addPage,
}) => {
  return (
    <div className="sitemap-compact-view">
      <div className="sitemap-compact-view__header">
        <h3 className="sitemap-compact-view__title">Compact View (225px)</h3>
        <p className="sitemap-compact-view__description">
          Essential page editing with show/delete buttons and page IDs
        </p>
      </div>
      
      <PageList
        pages={pages}
        useGridLayout={true}
        gridColumnWidth={225}
        showItemNumbers={false}
        showPageIds={true}
        showDeleteButtons={true}
        showSelect={true}
        showTextarea={false}
        currentModels={currentModels}
        updatePageTitle={updatePageTitle}
        updatePageWordpressId={updatePageWordpressId}
        updatePageItems={updatePageItems}
        removePage={removePage}
        addPage={addPage}
      />
    </div>
  );
};

export default SitemapCompactView;