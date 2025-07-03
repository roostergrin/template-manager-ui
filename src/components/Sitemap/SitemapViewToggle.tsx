import React, { useState } from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import SitemapDualView from './SitemapDualView';
import ViewControls from './ViewControls';
import LayoutControls from './LayoutControls';
import PageList from './PageList';
import './SitemapDualView.sass';

type SitemapViewToggleProps = {
  pages: SitemapSection[];
  currentModels: string[];
  updatePageTitle: (id: string, title: string) => void;
  updatePageWordpressId: (id: string, wpId: string) => void;
  updatePageItems: (id: string, items: SitemapItem[]) => void;
  removePage: (id: string) => void;
  addPage: () => void;
  // View control props
  showSelect: boolean;
  toggleShowSelect: () => void;
  showTextarea: boolean;
  toggleShowTextarea: () => void;
  showDeleteButtons: boolean;
  toggleShowDeleteButtons: () => void;
  showItemNumbers: boolean;
  toggleShowItemNumbers: () => void;
  showPageIds: boolean;
  toggleShowPageIds: () => void;
  // Layout control props
  useGridLayout: boolean;
  toggleUseGridLayout: () => void;
  gridColumnWidth: number;
  setGridColumnWidth: (n: number) => void;
};

type ViewMode = 'original' | 'dual' | 'compact' | 'expanded';

const SitemapViewToggle: React.FC<SitemapViewToggleProps> = ({
  pages,
  currentModels,
  updatePageTitle,
  updatePageWordpressId,
  updatePageItems,
  removePage,
  addPage,
  showSelect,
  toggleShowSelect,
  showTextarea,
  toggleShowTextarea,
  showDeleteButtons,
  toggleShowDeleteButtons,
  showItemNumbers,
  toggleShowItemNumbers,
  showPageIds,
  toggleShowPageIds,
  useGridLayout,
  toggleUseGridLayout,
  gridColumnWidth,
  setGridColumnWidth,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('original');

  const renderViewModeSelector = () => (
    <div className="sitemap-view-toggle">
      <div className="sitemap-view-toggle__header">
        <h3 className="sitemap-view-toggle__title">Sitemap View Mode</h3>
        <div className="sitemap-view-toggle__buttons">
          <button
            className={`sitemap-view-toggle__button ${
              viewMode === 'original' ? 'sitemap-view-toggle__button--active' : ''
            }`}
            onClick={() => setViewMode('original')}
          >
            🔧 Original
          </button>
          <button
            className={`sitemap-view-toggle__button ${
              viewMode === 'dual' ? 'sitemap-view-toggle__button--active' : ''
            }`}
            onClick={() => setViewMode('dual')}
          >
            👥 Dual View
          </button>
          <button
            className={`sitemap-view-toggle__button ${
              viewMode === 'compact' ? 'sitemap-view-toggle__button--active' : ''
            }`}
            onClick={() => setViewMode('compact')}
          >
            📱 Compact (225px)
          </button>
          <button
            className={`sitemap-view-toggle__button ${
              viewMode === 'expanded' ? 'sitemap-view-toggle__button--active' : ''
            }`}
            onClick={() => setViewMode('expanded')}
          >
            🖥️ Expanded (550px)
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'dual':
        return (
          <SitemapDualView
            pages={pages}
            currentModels={currentModels}
            updatePageTitle={updatePageTitle}
            updatePageWordpressId={updatePageWordpressId}
            updatePageItems={updatePageItems}
            removePage={removePage}
            addPage={addPage}
          />
        );

      case 'compact':
        return (
          <div className="sitemap-single-view">
            <div className="sitemap-single-view__header">
              <h3>📱 Compact View (225px)</h3>
              <p>Essential page editing with show/delete buttons and page IDs</p>
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

      case 'expanded':
        return (
          <div className="sitemap-single-view">
            <div className="sitemap-single-view__header">
              <h3>🖥️ Expanded View (550px)</h3>
              <p>Full editing experience with show/delete buttons, page IDs, and query inputs</p>
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

      case 'original':
      default:
        return (
          <div className="sitemap-original-view">
            <ViewControls
              showSelect={showSelect}
              toggleShowSelect={toggleShowSelect}
              showTextarea={showTextarea}
              toggleShowTextarea={toggleShowTextarea}
              showDeleteButtons={showDeleteButtons}
              toggleShowDeleteButtons={toggleShowDeleteButtons}
              showItemNumbers={showItemNumbers}
              toggleShowItemNumbers={toggleShowItemNumbers}
              showPageIds={showPageIds}
              toggleShowPageIds={toggleShowPageIds}
            />
            
            <LayoutControls
              useGridLayout={useGridLayout}
              toggleUseGridLayout={toggleUseGridLayout}
              gridColumnWidth={gridColumnWidth}
              setGridColumnWidth={setGridColumnWidth}
            />
            
            <PageList
              pages={pages}
              useGridLayout={useGridLayout}
              gridColumnWidth={gridColumnWidth}
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
              addPage={addPage}
            />
          </div>
        );
    }
  };

  return (
    <div className="sitemap-view-container">
      {renderViewModeSelector()}
      {renderContent()}
    </div>
  );
};

export default SitemapViewToggle;