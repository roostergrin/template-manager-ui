import React, { useState } from 'react';
import { Info, Loader2 } from 'lucide-react';
import './ScrapeSiteForm.sass';

export interface ScrapeSiteFormData {
  domain: string;
  use_selenium: boolean;
  scroll: boolean;
  max_pages?: number;
  use_firecrawl: boolean;
}

interface ScrapeSiteFormProps {
  onSubmit: (data: ScrapeSiteFormData) => void;
  loading?: boolean;
  error?: string | null;
}

const ScrapeSiteForm: React.FC<ScrapeSiteFormProps> = ({ onSubmit, loading = false, error }) => {
  const [domain, setDomain] = useState('');
  const [maxPages, setMaxPages] = useState<number | undefined>(undefined);
  const [useFirecrawl, setUseFirecrawl] = useState(true);
  const [domainError, setDomainError] = useState('');

  const validateDomain = (value: string): boolean => {
    if (!value.trim()) {
      setDomainError('Domain is required');
      return false;
    }

    // Basic domain validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    // Remove protocol if present
    let cleanDomain = value.trim();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    cleanDomain = cleanDomain.replace(/\/.*$/, ''); // Remove path

    if (!domainRegex.test(cleanDomain)) {
      setDomainError('Please enter a valid domain (e.g., example.com)');
      return false;
    }

    setDomainError('');
    return true;
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove protocol if pasted
    value = value.replace(/^https?:\/\//, '');
    setDomain(value);
    if (domainError && value.trim()) {
      setDomainError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDomain(domain)) {
      return;
    }

    // Clean domain
    let cleanDomain = domain.trim();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    cleanDomain = cleanDomain.replace(/\/.*$/, '');

    onSubmit({
      domain: cleanDomain,
      use_selenium: true,
      scroll: true,
      max_pages: maxPages,
      use_firecrawl: useFirecrawl,
    });
  };

  return (
    <div className="scrape-site-form">
      <form onSubmit={handleSubmit} className="scrape-site-form__form">
        <div className="form-domain-row">
          <div className="input-wrapper">
            <span className="url-prefix">https://</span>
            <input
              id="domain"
              type="text"
              className={`domain-input ${domainError ? 'error' : ''}`}
              value={domain}
              onChange={handleDomainChange}
              placeholder="example.com"
              disabled={loading}
              aria-invalid={!!domainError}
              aria-describedby={domainError ? 'domain-error' : undefined}
            />
          </div>
          {domainError && (
            <span id="domain-error" className="error-message" role="alert">
              {domainError}
            </span>
          )}
        </div>

        <div className="form-controls">
          <div className="control-group">
            <div className="option-field">
              <label htmlFor="max-pages" className="option-label">
                <span>Max Pages</span>
                <span
                  className="tooltip-wrapper"
                  data-tooltip="Limit the number of pages to scrape. Leave empty to scrape all pages from the sitemap."
                >
                  <Info className="tooltip-icon" size={14} />
                </span>
              </label>
              <input
                id="max-pages"
                type="number"
                min="1"
                value={maxPages ?? ''}
                onChange={(e) => setMaxPages(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="Unlimited"
                disabled={loading}
                className="option-input"
              />
            </div>

            <div className="option-field option-field--checkbox">
              <label htmlFor="use-firecrawl" className="option-label option-label--checkbox">
                <input
                  id="use-firecrawl"
                  type="checkbox"
                  checked={useFirecrawl}
                  onChange={(e) => setUseFirecrawl(e.target.checked)}
                  disabled={loading}
                  className="option-checkbox"
                />
                <span>Use Firecrawl</span>
                <span
                  className="tooltip-wrapper"
                  data-tooltip="Use Firecrawl API for better anti-bot handling and branding extraction. Recommended for sites with bot protection."
                >
                  <Info className="tooltip-icon" size={14} />
                </span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-scrape" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="btn-icon spinning" size={20} />
                <span>Scraping...</span>
              </>
            ) : (
              <span>Start scraping</span>
            )}
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-text">{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ScrapeSiteForm;
