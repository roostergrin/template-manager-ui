import React from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import PageCard from './PageCard';

type PageListProps = {
  pages: SitemapSection[];
  useGridLayout: boolean;
  gridColumnWidth: number;
  showItemNumbers: boolean;
  showPageIds: boolean;
  showDeleteButtons: boolean;
  showSelect: boolean;
  showTextarea: boolean;
  currentModels: string[];
  updatePageTitle: (id: string, title: string) => void;
  updatePageWordpressId: (id: string, wpId: string) => void;
  updatePageItems: (id: string, items: SitemapItem[]) => void;
  removePage: (id: string) => void;
  addPage: () => void;
};

const PageList: React.FC<PageListProps> = ({
  pages,
  useGridLayout,
  gridColumnWidth,
  showItemNumbers,
  showPageIds,
  showDeleteButtons,
  showSelect,
  showTextarea,
  currentModels,
  updatePageTitle,
  updatePageWordpressId,
  updatePageItems,
  removePage,
  addPage,
}) => {
  return (
    <div
      className="app__page-container mb-6"
      style={useGridLayout
        ? {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridColumnWidth}px, 1fr))`,
            gap: '1rem',
          }
        : {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
    >
      {pages.map((page, index) => (
        <PageCard
          key={page.id}
          page={page}
          index={index}
          showItemNumbers={showItemNumbers}
          showPageIds={showPageIds}
          showDeleteButtons={showDeleteButtons}
          showSelect={showSelect}
          showTextarea={showTextarea}
          currentModels={currentModels}
          updatePageTitle={updatePageTitle}
          updatePageWordpressId={updatePageWordpressId}
          updatePageItems={updatePageItems}
          removePage={removePage}
        />
      ))}
      <button
        className="app__add-page-button bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
        onClick={addPage}
        aria-label="Add Page"
        tabIndex={0}
      >
        Add Page
      </button>
    </div>
  );
};

export default PageList; 