import React, { useState } from 'react';
import ScrapeSiteForm, { ScrapeSiteFormData } from '../ScrapeSiteForm';
import ScrapedContentViewer, { ScrapedContent } from '../ScrapedContentViewer';
import SitemapMapper from '../SitemapMapper';
import ContextPreview from '../ContextPreview';
import api from '../../services/apiService';
import './ScrapingWorkflow.sass';

type WorkflowStep = 'scrape' | 'review' | 'map' | 'preview' | 'complete';

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

interface ScrapingWorkflowProps {
  onComplete?: (data: {
    scrapedContent: ScrapedContent;
    sitemap: { pages: SitemapPage[] };
    mappings: PageMapping[];
  }) => void;
  initialSitemap?: { pages: SitemapPage[] };
}

const ScrapingWorkflow: React.FC<ScrapingWorkflowProps> = ({ onComplete, initialSitemap }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('scrape');
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null);
  const [sitemap, setSitemap] = useState<{ pages: SitemapPage[] } | null>(initialSitemap || null);
  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreviewMapping, setSelectedPreviewMapping] = useState<{
    sitemapPage: SitemapPage;
    scrapedPageKey: string | null;
  } | null>(null);

  const handleScrapeSite = async (formData: ScrapeSiteFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<ScrapedContent>('/scrape-site/', {
        domain: formData.domain,
        use_selenium: formData.use_selenium,
        scroll: formData.scroll,
        max_pages: formData.max_pages,
      });

      setScrapedContent(response);
      setCurrentStep('review');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to scrape site');
    } finally {
      setLoading(false);
    }
  };

  const handleContentReviewed = () => {
    if (initialSitemap) {
      // If sitemap already provided, go to mapping
      setCurrentStep('map');
    } else {
      // Generate sitemap from scraped content
      generateSitemapFromScraped();
    }
  };

  const generateSitemapFromScraped = async () => {
    if (!scrapedContent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{
        success: boolean;
        sitemap_data: { pages: SitemapPage[] };
        message?: string;
      }>('/generate-sitemap-from-scraped/', {
        scraped_content: scrapedContent,
        site_type: 'stinson',
      });

      setSitemap(response.sitemap_data);
      setCurrentStep('map');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || 'Failed to generate sitemap from scraped content'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMappingComplete = (completedMappings: PageMapping[]) => {
    setMappings(completedMappings);
    setCurrentStep('preview');
  };

  const handlePreviewMapping = (sitemapPage: SitemapPage, scrapedPageKey: string | null) => {
    setSelectedPreviewMapping({ sitemapPage, scrapedPageKey });
  };

  const handleComplete = () => {
    if (scrapedContent && sitemap) {
      if (onComplete) {
        onComplete({
          scrapedContent,
          sitemap,
          mappings,
        });
      }
      setCurrentStep('complete');
    }
  };

  const handleReset = () => {
    setCurrentStep('scrape');
    setScrapedContent(null);
    setSitemap(null);
    setMappings([]);
    setError(null);
    setSelectedPreviewMapping(null);
  };

  const getStepNumber = (step: WorkflowStep): number => {
    const steps: WorkflowStep[] = ['scrape', 'review', 'map', 'preview', 'complete'];
    return steps.indexOf(step) + 1;
  };

  const isStepComplete = (step: WorkflowStep): boolean => {
    const currentStepNum = getStepNumber(currentStep);
    const stepNum = getStepNumber(step);
    return currentStepNum > stepNum;
  };

  return (
    <div className="scraping-workflow">
      {/* Progress Bar */}
      <div className="scraping-workflow__progress">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep === 'scrape' ? 'active' : ''} ${isStepComplete('scrape') ? 'complete' : ''}`}>
            <div className="step-circle">{isStepComplete('scrape') ? '✓' : '1'}</div>
            <div className="step-label">Scrape Site</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'review' ? 'active' : ''} ${isStepComplete('review') ? 'complete' : ''}`}>
            <div className="step-circle">{isStepComplete('review') ? '✓' : '2'}</div>
            <div className="step-label">Review Content</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'map' ? 'active' : ''} ${isStepComplete('map') ? 'complete' : ''}`}>
            <div className="step-circle">{isStepComplete('map') ? '✓' : '3'}</div>
            <div className="step-label">Map to Sitemap</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'preview' ? 'active' : ''} ${isStepComplete('preview') ? 'complete' : ''}`}>
            <div className="step-circle">{isStepComplete('preview') ? '✓' : '4'}</div>
            <div className="step-label">Preview & Generate</div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="scraping-workflow__content">
        {currentStep === 'scrape' && (
          <ScrapeSiteForm onSubmit={handleScrapeSite} loading={loading} error={error} />
        )}

        {currentStep === 'review' && scrapedContent && (
          <ScrapedContentViewer
            scrapedContent={scrapedContent}
            onEdit={setScrapedContent}
            onNext={handleContentReviewed}
            onRegenerate={() => setCurrentStep('scrape')}
          />
        )}

        {currentStep === 'map' && scrapedContent && sitemap && (
          <SitemapMapper
            scrapedContent={scrapedContent}
            sitemapPages={sitemap.pages}
            onMappingComplete={handleMappingComplete}
            onBack={() => setCurrentStep('review')}
          />
        )}

        {currentStep === 'preview' && scrapedContent && sitemap && (
          <div className="preview-step">
            <div className="preview-header">
              <h2>🎯 Preview Content Mapping</h2>
              <p>Review how scraped content will be used for each page</p>
            </div>

            <div className="preview-mappings">
              {sitemap.pages.map((sitemapPage) => {
                const mapping = mappings.find(
                  (m) => m.sitemapPagePath === sitemapPage.path
                );
                const scrapedPage = mapping?.scrapedPageKey
                  ? scrapedContent.pages.find((p) => p.page_key === mapping.scrapedPageKey)
                  : null;

                return (
                  <div key={sitemapPage.path} className="preview-mapping-card">
                    <div className="card-header">
                      <h3>{sitemapPage.title}</h3>
                      <span className="path-badge">{sitemapPage.path}</span>
                    </div>
                    <div className="card-content">
                      {scrapedPage ? (
                        <div className="mapped-info">
                          <span className="mapped-label">✅ Mapped to:</span>
                          <span className="mapped-value">{scrapedPage.title}</span>
                        </div>
                      ) : (
                        <div className="unmapped-info">
                          <span className="unmapped-label">⚠️ No mapping</span>
                          <span className="unmapped-value">
                            Will use questionnaire data
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn--small btn--secondary"
                      onClick={() =>
                        setSelectedPreviewMapping({
                          sitemapPage,
                          scrapedPageKey: mapping?.scrapedPageKey || null,
                        })
                      }
                    >
                      👁️ Preview
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="preview-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setCurrentStep('map')}
              >
                ← Back to Mapping
              </button>
              <button className="btn btn--primary btn--large" onClick={handleComplete}>
                ✅ Complete & Generate Content
              </button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="complete-step">
            <div className="complete-icon">🎉</div>
            <h2>Scraping Workflow Complete!</h2>
            <p>
              Your content has been scraped, organized, and mapped to your sitemap. You can now
              generate content using this scraped context.
            </p>
            <div className="complete-stats">
              <div className="stat">
                <span className="stat-value">{scrapedContent?.pages.length || 0}</span>
                <span className="stat-label">Pages Scraped</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {mappings.filter((m) => m.scrapedPageKey).length}
                </span>
                <span className="stat-label">Pages Mapped</span>
              </div>
              <div className="stat">
                <span className="stat-value">{scrapedContent?.metadata.total_sections || 0}</span>
                <span className="stat-label">Total Sections</span>
              </div>
            </div>
            <button className="btn btn--secondary" onClick={handleReset}>
              🔄 Start New Scraping
            </button>
          </div>
        )}
      </div>

      {/* Context Preview Modal */}
      {selectedPreviewMapping && scrapedContent && (
        <div className="preview-modal-overlay" onClick={() => setSelectedPreviewMapping(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <ContextPreview
              scrapedPage={
                selectedPreviewMapping.scrapedPageKey
                  ? scrapedContent.pages.find(
                      (p) => p.page_key === selectedPreviewMapping.scrapedPageKey
                    ) || null
                  : null
              }
              sitemapPage={selectedPreviewMapping.sitemapPage}
              onClose={() => setSelectedPreviewMapping(null)}
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">⏳</div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default ScrapingWorkflow;
