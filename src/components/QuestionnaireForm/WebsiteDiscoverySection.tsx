import React from 'react';

interface WebsiteDiscoverySectionProps {
  hasSite: boolean;
  siteDomain: string;
  handleHasSiteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSiteDomainChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSiteDomainScrape: () => void;
  loading: boolean;
  error?: string | null;
  scrapedSummary?: any | null;
}

const WebsiteDiscoverySection: React.FC<WebsiteDiscoverySectionProps> = ({
  hasSite,
  siteDomain,
  handleHasSiteChange,
  handleSiteDomainChange,
  handleSiteDomainScrape,
  loading,
  error,
  scrapedSummary
}) => (
  <div className="website-discovery__card">
    <div className="website-discovery__header">Website Discovery</div>
    <div className="website-discovery__group">
      <label className="website-discovery__label">Do you have a website already?</label>
      <div className="website-discovery__radio-group">
        <label className={`website-discovery__radio${hasSite ? ' website-discovery__radio--selected' : ''}`}>
          <input
            type="radio"
            name="hasSite"
            value="yes"
            checked={hasSite === true}
            onChange={handleHasSiteChange}
          />
          Yes
        </label>
        <label className={`website-discovery__radio${!hasSite ? ' website-discovery__radio--selected' : ''}`}>
          <input
            type="radio"
            name="hasSite"
            value="no"
            checked={hasSite === false}
            onChange={handleHasSiteChange}
          />
          No
        </label>
      </div>
    </div>
    {hasSite && (
      <div className="website-discovery__group">
        <label htmlFor="siteDomain" className="website-discovery__label">What is your website domain?</label>
        <input
          type="text"
          id="siteDomain"
          name="siteDomain"
          className="website-discovery__input"
          value={siteDomain}
          onChange={handleSiteDomainChange}
          placeholder="e.g. www.example.com"
          autoComplete="off"
        />
        <div className="website-discovery__subtext">We'll use your website to help pre-fill your practice information.</div>
        <button
          type="button"
          className="website-discovery__scrape-btn"
          onClick={handleSiteDomainScrape}
          disabled={!siteDomain || loading}
        >
          {loading ? <span className="website-discovery__spinner" /> : null}
          {loading ? 'Scraping...' : 'Scrape Website'}
        </button>
        {error && <div className="website-discovery__error">{error}</div>}
        {scrapedSummary && (
          <div className="website-discovery__summary-card">
            <div className="website-discovery__summary-title">We found this info on your site. You can edit any field below.</div>
            <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Practice Name:</span> <span className="website-discovery__summary-value">{scrapedSummary.practiceName}</span></div>
            <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Orthodontist:</span> <span className="website-discovery__summary-value">{scrapedSummary.orthodontistName}</span></div>
            <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Site Vision:</span> <span className="website-discovery__summary-value">{scrapedSummary.siteVision}</span></div>
            <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Unique Qualities:</span> <span className="website-discovery__summary-value">{scrapedSummary.uniqueQualities}</span></div>
            {scrapedSummary.phone && <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Phone:</span> <span className="website-discovery__summary-value">{scrapedSummary.phone}</span></div>}
            {scrapedSummary.email && <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Email:</span> <span className="website-discovery__summary-value">{scrapedSummary.email}</span></div>}
            {scrapedSummary.address && <div className="website-discovery__summary-row"><span className="website-discovery__summary-label">Address:</span> <span className="website-discovery__summary-value">{scrapedSummary.address}</span></div>}
          </div>
        )}
      </div>
    )}
  </div>
);

export default WebsiteDiscoverySection; 