import React from 'react';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import PageCard from './PageCard';

const PageList: React.FC = () => {
  const { state, actions } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  
  const {
    pages,
    useGridLayout,
    gridColumnWidth,
    showItemNumbers,
    showPageIds,
    showDeleteButtons,
    showSelect,
    showTextarea
  } = state;
  
  const {
    updatePageTitle,
    updatePageWordpressId,
    updatePageItems,
    removePage,
    addPage
  } = actions;
  
  // Get current models from AppConfig context
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const currentModels = appConfigState.modelGroups[selectedModelGroupKey]?.models || [];
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