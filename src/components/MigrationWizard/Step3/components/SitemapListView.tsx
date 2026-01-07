import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, CheckCircle } from 'lucide-react';
import './SitemapListView.sass';

interface PageItem {
  id: string;
  model: string;
  query: string;
}

interface SitemapPage {
  id: string;
  title: string;
  path?: string;
  items?: PageItem[];
  allocated_markdown?: string;
  children?: SitemapPage[];
}

interface SitemapListViewProps {
  pages: SitemapPage[];
  level?: number;
}

const SitemapListView: React.FC<SitemapListViewProps> = ({ pages, level = 0 }) => {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const toggleExpand = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const hasChildren = (page: SitemapPage) => {
    return (page.children && page.children.length > 0) || (page.items && page.items.length > 0);
  };

  return (
    <div className="sitemap-list-view">
      {pages.map((page) => {
        const isExpanded = expandedPages.has(page.id);
        const hasContent = hasChildren(page);
        const hasAllocation = !!page.allocated_markdown;
        const sectionCount = page.items?.length || 0;

        return (
          <div key={page.id} className="sitemap-list-view__item" style={{ paddingLeft: `${level * 1.25}rem` }}>
            <div
              className={`sitemap-list-view__row ${hasContent ? 'sitemap-list-view__row--expandable' : ''}`}
              onClick={() => hasContent && toggleExpand(page.id)}
            >
              <span className="sitemap-list-view__toggle">
                {hasContent ? (
                  isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                  <FileText size={14} className="sitemap-list-view__icon--muted" />
                )}
              </span>

              <span className="sitemap-list-view__title">{page.title}</span>

              {sectionCount > 0 && (
                <span className="sitemap-list-view__badge sitemap-list-view__badge--sections">
                  {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                </span>
              )}

              {hasAllocation && (
                <span className="sitemap-list-view__badge sitemap-list-view__badge--allocated">
                  <CheckCircle size={12} />
                  allocated
                </span>
              )}
            </div>

            {isExpanded && page.items && page.items.length > 0 && (
              <div className="sitemap-list-view__sections">
                {page.items.map((item, index) => (
                  <div key={item.id || index} className="sitemap-list-view__section">
                    <span className="sitemap-list-view__section-model">{item.model}</span>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && page.children && page.children.length > 0 && (
              <SitemapListView pages={page.children} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SitemapListView;
