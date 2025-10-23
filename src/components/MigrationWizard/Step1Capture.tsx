import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ScrapeSiteForm, { ScrapeSiteFormData } from '../ScrapeSiteForm/ScrapeSiteForm';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import api from '../../services/apiService';
import { ScrapedContent } from '../ScrapedContentViewer/ScrapedContentViewer';
import './Step1Capture.sass';

const Step1Capture: React.FC = () => {
  const { actions } = useMigrationWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load most recent scrape on mount
  useEffect(() => {
    const loadLatestScrape = async () => {
      try {
        console.log('🔄 Auto-loading latest scrape on mount...');
        const response = await api.get<{
          success: boolean;
          metadata?: any;
          content?: {
            metadata: any;
            scraped_content: ScrapedContent;
          };
        }>('/scraped-samples/latest');

        console.log('🔍 Auto-load response:', response);

        if (response.success && response.content) {
          console.log('✅ Latest scrape found, loading into state');
          console.log('🔍 Scraped content from auto-load:', response.content.scraped_content);
          // Store scraped content in wizard state
          actions.setScrapedContent(response.content.scraped_content);
          // Move to next step to show the content
          actions.nextStep();
        } else {
          console.log('⚠️ Response received but no content found');
        }
      } catch (err) {
        // No latest scrape available - stay on capture step
        console.log('❌ No recent scrape found, starting fresh:', err);
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

      const response = await api.post<ScrapedContent>('/scrape-site/', requestData);

      // The response IS the scraped content (flat structure)
      console.log('✅ Scraping complete! Pages scraped:', response.metadata.total_pages);

      // Store scraped content in wizard state
      actions.setScrapedContent(response);

      // Move to next step
      actions.nextStep();
    } catch (err: any) {
      console.error('Scraping error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to scrape website');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-1-capture">
      <ScrapeSiteForm
        onSubmit={handleScrapeSubmit}
        loading={loading}
        error={error}
      />

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
