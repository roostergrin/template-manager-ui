import React, { useState, useEffect } from 'react';
import './SitemapMapper.sass';
import { ScrapedContent } from '../ScrapedContentViewer';

interface SitemapPage {
  title: string;
  path: string;
  component: string;
  items?: string[];
}

interface PageMapping {
  sitemapPagePath: string;
  scrapedPageKey: string | null;
  confidence?: number;
}

interface SitemapMapperProps {
  scrapedContent: ScrapedContent;
  sitemapPages: SitemapPage[];
  onMappingComplete: (mappings: PageMapping[]) => void;
  onBack?: () => void;
}

const SitemapMapper: React.FC<SitemapMapperProps> = ({
  scrapedContent,
  sitemapPages,
  onMappingComplete,
  onBack,
}) => {
  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [selectedSitemapPage, setSelectedSitemapPage] = useState<string | null>(null);
  const [previewScrapedPage, setPreviewScrapedPage] = useState<string | null>(null);
  const [draggedScrapedPage, setDraggedScrapedPage] = useState<string | null>(null);

  // Initialize mappings with auto-suggestions
  useEffect(() => {
    const autoMappings = generateAutoMappings();
    setMappings(autoMappings);
  }, [scrapedContent, sitemapPages]);

  const generateAutoMappings = (): PageMapping[] => {
    const suggestions: PageMapping[] = [];

    sitemapPages.forEach((sitemapPage) => {
      let bestMatch: { pageKey: string; confidence: number } | null = null;
      let highestConfidence = 0;

      scrapedContent.pages.forEach((scrapedPage) => {
        const confidence = calculateMatchConfidence(sitemapPage, scrapedPage);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = { pageKey: scrapedPage.page_key, confidence };
        }
      });

      suggestions.push({
        sitemapPagePath: sitemapPage.path,
        scrapedPageKey: bestMatch && highestConfidence > 0.3 ? bestMatch.pageKey : null,
        confidence: highestConfidence,
      });
    });

    return suggestions;
  };

  const calculateMatchConfidence = (
    sitemapPage: SitemapPage,
    scrapedPage: { page_key: string; title: string; url: string }
  ): number => {
    let confidence = 0;

    // Match by path similarity
    const sitemapPath = sitemapPage.path.toLowerCase();
    const scrapedUrl = scrapedPage.url.toLowerCase();
    const scrapedPageKey = scrapedPage.page_key.toLowerCase();

    if (scrapedUrl.includes(sitemapPath) || sitemapPath.includes(scrapedPageKey)) {
      confidence += 0.5;
    }

    // Match by title similarity
    const sitemapTitle = sitemapPage.title.toLowerCase();
    const scrapedTitle = scrapedPage.title.toLowerCase();

    if (sitemapTitle === scrapedTitle) {
      confidence += 0.5;
    } else if (sitemapTitle.includes(scrapedTitle) || scrapedTitle.includes(sitemapTitle)) {
      confidence += 0.3;
    }

    // Common page type matches
    const commonPages: { [key: string]: string[] } = {
      '/': ['home', 'index', 'main'],
      '/about': ['about', 'about-us'],
      '/contact': ['contact', 'contact-us'],
      '/services': ['services', 'what-we-do'],
      '/blog': ['blog', 'news', 'articles'],
    };

    Object.entries(commonPages).forEach(([path, keywords]) => {
      if (sitemapPath.includes(path)) {
        keywords.forEach((keyword) => {
          if (scrapedPageKey.includes(keyword) || scrapedUrl.includes(keyword)) {
            confidence += 0.2;
          }
        });
      }
    });

    return Math.min(confidence, 1.0);
  };

  const handleDragStart = (scrapedPageKey: string) => {
    setDraggedScrapedPage(scrapedPageKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (sitemapPagePath: string) => {
    if (!draggedScrapedPage) return;

    const updatedMappings = mappings.map((mapping) =>
      mapping.sitemapPagePath === sitemapPagePath
        ? { ...mapping, scrapedPageKey: draggedScrapedPage, confidence: 1.0 }
        : mapping
    );

    setMappings(updatedMappings);
    setDraggedScrapedPage(null);
  };

  const handleManualSelect = (sitemapPagePath: string, scrapedPageKey: string | null) => {
    const updatedMappings = mappings.map((mapping) =>
      mapping.sitemapPagePath === sitemapPagePath
        ? { ...mapping, scrapedPageKey, confidence: scrapedPageKey ? 1.0 : 0 }
        : mapping
    );
    setMappings(updatedMappings);
  };

  const handleClearMapping = (sitemapPagePath: string) => {
    handleManualSelect(sitemapPagePath, null);
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return '#999';
    if (confidence >= 0.7) return '#28a745';
    if (confidence >= 0.4) return '#ffc107';
    return '#dc3545';
  };

  const getConfidenceLabel = (confidence?: number): string => {
    if (!confidence) return 'No match';
    if (confidence >= 0.7) return 'High confidence';
    if (confidence >= 0.4) return 'Medium confidence';
    return 'Low confidence';
  };

  const getMappedCount = () => mappings.filter((m) => m.scrapedPageKey !== null).length;
  const getUnmappedCount = () => mappings.filter((m) => m.scrapedPageKey === null).length;

  const getMappedScrapedPageKeys = () => {
    return new Set(mappings.filter((m) => m.scrapedPageKey).map((m) => m.scrapedPageKey));
  };

  const getScrapedPage = (pageKey: string) => {
    return scrapedContent.pages.find((p) => p.page_key === pageKey);
  };

  const getSitemapPage = (path: string) => {
    return sitemapPages.find((p) => p.path === path);
  };

  const handleComplete = () => {
    onMappingComplete(mappings);
  };

  return (
    <div className="sitemap-mapper">
      <div className="sitemap-mapper__header">
        <div className="header-title">
          <h2>🗺️ Map Scraped Content to Sitemap</h2>
          <p>Drag and drop or manually select scraped pages to match your sitemap structure</p>
        </div>
        {onBack && (
          <button className="btn btn--secondary" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>

      <div className="sitemap-mapper__stats">
        <div className="stat-item">
          <span className="stat-label">Total Sitemap Pages:</span>
          <span className="stat-value">{sitemapPages.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mapped:</span>
          <span className="stat-value success">{getMappedCount()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Unmapped:</span>
          <span className="stat-value warning">{getUnmappedCount()}</span>
        </div>
      </div>

      <div className="sitemap-mapper__content">
        {/* Left Column: Scraped Pages */}
        <div className="scraped-pages-column">
          <h3>📄 Scraped Pages</h3>
          <p className="column-hint">Drag pages from here to map them</p>
          <div className="scraped-pages-list">
            {scrapedContent.pages.map((page) => {
              const isMapped = getMappedScrapedPageKeys().has(page.page_key);
              return (
                <div
                  key={page.page_key}
                  className={`scraped-page-item ${isMapped ? 'mapped' : ''} ${
                    previewScrapedPage === page.page_key ? 'preview' : ''
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(page.page_key)}
                  onMouseEnter={() => setPreviewScrapedPage(page.page_key)}
                  onMouseLeave={() => setPreviewScrapedPage(null)}
                >
                  <div className="item-header">
                    <span className="drag-handle">⋮⋮</span>
                    <div className="item-info">
                      <div className="item-title">{page.title}</div>
                      <div className="item-meta">{page.page_key}</div>
                    </div>
                    {isMapped && <span className="mapped-badge">✓ Mapped</span>}
                  </div>
                  <div className="item-stats">
                    <span>{page.sections.length} sections</span>
                    <span>{page.images.length} images</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sitemap Pages */}
        <div className="sitemap-pages-column">
          <h3>🎯 Sitemap Pages</h3>
          <p className="column-hint">Drop scraped pages here to create mappings</p>
          <div className="sitemap-pages-list">
            {sitemapPages.map((sitemapPage) => {
              const mapping = mappings.find((m) => m.sitemapPagePath === sitemapPage.path);
              const scrapedPage = mapping?.scrapedPageKey
                ? getScrapedPage(mapping.scrapedPageKey)
                : null;
              const isSelected = selectedSitemapPage === sitemapPage.path;

              return (
                <div
                  key={sitemapPage.path}
                  className={`sitemap-page-item ${isSelected ? 'selected' : ''} ${
                    mapping?.scrapedPageKey ? 'has-mapping' : 'no-mapping'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(sitemapPage.path)}
                  onClick={() => setSelectedSitemapPage(sitemapPage.path)}
                >
                  <div className="item-header">
                    <div className="item-info">
                      <div className="item-title">{sitemapPage.title}</div>
                      <div className="item-meta">{sitemapPage.path}</div>
                      <div className="item-component">{sitemapPage.component}</div>
                    </div>
                  </div>

                  {mapping?.scrapedPageKey && scrapedPage ? (
                    <div className="mapping-info">
                      <div className="mapped-to">
                        <span className="label">Mapped to:</span>
                        <span className="value">{scrapedPage.title}</span>
                      </div>
                      <div className="confidence-badge">
                        <span
                          className="confidence-indicator"
                          style={{ backgroundColor: getConfidenceColor(mapping.confidence) }}
                        ></span>
                        <span className="confidence-label">
                          {getConfidenceLabel(mapping.confidence)}
                        </span>
                      </div>
                      <button
                        className="btn btn--small btn--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearMapping(sitemapPage.path);
                        }}
                      >
                        ✕ Clear
                      </button>
                    </div>
                  ) : (
                    <div className="no-mapping-info">
                      <p>No mapping selected</p>
                      <select
                        className="mapping-select"
                        value=""
                        onChange={(e) => handleManualSelect(sitemapPage.path, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Select a page...</option>
                        {scrapedContent.pages.map((page) => (
                          <option key={page.page_key} value={page.page_key}>
                            {page.title} ({page.page_key})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {previewScrapedPage && (
        <div className="sitemap-mapper__preview">
          <h4>Preview</h4>
          {(() => {
            const page = getScrapedPage(previewScrapedPage);
            if (!page) return null;
            return (
              <div className="preview-content">
                <h5>{page.title}</h5>
                <p className="preview-url">{page.url}</p>
                <div className="preview-stats">
                  <span>{page.sections.length} sections</span>
                  <span>{page.images.length} images</span>
                  <span>{page.metadata.content_length} chars</span>
                </div>
                <div className="preview-sections">
                  {page.sections.slice(0, 3).map((section, idx) => (
                    <div key={idx} className="preview-section">
                      <span className="section-type">{section.type}</span>
                      <p>{section.content.substring(0, 150)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Unmapped Warning */}
      {getUnmappedCount() > 0 && (
        <div className="sitemap-mapper__warning">
          <span className="warning-icon">⚠️</span>
          <span>
            {getUnmappedCount()} sitemap page(s) are not mapped. They will use questionnaire data
            instead of scraped content.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="sitemap-mapper__actions">
        <button className="btn btn--primary btn--large" onClick={handleComplete}>
          ✅ Complete Mapping & Continue
        </button>
      </div>
    </div>
  );
};

export default SitemapMapper;
