import React, { useState, useEffect } from 'react';
import { Loader2, History } from 'lucide-react';
import ScrapeSiteForm, { ScrapeSiteFormData } from '../ScrapeSiteForm/ScrapeSiteForm';
import ScrapeHistory from '../ScrapeHistory';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import api from '../../services/apiService';
import { ScrapedContent } from '../ScrapedContentViewer/ScrapedContentViewer';
import './Step1Capture.sass';

const Step1Capture: React.FC = () => {
  const { actions } = useMigrationWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-load most recent scrape on mount
  useEffect(() => {
    const loadLatestScrape = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          metadata?: any;
          content?: {
            metadata: any;
            scraped_content: ScrapedContent;
          };
        }>('/scraped-samples/latest');

        if (response.success && response.content) {
          // Store scraped content in wizard state
          actions.setScrapedContent(response.content.scraped_content);
          // Move to next step to show the content
          actions.nextStep();
        }
      } catch (err) {
        // No latest scrape available - stay on capture step
        console.log('No recent scrape found, starting fresh');
      }
    };

    loadLatestScrape();
  }, []);

  const handleScrapeSubmit = async (data: ScrapeSiteFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Call scraping API
      const requestData = {
        domain: data.domain,
        use_selenium: data.use_selenium,
        scroll: data.scroll,
        max_pages: data.max_pages,
      };

      const response = await api.post<{
        metadata: any;
        scraped_content: ScrapedContent;
      }>('/scrape-site/', requestData);

      // Extract scraped_content from the nested response
      const scrapedContent = response.scraped_content;

      // Store scraped content in wizard state
      actions.setScrapedContent(scrapedContent);

      // Move to next step
      actions.nextStep();
    } catch (err: any) {
      console.error('Scraping error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to scrape website');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (content: ScrapedContent) => {
    // Store scraped content in wizard state
    actions.setScrapedContent(content);
    // Move to next step
    actions.nextStep();
  };

  return (
    <div className="step-1-capture">
      <ScrapeSiteForm
        onSubmit={handleScrapeSubmit}
        loading={loading}
        error={error}
      />

      <div className="step-1-capture__header">
        <button
          className="btn btn--secondary btn--history"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History size={16} />
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {showHistory && (
        <div className="step-1-capture__history">
          <ScrapeHistory onLoadScrape={handleLoadFromHistory} />
        </div>
      )}

      {loading && (
        <div className="step-1-capture__progress">
          <Loader2 className="progress-spinner spinning" size={48} />
          <p>Scraping website content... This may take a few minutes.</p>
        </div>
      )}
    </div>
  );
};

export default Step1Capture;
