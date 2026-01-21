import { useCallback } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import {
  WorkflowExportBundle,
  SessionLogEntry,
  WorkflowStep,
} from '../types/UnifiedWorkflowTypes';

// Map step IDs to generated data keys
const STEP_TO_DATA_KEY: Record<string, string> = {
  'provision-site': 'provisionResult',
  'scrape-site': 'scrapeResult',
  'create-vector-store': 'vectorStoreResult',
  'allocate-content': 'allocatedSitemap',
  'generate-sitemap': 'sitemapResult',
  'generate-content': 'contentResult',
  'download-theme': 'themeResult',
  'image-picker': 'imagePickerResult',
  'prevent-hotlinking': 'hotlinkResult',
  'export-to-wordpress': 'wordpressResult',
  'second-pass': 'secondPassResult',
  'upload-logo': 'logoResult',
  'upload-favicon': 'faviconResult',
};

// Steps that export multiple files (pages.json, theme.json, and globalData.json with CloudFront URLs)
const MULTI_FILE_EXPORT_STEPS: Record<string, { pages: string; theme: string; globalData?: string }> = {
  'prevent-hotlinking': {
    pages: 'hotlinkPagesResult',
    theme: 'hotlinkThemeResult',
    globalData: 'hotlinkGlobalDataResult',
  },
};

// Format duration in human-readable format
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Format session log as human-readable text
export const formatSessionLog = (
  sessionLog: SessionLogEntry[],
  steps: WorkflowStep[],
  domain: string
): string => {
  const lines: string[] = [
    '='.repeat(70),
    'WORKFLOW SESSION LOG',
    '='.repeat(70),
    '',
    `Domain: ${domain}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '-'.repeat(70),
    'EXECUTION TIMELINE',
    '-'.repeat(70),
    '',
  ];

  for (const entry of sessionLog) {
    const duration = entry.durationMs ? ` (${formatDuration(entry.durationMs)})` : '';
    const dataRef = entry.dataFileRef ? ` -> ${entry.dataFileRef}` : '';
    const modified = entry.inputModified ? ' [INPUT MODIFIED]' : '';
    const eventLabel = entry.event.toUpperCase().padEnd(12);

    lines.push(
      `[${entry.timestamp}] ${eventLabel} ${entry.stepName}${duration}${dataRef}${modified}`
    );
  }

  lines.push('');
  lines.push('-'.repeat(70));
  lines.push('STEP SUMMARY');
  lines.push('-'.repeat(70));
  lines.push('');
  lines.push('Status       Step Name                      Duration   Data Key');
  lines.push('-'.repeat(70));

  for (const step of steps) {
    const status = step.status.toUpperCase().padEnd(12);
    const name = step.name.padEnd(30);
    const duration = step.actualDurationSeconds
      ? `${step.actualDurationSeconds}s`.padEnd(10)
      : 'N/A'.padEnd(10);
    const dataKey = STEP_TO_DATA_KEY[step.id] || '-';
    lines.push(`${status} ${name} ${duration} ${dataKey}`);
  }

  lines.push('');
  lines.push('='.repeat(70));
  lines.push('END OF LOG');
  lines.push('='.repeat(70));

  return lines.join('\n');
};

export const useWorkflowExport = () => {
  const { state } = useUnifiedWorkflow();

  // Helper to trigger file download
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Download JSON helper
  const downloadJson = useCallback((data: unknown, filename: string) => {
    downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
  }, [downloadFile]);

  // Export a single step's result
  const exportStepResult = useCallback((stepId: string) => {
    const step = state.steps.find(s => s.id === stepId);
    if (!step) {
      console.error(`Step ${stepId} not found`);
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const domainSlug = state.config.siteConfig.domain?.replace(/\./g, '-') || 'site';

    // Check if this step has multi-file exports (pages.json + theme.json + globalData.json with CloudFront URLs)
    const multiFileConfig = MULTI_FILE_EXPORT_STEPS[stepId];
    if (multiFileConfig) {
      console.log(`[Export] Multi-file export for step: ${stepId}`);
      console.log(`[Export] Looking for pages in: ${multiFileConfig.pages}`);
      console.log(`[Export] Looking for theme in: ${multiFileConfig.theme}`);
      console.log(`[Export] Looking for globalData in: ${multiFileConfig.globalData}`);
      console.log(`[Export] Available generatedData keys:`, Object.keys(state.generatedData));

      const pagesData = state.generatedData[multiFileConfig.pages as keyof typeof state.generatedData];
      const themeData = state.generatedData[multiFileConfig.theme as keyof typeof state.generatedData];
      const globalDataResult = multiFileConfig.globalData
        ? state.generatedData[multiFileConfig.globalData as keyof typeof state.generatedData]
        : null;

      console.log(`[Export] pagesData found: ${!!pagesData}`);
      console.log(`[Export] themeData found: ${!!themeData}`);
      console.log(`[Export] globalData found: ${!!globalDataResult}`);

      if (pagesData) {
        console.log(`[Export] Downloading pages.json...`);
        downloadJson(pagesData, `pages_${domainSlug}_${timestamp}.json`);
      } else {
        console.warn(`[Export] No pagesData found in generatedData.${multiFileConfig.pages}`);
      }

      if (themeData) {
        console.log(`[Export] Downloading theme.json...`);
        downloadJson(themeData, `theme_${domainSlug}_${timestamp}.json`);
      } else {
        console.warn(`[Export] No themeData found in generatedData.${multiFileConfig.theme}`);
      }

      if (globalDataResult) {
        console.log(`[Export] Downloading globalData.json...`);
        downloadJson(globalDataResult, `globalData_${domainSlug}_${timestamp}.json`);
      } else {
        console.warn(`[Export] No globalData found in generatedData.${multiFileConfig.globalData}`);
      }

      if (!pagesData && !themeData && !globalDataResult) {
        console.warn(`No pages, theme, or globalData for step ${stepId}`);
      }
      return;
    }

    // Get result from step or generatedData
    const dataKey = STEP_TO_DATA_KEY[stepId];
    const result = step.result || (dataKey ? state.generatedData[dataKey as keyof typeof state.generatedData] : null);

    if (!result) {
      console.warn(`No result data for step ${stepId}`);
      return;
    }

    const filename = `${stepId}_${timestamp}.json`;
    downloadJson(result, filename);
  }, [state.steps, state.generatedData, state.config.siteConfig.domain, downloadJson]);

  // Export the entire workflow as a bundle
  const exportFullWorkflow = useCallback(() => {
    const bundle: WorkflowExportBundle = {
      exportedAt: new Date().toISOString(),
      domain: state.config.siteConfig.domain,
      config: state.config,
      steps: state.steps,
      generatedData: state.generatedData as Record<string, unknown>,
      sessionLog: state.sessionLog,
      progressEvents: state.progressEvents,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const domainSlug = state.config.siteConfig.domain.replace(/\./g, '-') || 'workflow';
    const filename = `workflow_${domainSlug}_${timestamp}.json`;
    downloadJson(bundle, filename);
  }, [state, downloadJson]);

  // Export session log as text file
  const exportSessionLog = useCallback(() => {
    const logContent = formatSessionLog(
      state.sessionLog,
      state.steps,
      state.config.siteConfig.domain
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const domainSlug = state.config.siteConfig.domain.replace(/\./g, '-') || 'workflow';
    const filename = `session_log_${domainSlug}_${timestamp}.txt`;
    downloadFile(logContent, filename, 'text/plain');
  }, [state.sessionLog, state.steps, state.config.siteConfig.domain, downloadFile]);

  // Get list of steps that have exportable data
  const getExportableSteps = useCallback(() => {
    return state.steps.filter(step => {
      if (step.status !== 'completed') return false;
      const dataKey = STEP_TO_DATA_KEY[step.id];
      const result = step.result || (dataKey ? state.generatedData[dataKey as keyof typeof state.generatedData] : null);
      return !!result;
    });
  }, [state.steps, state.generatedData]);

  return {
    exportStepResult,
    exportFullWorkflow,
    exportSessionLog,
    getExportableSteps,
    STEP_TO_DATA_KEY,
  };
};

export default useWorkflowExport;
