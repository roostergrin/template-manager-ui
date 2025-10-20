import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, ChevronUp, Trash2, Loader2, AlertCircle, Search } from 'lucide-react';
import api from '../../services/apiService';
import { ScrapedContent } from '../ScrapedContentViewer/ScrapedContentViewer';
import './ScrapeHistoryDropdown.sass';

export interface ScrapeSample {
  filename: string;
  domain: string;
  scraped_at: string;
  use_selenium: boolean;
  scroll: boolean;
  pages_count: number;
  file_size_kb: number;
}

interface ScrapeHistoryDropdownProps {
  currentScrapeDomain?: string;
  currentScrapeDate?: string;
  onLoadScrape: (content: ScrapedContent) => void;
}

const ScrapeHistoryDropdown: React.FC<ScrapeHistoryDropdownProps> = ({
  currentScrapeDomain,
  currentScrapeDate,
  onLoadScrape,
}) => {
  const [samples, setSamples] = useState<ScrapeSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredSamples = useMemo(() => {
    if (!searchQuery.trim()) return samples;

    const query = searchQuery.toLowerCase();
    return samples.filter(sample =>
      sample.domain.toLowerCase().includes(query) ||
      formatDate(sample.scraped_at).toLowerCase().includes(query)
    );
  }, [samples, searchQuery]);

  const handleLoadScrape = async (filename: string) => {
    setLoadingFile(filename);

    try {
      const response = await api.get<{
        success: boolean;
        content: {
          metadata: any;
          scraped_content: ScrapedContent;
        };
      }>(`/scraped-samples/${filename}`);

      onLoadScrape(response.content.scraped_content);
      setIsOpen(false);
      setSearchQuery('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scrape');
    } finally {
      setLoadingFile(null);
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

  return (
    <div className="scrape-history-dropdown">
      <div className="scrape-history-dropdown__trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="scrape-history-dropdown__current">
          <Clock size={18} />
          <div className="scrape-history-dropdown__current-info">
            <span className="scrape-history-dropdown__current-domain">
              {currentScrapeDomain || 'Select a scraped site'}
            </span>
            {currentScrapeDate && (
              <span className="scrape-history-dropdown__current-date">
                {formatDate(currentScrapeDate)} at {formatTime(currentScrapeDate)}
              </span>
            )}
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isOpen && (
        <div className="scrape-history-dropdown__menu">
          <div className="scrape-history-dropdown__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by domain or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="scrape-history-dropdown__list">
            {loading ? (
              <div className="scrape-history-dropdown__loading">
                <Loader2 className="spinning" size={24} />
                <span>Loading history...</span>
              </div>
            ) : error ? (
              <div className="scrape-history-dropdown__error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            ) : filteredSamples.length === 0 ? (
              <div className="scrape-history-dropdown__empty">
                {searchQuery ? 'No results found' : 'No scrape history available'}
              </div>
            ) : (
              filteredSamples.map((sample) => (
                <div
                  key={sample.filename}
                  className={`scrape-history-dropdown__item ${
                    sample.domain === currentScrapeDomain && formatDate(sample.scraped_at) === formatDate(currentScrapeDate || '') ? 'active' : ''
                  } ${deletingFile === sample.filename || loadingFile === sample.filename ? 'disabled' : ''}`}
                  onClick={() => handleLoadScrape(sample.filename)}
                >
                  <div className="scrape-history-dropdown__item-main">
                    <span className="scrape-history-dropdown__item-domain">
                      {sample.domain}
                    </span>
                    <span className="scrape-history-dropdown__item-meta">
                      {formatDate(sample.scraped_at)} • {sample.pages_count}p • {sample.file_size_kb.toFixed(0)}kb
                    </span>
                  </div>
                  <button
                    className="scrape-history-dropdown__item-delete"
                    onClick={(e) => handleDeleteScrape(sample.filename, e)}
                    disabled={deletingFile === sample.filename}
                    title="Delete this scrape"
                  >
                    {deletingFile === sample.filename || loadingFile === sample.filename ? (
                      <Loader2 className="spinning" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapeHistoryDropdown;
