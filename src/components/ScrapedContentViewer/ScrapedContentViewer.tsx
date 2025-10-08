import React, { useState } from 'react';
import './ScrapedContentViewer.sass';

interface ScrapedImage {
  url: string;
  alt?: string;
}

interface ScrapedSection {
  type: string;
  content: string;
  images: ScrapedImage[];
}

interface ScrapedPage {
  page_key: string;
  title: string;
  url: string;
  sections: ScrapedSection[];
  images: ScrapedImage[];
  metadata: {
    total_sections: number;
    total_images: number;
    content_length: number;
  };
}

interface GlobalContent {
  header: string;
  footer: string;
}

export interface ScrapedContent {
  success: boolean;
  domain: string;
  global_content: GlobalContent;
  pages: ScrapedPage[];
  metadata: {
    total_pages: number;
    total_images: number;
    total_sections: number;
    scraped_at: string;
  };
  raw_markdown?: {
    global: string;
    pages: { [key: string]: string };
  };
}

interface ScrapedContentViewerProps {
  scrapedContent: ScrapedContent;
  onEdit?: (content: ScrapedContent) => void;
  onNext?: () => void;
  onRegenerate?: () => void;
}

const ScrapedContentViewer: React.FC<ScrapedContentViewerProps> = ({
  scrapedContent,
  onEdit,
  onNext,
  onRegenerate,
}) => {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showGlobal, setShowGlobal] = useState(true);
  const [viewMode, setViewMode] = useState<'structured' | 'json' | 'markdown'>('structured');
  const [editingContent, setEditingContent] = useState<ScrapedContent>(scrapedContent);

  const togglePage = (pageKey: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageKey)) {
      newExpanded.delete(pageKey);
    } else {
      newExpanded.add(pageKey);
    }
    setExpandedPages(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    const allPageKeys = editingContent.pages.map(p => getPageKey(p));
    setExpandedPages(new Set(allPageKeys));

    const allSectionIds: string[] = [];
    editingContent.pages.forEach(page => {
      page.sections.forEach((_, idx) => {
        allSectionIds.push(`${getPageKey(page)}-section-${idx}`);
      });
    });
    setExpandedSections(new Set(allSectionIds));
  };

  const collapseAll = () => {
    setExpandedPages(new Set());
    setExpandedSections(new Set());
  };

  const handleSectionContentEdit = (pageKey: string, sectionIdx: number, newContent: string) => {
    const updatedContent = { ...editingContent };
    const pageIndex = updatedContent.pages.findIndex(p => getPageKey(p) === pageKey);
    if (pageIndex !== -1) {
      const section = updatedContent.pages[pageIndex].sections[sectionIdx];
      // Update both 'content' and 'text' properties to maintain compatibility
      if ('content' in section) {
        section.content = newContent;
      }
      if ('text' in section) {
        section.text = newContent;
      }
      setEditingContent(updatedContent);
      if (onEdit) {
        onEdit(updatedContent);
      }
    }
  };

  const handleGlobalContentEdit = (field: 'header' | 'footer', newContent: string) => {
    const updatedContent = { ...editingContent };
    updatedContent.global_content[field] = newContent;
    setEditingContent(updatedContent);
    if (onEdit) {
      onEdit(updatedContent);
    }
  };

  // Helper to get global content text (handles both string and object formats)
  const getGlobalContentText = (content: any): string => {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object' && content.text) return content.text;
    return '';
  };

  // Helper to get section content (handles both 'content' and 'text' properties)
  const getSectionContent = (section: any): string => {
    return section.content || section.text || '';
  };

  // Helper to get page key (handles both 'page_key' and 'slug' properties)
  const getPageKey = (page: any): string => {
    return page.page_key || page.slug || page.url;
  };

  return (
    <div className="scraped-content-viewer">
      <div className="scraped-content-viewer__header">
        <div className="header-title">
          <h2>🌐 Scraped Content from {editingContent.domain}</h2>
          <p className="scraped-date">
            Scraped on {new Date(editingContent.metadata.scraped_at).toLocaleString()}
          </p>
        </div>
        <div className="header-actions">
          <button
            className={`btn ${viewMode === 'structured' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('structured')}
          >
            📋 Structured
          </button>
          <button
            className={`btn ${viewMode === 'markdown' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('markdown')}
            disabled={!editingContent.raw_markdown}
            title={!editingContent.raw_markdown ? 'Markdown not available' : 'View original markdown'}
          >
            📝 Markdown
          </button>
          <button
            className={`btn ${viewMode === 'json' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('json')}
          >
            {} JSON
          </button>
          {viewMode === 'structured' && (
            <>
              <button className="btn btn--secondary" onClick={expandAll}>
                📖 Expand All
              </button>
              <button className="btn btn--secondary" onClick={collapseAll}>
                📕 Collapse All
              </button>
            </>
          )}
          {onRegenerate && (
            <button className="btn btn--warning" onClick={onRegenerate}>
              🔄 Re-scrape
            </button>
          )}
        </div>
      </div>

      {viewMode === 'structured' && (
        <div className="scraped-content-viewer__stats">
          <div className="stat-card">
            <div className="stat-value">{editingContent.metadata.total_pages}</div>
            <div className="stat-label">Pages</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{editingContent.metadata.total_sections}</div>
            <div className="stat-label">Sections</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{editingContent.metadata.total_images}</div>
            <div className="stat-label">Images</div>
          </div>
        </div>
      )}

      {viewMode === 'markdown' ? (
        <div className="scraped-content-viewer__markdown">
          {editingContent.raw_markdown ? (
            <>
              <div className="markdown-section">
                <h3>Global Content</h3>
                <textarea
                  className="markdown-editor"
                  value={editingContent.raw_markdown.global}
                  readOnly
                  rows={10}
                  spellCheck={false}
                />
              </div>
              <div className="markdown-section">
                <h3>Pages</h3>
                {Object.entries(editingContent.raw_markdown.pages).map(([pageKey, markdown]) => (
                  <div key={pageKey} className="page-markdown">
                    <h4>{pageKey}</h4>
                    <textarea
                      className="markdown-editor"
                      value={markdown}
                      readOnly
                      rows={15}
                      spellCheck={false}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-markdown">
              <p>⚠️ Markdown content not available. This may be from an older scrape.</p>
            </div>
          )}
        </div>
      ) : viewMode === 'json' ? (
        <div className="scraped-content-viewer__json">
          <textarea
            className="json-editor"
            value={JSON.stringify(editingContent, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setEditingContent(parsed);
                if (onEdit) {
                  onEdit(parsed);
                }
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            spellCheck={false}
          />
        </div>
      ) : (
        <>
          {/* Global Content Section */}
          <div className="scraped-content-viewer__global">
        <div className="global-header" onClick={() => setShowGlobal(!showGlobal)}>
          <h3>
            {showGlobal ? '▼' : '▶'} Global Content (Header & Footer)
          </h3>
        </div>
        {showGlobal && (
          <div className="global-content">
            <div className="global-section">
              <h4>Header</h4>
              <textarea
                className="content-edit"
                value={getGlobalContentText(editingContent.global_content.header)}
                onChange={(e) => handleGlobalContentEdit('header', e.target.value)}
                rows={5}
              />
            </div>
            <div className="global-section">
              <h4>Footer</h4>
              <textarea
                className="content-edit"
                value={getGlobalContentText(editingContent.global_content.footer)}
                onChange={(e) => handleGlobalContentEdit('footer', e.target.value)}
                rows={5}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pages Section */}
      <div className="scraped-content-viewer__pages">
        <h3>Pages</h3>
        {editingContent.pages.map((page) => {
          const pageKey = getPageKey(page);
          const isExpanded = expandedPages.has(pageKey);
          return (
            <div key={pageKey} className="page-card">
              <div className="page-header" onClick={() => togglePage(pageKey)}>
                <div className="page-title">
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <h4>{page.title}</h4>
                  <span className="page-url">{page.url}</span>
                </div>
                <div className="page-stats">
                  <span className="badge">{page.sections.length} sections</span>
                  <span className="badge">{page.images?.length || 0} images</span>
                </div>
              </div>

              {isExpanded && (
                <div className="page-content">
                  {page.sections.length === 0 ? (
                    <p className="no-content">No sections found on this page</p>
                  ) : (
                    page.sections.map((section, idx) => {
                      const sectionId = `${pageKey}-section-${idx}`;
                      const isSectionExpanded = expandedSections.has(sectionId);
                      return (
                        <div key={sectionId} className="section-card">
                          <div
                            className="section-header"
                            onClick={() => toggleSection(sectionId)}
                          >
                            <span className="expand-icon">
                              {isSectionExpanded ? '▼' : '▶'}
                            </span>
                            <span className="section-type">{section.type}</span>
                            <span className="section-preview">
                              {getSectionContent(section).substring(0, 80)}
                              {getSectionContent(section).length > 80 ? '...' : ''}
                            </span>
                          </div>

                          {isSectionExpanded && (
                            <div className="section-content">
                              <textarea
                                className="content-edit"
                                value={getSectionContent(section)}
                                onChange={(e) =>
                                  handleSectionContentEdit(
                                    pageKey,
                                    idx,
                                    e.target.value
                                  )
                                }
                                rows={8}
                              />
                              {section.images?.length > 0 && (
                                <div className="section-images">
                                  <h5>Images ({section.images.length})</h5>
                                  <div className="image-grid">
                                    {section.images.map((img, imgIdx) => (
                                      <div key={imgIdx} className="image-item">
                                        <img
                                          src={img.url}
                                          alt={img.alt || `Image ${imgIdx + 1}`}
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                        <p className="image-url">{img.url}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Next Steps */}
      {onNext && (
        <div className="scraped-content-viewer__actions">
          <button className="btn btn--primary btn--large" onClick={onNext}>
            ✅ Continue to Mapping
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrapedContentViewer;
