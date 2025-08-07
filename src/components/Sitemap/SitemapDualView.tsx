import React from 'react';
import SitemapCompactView from './SitemapCompactView';
import SitemapExpandedView from './SitemapExpandedView';
import { useSitemap } from '../../contexts/SitemapProvider';

const SummaryPanel: React.FC = () => {
  const { state } = useSitemap();
  const totalPages = state.pages.length;
  const totalItems = state.pages.reduce((acc, p) => acc + p.items.length, 0);
  const modelsCount: Record<string, number> = {};
  state.pages.forEach(p => p.items.forEach(i => { modelsCount[i.model] = (modelsCount[i.model] || 0) + 1; }));

  const topModels = Object.entries(modelsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <aside className="sitemap-summary-panel" aria-label="Sitemap summary" style={{
      border: '1px solid #e5e7eb', borderRadius: 8, padding: 12,
      background: '#fafafa'
    }}>
      <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Summary</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><div style={{ fontSize: 12, color: '#6b7280' }}>Pages</div><div>{totalPages}</div></div>
        <div><div style={{ fontSize: 12, color: '#6b7280' }}>Items</div><div>{totalItems}</div></div>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Top Models</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        {topModels.map(([model, count]) => (
          <li key={model} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{model}</span>
            <span style={{ color: '#6b7280' }}>{count}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const SitemapDualView: React.FC = () => {
  return (
    <div className="sitemap-dual-view">
      <div className="sitemap-dual-view__header">
        <h2 className="sitemap-dual-view__title">Sitemap Builder - Dual View</h2>
        <p className="sitemap-dual-view__description">
          Compare compact and expanded views side by side
        </p>
      </div>
      
      <div className="sitemap-dual-view__container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 16 }}>
        <div className="sitemap-dual-view__section">
          <SitemapCompactView />
        </div>
        <div className="sitemap-dual-view__section">
          <SitemapExpandedView />
        </div>
        <SummaryPanel />
      </div>
    </div>
  );
};

export default SitemapDualView;