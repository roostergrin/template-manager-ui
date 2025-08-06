import React, { useState } from 'react';
import SitemapDualView from './SitemapDualView';
import ViewControls from './ViewControls';
import LayoutControls from './LayoutControls';
import PageList from './PageList';
import './SitemapDualView.sass';

type ViewMode = 'original' | 'dual' | 'compact' | 'expanded';

const SitemapViewToggle: React.FC = () => {
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
        return <SitemapDualView />;

      case 'compact':
        return (
          <div className="sitemap-single-view">
            <div className="sitemap-single-view__header">
              <h3>📱 Compact View (225px)</h3>
              <p>Essential page editing with show/delete buttons and page IDs</p>
            </div>
            <PageList />
          </div>
        );

      case 'expanded':
        return (
          <div className="sitemap-single-view">
            <div className="sitemap-single-view__header">
              <h3>🖥️ Expanded View (550px)</h3>
              <p>Full editing experience with show/delete buttons, page IDs, and query inputs</p>
            </div>
            <PageList />
          </div>
        );

      case 'original':
      default:
        return (
          <div className="sitemap-original-view">
            <ViewControls />
            <LayoutControls />
            <PageList />
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