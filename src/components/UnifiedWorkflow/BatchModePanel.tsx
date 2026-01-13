import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useUnifiedWorkflow } from '../../contexts/UnifiedWorkflowProvider';
import { BatchSiteEntry, CSVParseResult } from '../../types/UnifiedWorkflowTypes';
import { AVAILABLE_TEMPLATES } from '../../constants/workflowSteps';

interface BatchModePanelProps {
  onProcessSite: (stepId: string) => Promise<void>;
  disabled?: boolean;
}

const parseCSV = (content: string): CSVParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sites: BatchSiteEntry[] = [];

  const lines = content.trim().split('\n');

  if (lines.length === 0) {
    return { success: false, sites: [], errors: ['CSV file is empty'], warnings: [] };
  }

  // Check for header row
  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes('domain') || headerLine.includes('template');
  const startLine = hasHeader ? 1 : 0;

  if (hasHeader && lines.length === 1) {
    return { success: false, sites: [], errors: ['CSV file only contains headers'], warnings: [] };
  }

  const validTemplates = AVAILABLE_TEMPLATES.map(t => t.id);

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));

    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: Not enough columns (expected at least domain, template)`);
      continue;
    }

    const [domain, template, siteType, scrapeDomain] = parts;

    // Validate domain
    if (!domain || !domain.match(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/)) {
      errors.push(`Line ${i + 1}: Invalid domain format "${domain}"`);
      continue;
    }

    // Validate template
    const normalizedTemplate = template.toLowerCase();
    if (!validTemplates.includes(normalizedTemplate)) {
      warnings.push(`Line ${i + 1}: Unknown template "${template}", using "stinson"`);
    }

    sites.push({
      domain,
      template: validTemplates.includes(normalizedTemplate) ? normalizedTemplate : 'stinson',
      siteType: siteType || normalizedTemplate || 'stinson',
      scrapeDomain: scrapeDomain || undefined,
    });
  }

  return {
    success: errors.length === 0,
    sites,
    errors,
    warnings,
  };
};

const generateSampleCSV = (): string => {
  return `domain,template,site_type,scrape_domain
example1.com,stinson,stinson,
example2.com,haightashbury,haightashbury,old-example2.com
example3.com,bayarea,bayarea,`;
};

const BatchModePanel: React.FC<BatchModePanelProps> = ({ onProcessSite, disabled = false }) => {
  const { state, actions } = useUnifiedWorkflow();
  const { config } = state;
  const { batchConfig } = config;

  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseCSV(content);
      setParseResult(result);

      if (result.success && result.sites.length > 0) {
        actions.setBatchConfig({
          sites: result.sites,
          currentIndex: 0,
          completedCount: 0,
          failedCount: 0,
          failedSites: [],
        });
      }
    };
    reader.readAsText(file);
  }, [actions]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDownloadSample = useCallback(() => {
    const content = generateSampleCSV();
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-sites-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleClearBatch = useCallback(() => {
    setParseResult(null);
    actions.setBatchConfig({
      sites: [],
      currentIndex: 0,
      completedCount: 0,
      failedCount: 0,
      failedSites: [],
    });
  }, [actions]);

  const handleRemoveSite = useCallback((index: number) => {
    if (!batchConfig) return;
    const newSites = batchConfig.sites.filter((_, i) => i !== index);
    actions.setBatchConfig({
      ...batchConfig,
      sites: newSites,
    });
    if (parseResult) {
      setParseResult({
        ...parseResult,
        sites: newSites,
      });
    }
  }, [batchConfig, parseResult, actions]);

  return (
    <div className="batch-mode-panel">
      {/* Upload Area */}
      {(!batchConfig || batchConfig.sites.length === 0) && (
        <div
          className={`batch-mode-panel__upload ${dragOver ? 'batch-mode-panel__upload--drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload CSV file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="batch-mode-panel__file-input"
            aria-hidden="true"
          />
          <Upload size={48} className="batch-mode-panel__upload-icon" />
          <p className="batch-mode-panel__upload-text">
            Drag & drop a CSV file here, or click to browse
          </p>
          <p className="batch-mode-panel__upload-format">
            Expected format: domain, template, site_type, scrape_domain
          </p>
          <button
            type="button"
            className="batch-mode-panel__sample-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSample();
            }}
          >
            <Download size={16} />
            Download sample CSV
          </button>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="batch-mode-panel__results">
          {parseResult.errors.length > 0 && (
            <div className="batch-mode-panel__errors">
              <h4 className="batch-mode-panel__errors-title">
                <AlertCircle size={16} />
                Errors
              </h4>
              <ul className="batch-mode-panel__errors-list">
                {parseResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {parseResult.warnings.length > 0 && (
            <div className="batch-mode-panel__warnings">
              <h4 className="batch-mode-panel__warnings-title">
                <AlertCircle size={16} />
                Warnings
              </h4>
              <ul className="batch-mode-panel__warnings-list">
                {parseResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Site List */}
      {batchConfig && batchConfig.sites.length > 0 && (
        <div className="batch-mode-panel__sites">
          <div className="batch-mode-panel__sites-header">
            <h4 className="batch-mode-panel__sites-title">
              <FileText size={16} />
              Sites to Process ({batchConfig.sites.length})
            </h4>
            <button
              type="button"
              className="batch-mode-panel__clear-btn"
              onClick={handleClearBatch}
              disabled={disabled}
              aria-label="Clear batch"
            >
              Clear All
            </button>
          </div>

          {/* Progress stats */}
          {state.isRunning && (
            <div className="batch-mode-panel__progress">
              <div className="batch-mode-panel__progress-bar">
                <div
                  className="batch-mode-panel__progress-fill"
                  style={{
                    width: `${((batchConfig.completedCount + batchConfig.failedCount) / batchConfig.sites.length) * 100}%`,
                  }}
                />
              </div>
              <p className="batch-mode-panel__progress-text">
                {batchConfig.completedCount + batchConfig.failedCount} of {batchConfig.sites.length} processed
                {batchConfig.failedCount > 0 && (
                  <span className="batch-mode-panel__failed-count">
                    ({batchConfig.failedCount} failed)
                  </span>
                )}
              </p>
            </div>
          )}

          <ul className="batch-mode-panel__sites-list">
            {batchConfig.sites.map((site, index) => {
              const isProcessed = index < batchConfig.currentIndex;
              const isCurrent = index === batchConfig.currentIndex && state.isRunning;
              const isFailed = batchConfig.failedSites.some(f => f.site.domain === site.domain);

              return (
                <li
                  key={site.domain}
                  className={`batch-mode-panel__site ${isProcessed ? 'batch-mode-panel__site--processed' : ''} ${isCurrent ? 'batch-mode-panel__site--current' : ''} ${isFailed ? 'batch-mode-panel__site--failed' : ''}`}
                >
                  <span className="batch-mode-panel__site-status">
                    {isProcessed && !isFailed && <CheckCircle size={14} className="batch-mode-panel__site-status--success" />}
                    {isFailed && <AlertCircle size={14} className="batch-mode-panel__site-status--error" />}
                    {isCurrent && <span className="batch-mode-panel__site-spinner" />}
                  </span>
                  <span className="batch-mode-panel__site-domain">{site.domain}</span>
                  <span className="batch-mode-panel__site-template">{site.template}</span>
                  {site.scrapeDomain && (
                    <span className="batch-mode-panel__site-scrape">
                      scrape: {site.scrapeDomain}
                    </span>
                  )}
                  {!state.isRunning && (
                    <button
                      type="button"
                      className="batch-mode-panel__site-remove"
                      onClick={() => handleRemoveSite(index)}
                      aria-label={`Remove ${site.domain}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Failed sites details */}
          {batchConfig.failedSites.length > 0 && (
            <div className="batch-mode-panel__failed-details">
              <h4 className="batch-mode-panel__failed-title">
                <AlertCircle size={16} />
                Failed Sites
              </h4>
              <ul className="batch-mode-panel__failed-list">
                {batchConfig.failedSites.map((failed, i) => (
                  <li key={i}>
                    <strong>{failed.site.domain}:</strong> {failed.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchModePanel;
