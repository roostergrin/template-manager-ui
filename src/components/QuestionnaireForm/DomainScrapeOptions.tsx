import React, { useState } from "react";
import { MutationStatus } from "@tanstack/react-query";
import { FillFormResponse } from "../../services/fillForm";

export type DomainScrapeOptionsProps = {
  domain: string;
  setDomain: (v: string) => void;
  handleFillForm: (scrape: boolean, useSelenium: boolean, scroll: boolean, maxPages?: number) => void;
  fillFormStatus?: MutationStatus;
  fillFormData?: FillFormResponse;
  mockScrapeDomain: (domain: string) => void;
};

const DomainScrapeOptions: React.FC<DomainScrapeOptionsProps> = ({
  domain,
  setDomain,
  handleFillForm,
  // fillFormStatus,
  // fillFormData,
  mockScrapeDomain,
}) => {
  const [scrape, setScrape] = useState(true);
  const [useSelenium, setUseSelenium] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [maxPages, setMaxPages] = useState<number | undefined>(undefined);
  const [domainError, setDomainError] = useState(false);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
    if (domainError) setDomainError(false);
  };

  const handleFillFormClick = () => {
    if (!domain.trim()) {
      setDomainError(true);
      return;
    }
    setDomainError(false);
    handleFillForm(scrape, useSelenium, scroll, maxPages);
  };

  const handleMockScrapeClick = () => {
    if (!domain.trim()) {
      setDomainError(true);
      return;
    }
    setDomainError(false);
    mockScrapeDomain(domain);
  };

  return (
    <div className="form-group">
      <label htmlFor="domain-input">Domain</label>
      <input
        id="domain-input"
        type="text"
        className={domainError ? 'error' : ''}
        value={domain}
        onChange={handleDomainChange}
        placeholder="Enter a domain to load defaults"
        aria-label="Domain"
        tabIndex={0}
        aria-invalid={domainError}
        aria-describedby={domainError ? 'domain-error' : undefined}
      />
      {domainError && (
        <span id="domain-error" className="error-message" role="alert">
          Please enter a domain.
        </span>
      )}
      <div className="form-group">
        <label htmlFor="max-pages-input">Max Pages (optional)</label>
        <input
          id="max-pages-input"
          type="number"
          min="1"
          value={maxPages ?? ''}
          onChange={(e) => setMaxPages(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          placeholder="Leave empty for unlimited"
          aria-label="Maximum Pages"
          tabIndex={0}
        />
      </div>
      <div className="radio-group">
        <div className="radio-option">
          <input
            type="checkbox"
            checked={scrape}
            onChange={() => setScrape(!scrape)}
            aria-label="Scrape"
            tabIndex={0}
          />
          <span>Scrape</span>
        </div>
        <div className="radio-option">
          <input
            type="checkbox"
            checked={useSelenium}
            onChange={() => setUseSelenium(!useSelenium)}
            aria-label="Use Selenium"
            tabIndex={0}
          />
          <span>Use Selenium</span>
        </div>
        <div className="radio-option">
          <input
            type="checkbox"
            checked={scroll}
            onChange={() => setScroll(!scroll)}
            aria-label="Scroll"
            tabIndex={0}
          />
          <span>Scroll</span>
        </div>
      </div>
      <div className="form-row">
        <button
          type="button"
          className="secondary-button"
          onClick={handleFillFormClick}
          aria-label="Fill Form"
          tabIndex={0}
        >
          Fill Form
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={handleMockScrapeClick}
          aria-label="Load Defaults (Mock)"
          tabIndex={0}
        >
          Load Defaults (Mock)
        </button>
      </div>
    </div>
  );
};

export default DomainScrapeOptions; 
