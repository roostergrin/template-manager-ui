import React, { useState } from 'react';
import './EnhancedPreviewSection.sass';

interface EnhancedPreviewSectionProps {
  pagesContent: Record<string, any>;
  globalContent: any;
  useNewFormat: boolean;
  apiUrl: string;
  sitemapData?: any;
  onContentUpdate?: (updatedContent: Record<string, any>) => void;
}

const EnhancedPreviewSection: React.FC<EnhancedPreviewSectionProps> = ({
  pagesContent,
  globalContent,
  useNewFormat,
  apiUrl,
  sitemapData,
  onContentUpdate
}) => {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Extract page ID mapping from sitemap data
  const pageIdMapping = React.useMemo(() => {
    const mapping: Record<string, string | number> = {};
    if (sitemapData?.pages) {
      if (Array.isArray(sitemapData.pages)) {
        // Handle array format
        sitemapData.pages.forEach((page: any) => {
          if (page.title && (page.page_id || page.wordpress_id)) {
            mapping[page.title] = page.page_id || page.wordpress_id;
          }
        });
      } else if (typeof sitemapData.pages === 'object') {
        // Handle object format
        for (const [pageName, pageInfo] of Object.entries(sitemapData.pages)) {
          if (typeof pageInfo === 'object' && pageInfo !== null) {
            const info = pageInfo as any;
            if (info.page_id || info.wordpress_id) {
              mapping[pageName] = info.page_id || info.wordpress_id;
            }
          }
        }
      }
    }
    return mapping;
  }, [sitemapData]);

  const togglePageExpansion = (pageName: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageName)) {
      newExpanded.delete(pageName);
    } else {
      newExpanded.add(pageName);
    }
    setExpandedPages(newExpanded);
  };

  const startEditing = (pageName: string, content: any) => {
    setEditingPage(pageName);
    setEditContent(JSON.stringify(content, null, 2));
  };

  const saveEdit = () => {
    if (!editingPage) return;
    
    try {
      const updatedContent = JSON.parse(editContent);
      const newPagesContent = {
        ...pagesContent,
        [editingPage]: updatedContent
      };
      
      if (onContentUpdate) {
        onContentUpdate(newPagesContent);
      }
      
      setEditingPage(null);
      setEditContent('');
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setEditContent('');
  };

  // Helper function to get component type counts
  const getComponentTypeCounts = (content: any) => {
    const contentArray = Array.isArray(content) ? content : [content];
    const typeCounts: Record<string, number> = {};
    
    contentArray.forEach((item: any) => {
      if (item?.acf_fc_layout) {
        typeCounts[item.acf_fc_layout] = (typeCounts[item.acf_fc_layout] || 0) + 1;
      }
    });
    
    return typeCounts;
  };

  // Helper function to separate SEO data from content sections
  const separateSeoAndSections = (content: any) => {
    if (!Array.isArray(content)) {
      return { seoData: null, sections: [content] };
    }

    let seoData = null;
    const sections = content.filter((item: any) => {
      // Check if this item is SEO data (has seo property but no acf_fc_layout)
      if (item?.seo && !item?.acf_fc_layout) {
        seoData = item.seo;
        return false; // Remove from sections
      }
      // Keep items that have acf_fc_layout (actual content sections)
      return item?.acf_fc_layout;
    });

    return { seoData, sections };
  };

  return (
    <div className="enhanced-preview-section">
      <div className="preview-header">
        <h4>📋 WordPress Update Preview</h4>
        <div className="preview-controls">
          <button 
            className="expand-all-btn"
            onClick={() => setExpandedPages(new Set(Object.keys(pagesContent)))}
          >
            📖 Expand All
          </button>
          <button 
            className="collapse-all-btn"
            onClick={() => setExpandedPages(new Set())}
          >
            📑 Collapse All
          </button>
        </div>
      </div>

      <div className="preview-format">
        <strong>Format:</strong> {useNewFormat ? 'NEW (Page IDs + Sections)' : 'OLD (Page Names + Arrays)'}
      </div>

      <div className="pages-preview">
        {Object.entries(pagesContent).map(([pageName, content]) => {
          const pageKey = pageIdMapping[pageName]?.toString() || pageName;
          const { seoData, sections } = separateSeoAndSections(content);
          const isExpanded = expandedPages.has(pageName);
          const isEditing = editingPage === pageName;
          const componentCounts = getComponentTypeCounts(sections);

          return (
            <div key={pageName} className="page-preview-card">
              <div className="page-card-header">
                <div className="page-info">
                  <span className="page-name">{pageName}</span>
                  <span className="page-id">→ ID: {pageKey}</span>
                  <span className="section-count">{sections.length} sections</span>
                  {Object.keys(componentCounts).length > 0 && (
                    <div className="component-types">
                      {Object.entries(componentCounts).map(([type, count]) => (
                        <span key={type} className="component-type-badge">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="page-actions">
                  <button
                    className="expand-btn"
                    onClick={() => togglePageExpansion(pageName)}
                  >
                    {isExpanded ? '🔼 Collapse' : '🔽 Expand'}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => startEditing(pageName, content)}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>

              {isExpanded && !isEditing && (
                <div className="page-content-preview">
                  <div className="content-tabs">
                    <div className="tab-content">
                      <div className="content-structure">
                        <div className="structure-header">
                          <strong>Full Content Structure:</strong>
                          <div className="structure-stats">
                            <span>SEO: {seoData ? '✅' : '❌'}</span>
                            <span>Sections: {sections.length}</span>
                            <span>Size: {(JSON.stringify(content).length / 1024).toFixed(1)}KB</span>
                          </div>
                        </div>
                        
                        {/* Show SEO Data Separately */}
                        {seoData && (
                          <div className="seo-preview">
                            <strong>SEO Data (extracted from sections):</strong>
                            <pre className="seo-json-preview">
                              {JSON.stringify(seoData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {/* Show Content Sections */}
                        <div className="sections-preview">
                          <strong>Content Sections ({sections.length} items):</strong>
                          <pre className="json-preview">
                            {JSON.stringify(sections, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* API Request Preview */}
                      <div className="api-request-preview">
                        <strong>WordPress API Request Preview:</strong>
                        <code className="api-code">
                          {`POST ${apiUrl}wp-json/wp/v2/pages/${pageKey}
{
  "acf": {
    "seo": {
      "page_title": "${seoData?.page_title || '...'}",
      "page_description": "${seoData?.page_description || '...'}",
      "page_keywords": "${seoData?.page_keywords || '...'}",
      "social_meta": {
        "og_meta": {
          "title": "${seoData?.social_meta?.og_meta?.title || '...'}",
          "description": "${seoData?.social_meta?.og_meta?.description || '...'}",
          "image": "${seoData?.social_meta?.og_meta?.image || '...'}"
        }
      }
    },
    "sections": [${sections.length} components]
  }
}`}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="page-edit-section">
                  <div className="edit-header">
                    <strong>Editing: {pageName}</strong>
                    <div className="edit-actions">
                      <button className="save-btn" onClick={saveEdit}>
                        💾 Save Changes
                      </button>
                      <button className="cancel-btn" onClick={cancelEdit}>
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                  <div className="edit-content">
                    <textarea
                      className="edit-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={30}
                      placeholder="Edit page content as JSON..."
                    />
                    <div className="edit-sidebar">
                      <div className="edit-help">
                        <h6>📝 Editing Tips:</h6>
                        <ul>
                          <li>Maintain valid JSON format</li>
                          <li>SEO data should be in a separate object with just "seo" property</li>
                          <li>Content sections should have 'acf_fc_layout' field</li>
                          <li>SEO object will be automatically extracted from sections</li>
                          <li>Use Ctrl+Z to undo changes</li>
                        </ul>
                      </div>
                      <div className="json-validator">
                        <h6>🔍 JSON Status:</h6>
                        {(() => {
                          try {
                            JSON.parse(editContent);
                            return <span className="valid">✅ Valid JSON</span>;
                          } catch (error) {
                            return <span className="invalid">❌ Invalid JSON</span>;
                          }
                        })()}
                      </div>
                      {(() => {
                        try {
                          const parsed = JSON.parse(editContent);
                          const { seoData: previewSeo, sections: previewSections } = separateSeoAndSections(parsed);
                          return (
                            <div className="content-analyzer">
                              <h6>📊 Content Analysis:</h6>
                              <div className="analysis-item">
                                <span>SEO Data: {previewSeo ? '✅ Found' : '❌ Missing'}</span>
                              </div>
                              <div className="analysis-item">
                                <span>Sections: {previewSections.length}</span>
                              </div>
                            </div>
                          );
                        } catch (error) {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Content Preview */}
      {globalContent && (
        <div className="global-content-preview">
          <h5>🌐 Global Content</h5>
          <details className="global-details">
            <summary>
              View Global Content Structure 
              <span className="global-size">
                ({(JSON.stringify(globalContent).length / 1024).toFixed(1)}KB)
              </span>
            </summary>
            <pre className="json-preview">
              {JSON.stringify(globalContent, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Summary Stats */}
      <div className="preview-summary">
        <h5>📊 Content Summary</h5>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Pages:</span>
            <span className="stat-value">{Object.keys(pagesContent).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Sections:</span>
            <span className="stat-value">
              {Object.values(pagesContent).reduce((total, content) => {
                const { sections } = separateSeoAndSections(content);
                return total + sections.length;
              }, 0)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pages with SEO:</span>
            <span className="stat-value">
              {Object.values(pagesContent).filter(content => {
                const { seoData } = separateSeoAndSections(content);
                return !!seoData;
              }).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">
              {(JSON.stringify(pagesContent).length / 1024).toFixed(1)}KB
            </span>
          </div>
          {globalContent && (
            <div className="stat-item">
              <span className="stat-label">Global Size:</span>
              <span className="stat-value">
                {(JSON.stringify(globalContent).length / 1024).toFixed(1)}KB
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPreviewSection; 