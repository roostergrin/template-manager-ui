import React from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import PageList from './PageList';

type SitemapExpandedViewProps = {
  pages: SitemapSection[];
  currentModels: string[];
  updatePageTitle: (id: string, title: string) => void;
  updatePageWordpressId: (id: string, wpId: string) => void;
  updatePageItems: (id: string, items: SitemapItem[]) => void;
  removePage: (id: string) => void;
  addPage: () => void;
};

const SitemapExpandedView: React.FC<SitemapExpandedViewProps> = ({
  pages,
  currentModels,
  updatePageTitle,
  updatePageWordpressId,
  updatePageItems,
  removePage,
  addPage,
}) => {
  return (
    <div className="sitemap-expanded-view">
      <div className="sitemap-expanded-view__header">
        <h3 className="sitemap-expanded-view__title">Expanded View (550px)</h3>
        <p className="sitemap-expanded-view__description">
          Full editing experience with show/delete buttons, page IDs, and query inputs
        </p>
      </div>
      
      <PageList
        pages={pages}
        useGridLayout={true}
        gridColumnWidth={550}
        showItemNumbers={false}
        showPageIds={true}
        showDeleteButtons={true}
        showSelect={true}
        showTextarea={true}
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

export default SitemapExpandedView;