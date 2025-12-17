import React, { useState, useMemo } from 'react';
import { Globe, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Copy, Check, ChevronsDown, ChevronsUp, Clock, ExternalLink, Image, Palette, Paintbrush } from 'lucide-react';
import StyleOverview from '../StyleOverview/StyleOverview';
import DesignSystemViewer, { DesignSystem } from '../DesignSystemViewer';
import './ScrapedContentViewer.sass';

export interface ScrapedContent {
  success: boolean;
  domain: string;
  global_markdown: string;
  pages: {
    [key: string]: string;
  };
  metadata: {
    scraped_at: string;
    total_pages: number;
    use_selenium: boolean;
    scroll: boolean;
  };
  style_overview?: string;
  design_system?: DesignSystem;
}

interface ScrapedContentViewerProps {
  scrapedContent: ScrapedContent;
  onNext?: () => void;
}

interface PageNode {
  url: string;
  fullUrl: string;
  markdown: string;
  children: PageNode[];
  depth: number;
}

const ScrapedContentViewer: React.FC<ScrapedContentViewerProps> = ({
  scrapedContent,
  onNext,
}) => {
  const [expandedMarkdownPages, setExpandedMarkdownPages] = useState<Set<string>>(new Set());
  const [expandedParentPages, setExpandedParentPages] = useState<Set<string>>(new Set());
  const [showGlobalMarkdown, setShowGlobalMarkdown] = useState(false);
  const [showStyleOverview, setShowStyleOverview] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showPagesSection, setShowPagesSection] = useState(false);
  const [copiedPage, setCopiedPage] = useState<string | null>(null);

  const buildPageTree = useMemo(() => {
    const pages = Object.entries(scrapedContent.pages);
    const tree: PageNode[] = [];
    const pageMap = new Map<string, PageNode>();

    // Create all nodes
    pages.forEach(([url, markdown]) => {
      // Convert __ to / in the URL path
      const pathWithSlashes = url.replace(/__/g, '/');

      // Ensure URL starts with /
      const normalizedUrl = pathWithSlashes.startsWith('/') ? pathWithSlashes : `/${pathWithSlashes}`;

      const fullUrl = url.startsWith('http')
        ? url.replace(/__/g, '/')
        : `https://${scrapedContent.domain}${normalizedUrl}`;

      const node: PageNode = {
        url: normalizedUrl,
        fullUrl,
        markdown,
        children: [],
        depth: 0,
      };
      pageMap.set(normalizedUrl, node);
    });

    // Build hierarchy - only nest if it's a proper path hierarchy
    pages.forEach(([url]) => {
      const pathWithSlashes = url.replace(/__/g, '/');
      const normalizedUrl = pathWithSlashes.startsWith('/') ? pathWithSlashes : `/${pathWithSlashes}`;
      const node = pageMap.get(normalizedUrl)!;
      let parentFound = false;

      // Check if this URL is a child of any other URL
      pages.forEach(([potentialParentUrl]) => {
        const parentPathWithSlashes = potentialParentUrl.replace(/__/g, '/');
        const normalizedParentUrl = parentPathWithSlashes.startsWith('/') ? parentPathWithSlashes : `/${parentPathWithSlashes}`;

        if (normalizedUrl !== normalizedParentUrl && normalizedUrl.startsWith(normalizedParentUrl + '/')) {
          const parentNode = pageMap.get(normalizedParentUrl);
          if (parentNode) {
            // Make sure it's a direct child (not a grandchild)
            const relativePath = normalizedUrl.slice(normalizedParentUrl.length + 1);
            const segments = relativePath.split('/').filter(s => s.length > 0);

            if (segments.length === 1) {
              parentNode.children.push(node);
              node.depth = parentNode.depth + 1;
              parentFound = true;
            }
          }
        }
      });

      if (!parentFound) {
        tree.push(node);
      }
    });

    // Sort children
    const sortNodes = (nodes: PageNode[]) => {
      nodes.sort((a, b) => a.url.localeCompare(b.url));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(tree);

    return tree;
  }, [scrapedContent.pages, scrapedContent.domain]);

  const toggleMarkdownPage = (pageKey: string) => {
    const newExpanded = new Set(expandedMarkdownPages);
    if (newExpanded.has(pageKey)) {
      newExpanded.delete(pageKey);
    } else {
      newExpanded.add(pageKey);
    }
    setExpandedMarkdownPages(newExpanded);
  };

  const toggleParentPage = (pageKey: string) => {
    const newExpanded = new Set(expandedParentPages);
    if (newExpanded.has(pageKey)) {
      newExpanded.delete(pageKey);
    } else {
      newExpanded.add(pageKey);
    }
    setExpandedParentPages(newExpanded);
  };

  const getAllPageUrls = (nodes: PageNode[]): string[] => {
    const urls: string[] = [];
    const traverse = (node: PageNode) => {
      urls.push(node.url);
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return urls;
  };

  const handleExpandAll = () => {
    setShowGlobalMarkdown(true);
    setShowStyleOverview(true);
    setShowDesignSystem(true);
    setShowPagesSection(true);
    const allUrls = getAllPageUrls(buildPageTree);
    setExpandedMarkdownPages(new Set(allUrls));
    setExpandedParentPages(new Set(allUrls));
  };

  const handleCollapseAll = () => {
    setShowGlobalMarkdown(false);
    setShowStyleOverview(false);
    setShowDesignSystem(false);
    setShowPagesSection(false);
    setExpandedMarkdownPages(new Set());
    setExpandedParentPages(new Set());
  };

  const handleCopyMarkdown = (pageKey: string, markdown: string) => {
    navigator.clipboard.writeText(markdown);
    setCopiedPage(pageKey);
    setTimeout(() => setCopiedPage(null), 2000);
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const countImages = (markdown: string): number => {
    // Count markdown image syntax: ![alt](url)
    const imageMatches = markdown.match(/!\[.*?\]\(.*?\)/g);
    return imageMatches ? imageMatches.length : 0;
  };

  const getTotalImages = useMemo(() => {
    let total = countImages(scrapedContent.global_markdown || '');
    Object.values(scrapedContent.pages).forEach(markdown => {
      total += countImages(markdown);
    });
    return total;
  }, [scrapedContent.global_markdown, scrapedContent.pages]);

  const handleVisitPage = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderPageNode = (node: PageNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isContentExpanded = expandedParentPages.has(node.url);

    return (
      <div key={node.url} className="tree-subitem">
        <div className="tree-subitem__header">
          <div
            className="tree-subitem__header-main"
            onClick={() => toggleParentPage(node.url)}
          >
            {isContentExpanded ? (
              <ChevronDown size={14} className="tree-subitem__chevron" />
            ) : (
              <ChevronRight size={14} className="tree-subitem__chevron" />
            )}
            <Globe size={14} className="tree-subitem__icon" />
            <span className="tree-subitem__title">{node.url}</span>
            <span className="tree-subitem__meta">
              <span className="meta-words">{countWords(node.markdown)} words</span>
              <span className="meta-images">{countImages(node.markdown)} images</span>
            </span>
          </div>
          <button
            className="btn btn--visit"
            onClick={(e) => handleVisitPage(node.fullUrl, e)}
            title="Visit page"
          >
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Show markdown content when expanded */}
        {isContentExpanded && (
          <div className="tree-subitem__content">
            <div className="markdown-display">
              <div className="markdown-display__header">
                <div className="markdown-display__url-section">
                  <Globe size={16} />
                  <span className="markdown-display__url">{node.url}</span>
                </div>
                <button
                  className="btn btn--copy"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyMarkdown(node.url, node.markdown);
                  }}
                >
                  {copiedPage === node.url ? <Check size={16} /> : <Copy size={16} />}
                  {copiedPage === node.url ? 'Copied!' : 'Copy as Markdown'}
                </button>
              </div>
              <pre className="markdown-display__content">
                {node.markdown}
              </pre>
            </div>
          </div>
        )}

        {/* Always show children (nested structure) */}
        {hasChildren && (
          <div className="tree-subitem__children">
            {node.children.map((child) => renderPageNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scraped-content-viewer">
      {scrapedContent.global_markdown && scrapedContent.pages ? (
        <div className="scraped-content-viewer__tree">
          {/* Root Domain Section */}
          <div className="tree-section tree-section--root">
            <div className="tree-section__header">
              <Globe size={20} className="tree-section__icon tree-section__icon--globe" />
              <h3 className="tree-section__title">{scrapedContent.domain}</h3>
              <button
                className="btn btn--expand-toggle"
                onClick={expandedMarkdownPages.size === 0 && !showGlobalMarkdown && !showStyleOverview && !showDesignSystem && !showPagesSection ? handleExpandAll : handleCollapseAll}
              >
                {expandedMarkdownPages.size === 0 && !showGlobalMarkdown && !showStyleOverview && !showDesignSystem && !showPagesSection ? (
                  <>
                    <ChevronsDown size={16} />
                    <span>Expand All</span>
                  </>
                ) : (
                  <>
                    <ChevronsUp size={16} />
                    <span>Collapse All</span>
                  </>
                )}
              </button>
            </div>

            <div className="tree-section__meta">
              <span className="meta-item">
                <span className="meta-label">#</span> {countWords(scrapedContent.global_markdown) + Object.values(scrapedContent.pages).reduce((sum, md) => sum + countWords(md), 0)} words
              </span>
              <span className="meta-item">
                <Globe size={14} /> {scrapedContent.metadata.total_pages} pages
              </span>
              <span className="meta-item">
                <Image size={14} /> {getTotalImages} images
              </span>
              <span className="meta-item">
                <Clock size={14} /> {new Date(scrapedContent.metadata.scraped_at).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Global Content Section */}
            <div className="tree-item tree-item--global">
              <div
                className="tree-item__header"
                onClick={() => setShowGlobalMarkdown(!showGlobalMarkdown)}
              >
                {showGlobalMarkdown ? (
                  <ChevronDown size={16} className="tree-item__chevron" />
                ) : (
                  <ChevronRight size={16} className="tree-item__chevron" />
                )}
                <Globe size={16} className="tree-item__icon" />
                <span className="tree-item__title">Global Content</span>
                <span className="tree-item__meta">
                  <span className="meta-words">{countWords(scrapedContent.global_markdown)} words</span>
                  <span className="meta-images">{countImages(scrapedContent.global_markdown)} images</span>
                </span>
              </div>
              {showGlobalMarkdown && (
                <div className="tree-item__content">
                  <div className="markdown-display">
                    <div className="markdown-display__header">
                      <div className="markdown-display__url-section">
                        <Globe size={16} />
                        <span className="markdown-display__url">Global Content</span>
                      </div>
                      <button
                        className="btn btn--copy"
                        onClick={() => handleCopyMarkdown('global', scrapedContent.global_markdown)}
                      >
                        {copiedPage === 'global' ? <Check size={16} /> : <Copy size={16} />}
                        {copiedPage === 'global' ? 'Copied!' : 'Copy as Markdown'}
                      </button>
                    </div>
                    <pre className="markdown-display__content">
                      {scrapedContent.global_markdown}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Design System Section (Structured) */}
            {scrapedContent.design_system && (
              <div className="tree-item tree-item--design-system">
                <div
                  className="tree-item__header"
                  onClick={() => setShowDesignSystem(!showDesignSystem)}
                >
                  {showDesignSystem ? (
                    <ChevronDown size={16} className="tree-item__chevron" />
                  ) : (
                    <ChevronRight size={16} className="tree-item__chevron" />
                  )}
                  <Paintbrush size={16} className="tree-item__icon" />
                  <span className="tree-item__title">Design System</span>
                  <span className="tree-item__badge tree-item__badge--new">AI</span>
                </div>
                {showDesignSystem && (
                  <div className="tree-item__content">
                    <DesignSystemViewer designSystem={scrapedContent.design_system} />
                  </div>
                )}
              </div>
            )}

            {/* Style Overview Section (Raw/Legacy) */}
            {scrapedContent.style_overview && !scrapedContent.design_system && (
              <div className="tree-item tree-item--style-overview">
                <div
                  className="tree-item__header"
                  onClick={() => setShowStyleOverview(!showStyleOverview)}
                >
                  {showStyleOverview ? (
                    <ChevronDown size={16} className="tree-item__chevron" />
                  ) : (
                    <ChevronRight size={16} className="tree-item__chevron" />
                  )}
                  <Palette size={16} className="tree-item__icon" />
                  <span className="tree-item__title">Style & Color Scheme</span>
                </div>
                {showStyleOverview && (
                  <div className="tree-item__content">
                    <StyleOverview styleOverview={scrapedContent.style_overview} />
                  </div>
                )}
              </div>
            )}

            {/* Pages Section */}
            <div className="tree-item tree-item--pages">
              <div
                className="tree-item__header"
                onClick={() => setShowPagesSection(!showPagesSection)}
              >
                {showPagesSection ? (
                  <ChevronDown size={16} className="tree-item__chevron" />
                ) : (
                  <ChevronRight size={16} className="tree-item__chevron" />
                )}
                <Globe size={16} className="tree-item__icon" />
                <span className="tree-item__title">Pages</span>
                <span className="tree-item__meta">
                  <span className="meta-count">{scrapedContent.metadata.total_pages} pages</span>
                  <span className="meta-words">{Object.values(scrapedContent.pages).reduce((sum, md) => sum + countWords(md), 0)} words</span>
                </span>
              </div>
              {showPagesSection && (
                <div className="tree-item__content">
                  {buildPageTree.map((node) => renderPageNode(node))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-markdown">
          <AlertCircle size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          <p style={{ display: 'inline' }}>Markdown content not available. This may be from an older scrape.</p>
        </div>
      )}

    </div>
  );
};

export default ScrapedContentViewer;
