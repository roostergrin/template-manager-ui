import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AllocatedSitemap } from '../../contexts/MigrationWizardProvider';
import './ContentAllocationViewer.sass';

interface ContentAllocationViewerProps {
  allocatedSitemap: AllocatedSitemap;
}

const ContentAllocationViewer: React.FC<ContentAllocationViewerProps> = ({ allocatedSitemap }) => {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const togglePage = (pageKey: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey);
      } else {
        newSet.add(pageKey);
      }
      return newSet;
    });
  };

  const countImages = (markdown?: string) => {
    if (!markdown) return 0;
    const imagePattern = /!\[.*?\]\(.*?\)/g;
    return (markdown.match(imagePattern) || []).length;
  };

  const countWords = (markdown?: string) => {
    if (!markdown) return 0;
    // Remove markdown image syntax
    let text = markdown.replace(/!\[.*?\]\(.*?\)/g, '');
    // Remove markdown links
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove markdown formatting
    text = text.replace(/[#*`_~]/g, '');
    // Count words (split by whitespace)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'gray';
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const pages = Object.entries(allocatedSitemap.pages || {});
  const unmappedScrapedPages = allocatedSitemap.allocation_summary?.unmapped_scraped_pages || [];
  const unmappedSitemapPages = allocatedSitemap.allocation_summary?.unmapped_sitemap_pages || [];

  // Debug logging
  console.log('🔍 ContentAllocationViewer - allocation_summary:', allocatedSitemap.allocation_summary);
  console.log('🔍 unmappedScrapedPages:', unmappedScrapedPages);
  console.log('🔍 unmappedSitemapPages:', unmappedSitemapPages);

  return (
    <div className="content-allocation-viewer">
      <div className="allocation-info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>How Allocated Content is Used:</strong>
          <p>
            The allocated markdown content below will be used as the <strong>primary context</strong> when generating
            content for each page. This means the AI will use the scraped content from your original site as
            reference, making the generated content match your site's structure and topics while adapting it
            to your practice's specific information.
          </p>
        </div>
      </div>

      <div className="allocation-summary">
        <h3>Content Allocation Summary</h3>
        {allocatedSitemap.allocation_summary && (
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Total Pages:</span>
              <span className="stat-value">{allocatedSitemap.allocation_summary.total_pages}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Allocated:</span>
              <span className="stat-value success">
                {allocatedSitemap.allocation_summary.allocated_pages}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Failed:</span>
              <span className="stat-value error">
                {allocatedSitemap.allocation_summary.failed_pages}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {(allocatedSitemap.allocation_summary.allocation_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Confidence:</span>
              <span className={`stat-value confidence-${getConfidenceColor(allocatedSitemap.allocation_summary.average_confidence)}`}>
                {(allocatedSitemap.allocation_summary.average_confidence * 100).toFixed(1)}% (
                {getConfidenceLabel(allocatedSitemap.allocation_summary.average_confidence)})
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Content:</span>
              <span className="stat-value">
                {allocatedSitemap.allocation_summary.total_content_length.toLocaleString()} chars
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Images:</span>
              <span className="stat-value">
                {allocatedSitemap.allocation_summary.total_images}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="pages-list">
        <h3>Pages with Allocated Content</h3>
        {pages.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>No pages found in allocated sitemap</p>
          </div>
        )}
        {pages.map(([pageKey, pageData]) => {
          const isExpanded = expandedPages.has(pageKey);
          const imageCount = countImages(pageData.allocated_markdown);
          const wordCount = countWords(pageData.allocated_markdown);
          const sections = pageData.model_query_pairs?.length || 0;
          const hasContent = !!pageData.allocated_markdown;
          const mappedScrapedPage = (pageData as any).mapped_scraped_page;

          return (
            <div key={pageKey} className={`page-item ${isExpanded ? 'expanded' : ''}`}>
              <div className="page-header" onClick={() => togglePage(pageKey)}>
                <div className="page-info">
                  <span className="expand-icon">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <span className="page-title">
                    📄 {pageData.title || pageKey}
                  </span>
                  {hasContent ? (
                    <span className={`confidence-badge confidence-${getConfidenceColor(pageData.allocation_confidence)}`}>
                      {((pageData.allocation_confidence || 0) * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="confidence-badge no-content">No Content</span>
                  )}
                </div>
                <div className="page-stats">
                  <span className="stat-badge">
                    <FileText size={14} />
                    {wordCount.toLocaleString()} words
                  </span>
                  <span className="stat-badge">
                    <ImageIcon size={14} />
                    {imageCount} images
                  </span>
                  <span className="stat-badge">
                    🔧 {sections} sections
                  </span>
                  {mappedScrapedPage && (
                    <span className="stat-badge mapped-from">
                      📌 from: {mappedScrapedPage}
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="page-content">
                  {pageData.source_location && (
                    <div className="content-source">
                      <strong>Source:</strong> {pageData.source_location}
                    </div>
                  )}

                  {pageData.allocated_markdown ? (
                    <div className="allocated-content">
                      <h4>📋 Allocated Content</h4>
                      <div className="markdown-preview">
                        <pre>{pageData.allocated_markdown}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="no-content-message">
                      <AlertCircle size={24} />
                      <p>No content was allocated to this page</p>
                    </div>
                  )}

                  {pageData.model_query_pairs && pageData.model_query_pairs.length > 0 && (
                    <div className="sections-list">
                      <h4>🔧 Sections to Generate ({pageData.model_query_pairs.length})</h4>
                      <ul>
                        {pageData.model_query_pairs.map((section: any, idx: number) => (
                          <li key={idx}>
                            <strong>{section.model}:</strong> {section.query}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="unmapped-section">
        <h3>⚠️ Unmapped Sitemap Pages</h3>
        <p className="unmapped-description">
          {unmappedSitemapPages.length > 0
            ? "These pages in your sitemap could not be matched to any scraped content:"
            : "All sitemap pages successfully matched to scraped content! ✅"
          }
        </p>
        {unmappedSitemapPages.length > 0 && (
          <div className="unmapped-list">
            {unmappedSitemapPages.map((pageKey) => (
              <div key={pageKey} className="unmapped-item warning">
                <AlertCircle size={16} />
                <span>{pageKey}</span>
                <span className="unmapped-note">No matching scraped content found</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="unmapped-section">
        <h3>📦 Unmapped Scraped Pages</h3>
        <p className="unmapped-description">
          {unmappedScrapedPages.length > 0
            ? "These pages were scraped but not matched to any sitemap page. This content is available if you want to add pages to your sitemap:"
            : "All scraped content has been allocated to sitemap pages! ✅"
          }
        </p>
        {unmappedScrapedPages.length > 0 && (
          <div className="unmapped-list">
            {unmappedScrapedPages.map((pageKey) => {
              // Try to find the scraped page data from the original scraped content
              // Note: We don't have access to the full scraped content here, so we just show the key
              return (
                <div key={pageKey} className="unmapped-item info">
                  <FileText size={16} />
                  <span>{pageKey}</span>
                  <span className="unmapped-note">Available content not used</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentAllocationViewer;
