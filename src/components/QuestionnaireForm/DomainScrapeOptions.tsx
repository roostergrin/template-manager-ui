import React, { useState } from "react";
import { MutationStatus } from "@tanstack/react-query";
import { FillFormResponse } from "../../services/fillForm";

export type DomainScrapeOptionsProps = {
  domain: string;
  setDomain: (v: string) => void;
  handleFillForm: (scrape: boolean, useSelenium: boolean, scroll: boolean) => void;
  fillFormStatus: MutationStatus;
  fillFormData?: FillFormResponse;
  mockScrapeDomain: (domain: string) => void;
};

const DomainScrapeOptions: React.FC<DomainScrapeOptionsProps> = ({
  domain,
  setDomain,
  handleFillForm,
  fillFormStatus,
  fillFormData,
  mockScrapeDomain,
}) => {
  const [scrape, setScrape] = useState(true);
  const [useSelenium, setUseSelenium] = useState(false);
  const [scroll, setScroll] = useState(false);
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
    handleFillForm(scrape, useSelenium, scroll);
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
    <div className="questionnaire-form__field flex flex-col gap-2 mb-4">
      <label htmlFor="domain-input" className="font-medium">Domain</label>
      <input
        id="domain-input"
        type="text"
        className={`questionnaire-form__input border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${domainError ? 'border-red-500 ring-2 ring-red-500' : ''}`}
        value={domain}
        onChange={handleDomainChange}
        placeholder="Enter a domain to load defaults"
        aria-label="Domain"
        tabIndex={0}
        aria-invalid={domainError}
        aria-describedby={domainError ? 'domain-error' : undefined}
      />
      {domainError && (
        <span id="domain-error" className="text-red-600 text-sm" role="alert">
          Please enter a domain.
        </span>
      )}
      <div className="flex items-center gap-4 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scrape}
            onChange={() => setScrape(!scrape)}
            aria-label="Scrape"
            tabIndex={0}
            className="accent-blue-600"
          />
          <span>Scrape</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useSelenium}
            onChange={() => setUseSelenium(!useSelenium)}
            aria-label="Use Selenium"
            tabIndex={0}
            className="accent-blue-600"
          />
          <span>Use Selenium</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scroll}
            onChange={() => setScroll(!scroll)}
            aria-label="Scroll"
            tabIndex={0}
            className="accent-blue-600"
          />
          <span>Scroll</span>
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleFillFormClick}
          aria-label="Fill Form"
          tabIndex={0}
        >
          Fill Form
        </button>
        <button
          type="button"
          className="questionnaire-form__input border px-4 py-2 rounded hover:bg-gray-100"
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