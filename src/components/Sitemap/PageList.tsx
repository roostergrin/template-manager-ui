import React from 'react';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import PageCard from './PageCard';

const PageList: React.FC = () => {
  const { state, actions } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  
  const {
    pages,
    viewMode,
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
  // Determine layout based on viewMode and useGridLayout
  const isCompactMode = viewMode === 'list';
  const useFlexLayout = isCompactMode || !useGridLayout;
  
  return (
    <div
      className="app__page-container mb-6"
      style={useFlexLayout
        ? {
            display: 'flex',
            flexDirection: 'column',
            gap: isCompactMode ? '0.5rem' : '1rem',
          }
        : {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridColumnWidth}px, 1fr))`,
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
          isCompactMode={isCompactMode}
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