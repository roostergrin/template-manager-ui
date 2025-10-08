import React, { useState } from 'react';
import './ScrapeSiteForm.sass';

export interface ScrapeSiteFormData {
  domain: string;
  use_selenium: boolean;
  scroll: boolean;
  max_pages?: number;
}

interface ScrapeSiteFormProps {
  onSubmit: (data: ScrapeSiteFormData) => void;
  loading?: boolean;
  error?: string | null;
}

const ScrapeSiteForm: React.FC<ScrapeSiteFormProps> = ({ onSubmit, loading = false, error }) => {
  const [domain, setDomain] = useState('');
  const [useSelenium, setUseSelenium] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [maxPages, setMaxPages] = useState<number | undefined>(undefined);
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
    const value = e.target.value;
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
      use_selenium: useSelenium,
      scroll,
      max_pages: maxPages,
    });
  };

  return (
    <div className="scrape-site-form">
      <div className="scrape-site-form__header">
        <h2>🌐 Scrape Existing Website</h2>
        <p>
          Extract content and structure from an existing website to use as the foundation for your
          new site
        </p>
      </div>

      <form onSubmit={handleSubmit} className="scrape-site-form__form">
        <div className="form-group">
          <label htmlFor="domain">
            Website Domain <span className="required">*</span>
          </label>
          <input
            id="domain"
            type="text"
            className={domainError ? 'error' : ''}
            value={domain}
            onChange={handleDomainChange}
            placeholder="example.com"
            disabled={loading}
            aria-invalid={!!domainError}
            aria-describedby={domainError ? 'domain-error' : undefined}
          />
          {domainError && (
            <span id="domain-error" className="error-message" role="alert">
              {domainError}
            </span>
          )}
          <small className="help-text">
            Enter the domain without protocol (e.g., <code>dentalpractice.com</code> not{' '}
            <code>https://dentalpractice.com</code>)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="max-pages">Maximum Pages to Scrape (optional)</label>
          <input
            id="max-pages"
            type="number"
            min="1"
            value={maxPages ?? ''}
            onChange={(e) => setMaxPages(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="Leave empty for unlimited"
            disabled={loading}
          />
          <small className="help-text">
            Limit the number of pages to scrape. Leave empty to scrape all pages from the sitemap.
          </small>
        </div>

        <div className="form-group-row">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useSelenium}
                onChange={(e) => setUseSelenium(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-text">
                <strong>Use Selenium (JavaScript rendering)</strong>
                <small>
                  Enable this for sites that load content dynamically with JavaScript. Slower but
                  more comprehensive.
                </small>
              </span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scroll}
                onChange={(e) => setScroll(e.target.checked)}
                disabled={loading || !useSelenium}
              />
              <span className="checkbox-text">
                <strong>Auto-scroll pages</strong>
                <small>
                  Automatically scroll through pages to trigger lazy-loaded content. Only works
                  with Selenium enabled.
                </small>
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner">⏳</span>
                Scraping Website...
              </>
            ) : (
              <>
                <span className="icon">🚀</span>
                Start Scraping
              </>
            )}
          </button>
        </div>
      </form>

      <div className="scrape-site-form__info">
        <h3>What happens next?</h3>
        <div className="info-steps">
          <div className="info-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Crawl & Extract</h4>
              <p>
                We'll crawl the website and extract all text content, images, page structure, and
                navigation.
              </p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Organize Content</h4>
              <p>
                The scraped content will be organized into sections and pages for easy review and
                editing.
              </p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Map to Sitemap</h4>
              <p>
                You'll map the scraped pages to your new site's structure, telling us which content
                goes where.
              </p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Generate New Content</h4>
              <p>
                Our AI will use the scraped content as context to generate fresh, optimized content
                for your new site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapeSiteForm;
