import React, { useState, useEffect } from 'react';
import { Clock, Database, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/apiService';
import './ScrapeHistory.sass';

export interface ScrapeSample {
  filename: string;
  domain: string;
  scraped_at: string;
  use_selenium: boolean;
  scroll: boolean;
  pages_count: number;
  file_size_kb: number;
}

interface ScrapeHistoryProps {
  onLoadScrape?: (content: any) => void;
  showActions?: boolean;
}

const ScrapeHistory: React.FC<ScrapeHistoryProps> = ({ onLoadScrape, showActions = true }) => {
  const [samples, setSamples] = useState<ScrapeSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{
        success: boolean;
        total_samples: number;
        samples: ScrapeSample[];
      }>('/scraped-samples/');

      setSamples(response.samples);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scrape history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const handleLoadScrape = async (filename: string) => {
    if (!onLoadScrape) return;

    try {
      const response = await api.get<{
        success: boolean;
        content: {
          metadata: any;
          scraped_content: any;
        };
      }>(`/scraped-samples/${filename}`);

      onLoadScrape(response.content.scraped_content);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scrape');
    }
  };

  const handleDeleteScrape = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete this scrape?\n\n${filename}`)) {
      return;
    }

    setDeletingFile(filename);

    try {
      await api.delete(`/scraped-samples/${filename}`);
      setSamples(samples.filter((s) => s.filename !== filename));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete scrape');
    } finally {
      setDeletingFile(null);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="scrape-history scrape-history--loading">
        <Loader2 className="loading-spinner" size={32} />
        <p>Loading scrape history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scrape-history scrape-history--error">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button className="btn btn--secondary" onClick={fetchSamples}>
          Retry
        </button>
      </div>
    );
  }

  if (samples.length === 0) {
    return (
      <div className="scrape-history scrape-history--empty">
        <Database size={48} />
        <p>No scrape history found</p>
        <span className="empty-hint">Scraped sites will appear here</span>
      </div>
    );
  }

  return (
    <div className="scrape-history">
      <div className="scrape-history__header">
        <h3>
          <Clock size={20} />
          Scrape History
        </h3>
        <span className="count-badge">{samples.length} total</span>
      </div>

      <div className="scrape-history__list">
        {samples.map((sample) => (
          <div
            key={sample.filename}
            className={`scrape-card ${deletingFile === sample.filename ? 'deleting' : ''}`}
            onClick={() => showActions && onLoadScrape && handleLoadScrape(sample.filename)}
            style={{ cursor: showActions && onLoadScrape ? 'pointer' : 'default' }}
          >
            <div className="scrape-card__header">
              <h4 className="scrape-card__domain">{sample.domain}</h4>
              <span className="scrape-card__date">{formatDate(sample.scraped_at)}</span>
            </div>

            <div className="scrape-card__stats">
              <div className="stat">
                <span className="stat-value">{sample.pages_count}</span>
                <span className="stat-label">pages</span>
              </div>
              <div className="stat">
                <span className="stat-value">{sample.file_size_kb.toFixed(1)}</span>
                <span className="stat-label">KB</span>
              </div>
              {sample.use_selenium && (
                <div className="badge badge--selenium">Selenium</div>
              )}
              {sample.scroll && (
                <div className="badge badge--scroll">Scroll</div>
              )}
            </div>

            {showActions && (
              <div className="scrape-card__actions">
                {onLoadScrape && (
                  <button
                    className="btn btn--icon btn--primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadScrape(sample.filename);
                    }}
                    title="Load this scrape"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  className="btn btn--icon btn--danger"
                  onClick={(e) => handleDeleteScrape(sample.filename, e)}
                  disabled={deletingFile === sample.filename}
                  title="Delete this scrape"
                >
                  {deletingFile === sample.filename ? (
                    <Loader2 className="spinning" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrapeHistory;
