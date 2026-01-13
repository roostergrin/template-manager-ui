/**
 * Workflow Logger Utility
 * Provides detailed console logging for workflow steps with color-coded output
 * and structured data for activity log display
 */

import { StepLogDetails, StepLogPhase } from '../types/UnifiedWorkflowTypes';

// Step ID to display name mapping for console output
const STEP_LABELS: Record<string, string> = {
  'provision-site': 'PROVISION',
  'scrape-site': 'SCRAPE',
  'select-template': 'TEMPLATE',
  'generate-sitemap': 'SITEMAP',
  'generate-content': 'CONTENT',
  'download-theme': 'THEME',
  'image-picker': 'IMAGES',
  'prevent-hotlinking': 'HOTLINK',
  'export-to-wordpress': 'WORDPRESS',
  'second-pass': 'SECONDPASS',
  'upload-logo': 'LOGO',
  'upload-favicon': 'FAVICON',
};

// Console colors for different phases
const COLORS = {
  start: '#4CAF50',      // Green
  api_request: '#2196F3', // Blue
  api_response: '#9C27B0', // Purple
  processing: '#FF9800',  // Orange
  complete: '#4CAF50',    // Green
  error: '#F44336',       // Red
};

const formatTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
};

const truncateObject = (obj: unknown, maxLength = 200): string => {
  const str = JSON.stringify(obj);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export interface StepLogger {
  logStart: (config: Record<string, unknown>) => StepLogDetails;
  logApiRequest: (endpoint: string, payload: Record<string, unknown>) => StepLogDetails;
  logApiResponse: (response: unknown, durationMs: number) => StepLogDetails;
  logProcessing: (message: string, metadata?: Record<string, unknown>) => StepLogDetails;
  logComplete: (result: unknown, totalDurationMs: number) => StepLogDetails;
  logError: (error: unknown, context?: Record<string, unknown>) => StepLogDetails;
}

/**
 * Creates a logger instance for a specific workflow step
 * Returns functions that both log to console and return StepLogDetails for the activity log
 */
export const createStepLogger = (stepId: string, stepName: string): StepLogger => {
  const label = STEP_LABELS[stepId] || stepId.toUpperCase();

  const log = (phase: StepLogPhase, message: string, data?: unknown): void => {
    const time = formatTime();
    const color = COLORS[phase];

    console.log(
      `%c[${time}] [${label}] ${message}`,
      `color: ${color}; font-weight: bold;`,
      data ? data : ''
    );
  };

  return {
    logStart: (config: Record<string, unknown>): StepLogDetails => {
      log('start', `Starting step: ${stepName}`);
      log('start', `Config: ${truncateObject(config)}`);

      return {
        phase: 'start',
        metadata: { config },
      };
    },

    logApiRequest: (endpoint: string, payload: Record<string, unknown>): StepLogDetails => {
      log('api_request', `\u2192 POST ${endpoint}`, truncateObject(payload));

      return {
        phase: 'api_request',
        endpoint,
        request: payload,
      };
    },

    logApiResponse: (response: unknown, durationMs: number): StepLogDetails => {
      log('api_response', `\u2190 Response (${formatDuration(durationMs)}):`, truncateObject(response));

      return {
        phase: 'api_response',
        response: response as Record<string, unknown>,
        duration: durationMs,
      };
    },

    logProcessing: (message: string, metadata?: Record<string, unknown>): StepLogDetails => {
      log('processing', message, metadata);

      return {
        phase: 'processing',
        metadata: { message, ...metadata },
      };
    },

    logComplete: (result: unknown, totalDurationMs: number): StepLogDetails => {
      log('complete', `\u2713 Completed (${formatDuration(totalDurationMs)} total)`);

      return {
        phase: 'complete',
        response: result as Record<string, unknown>,
        duration: totalDurationMs,
      };
    },

    logError: (error: unknown, context?: Record<string, unknown>): StepLogDetails => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('error', `\u2717 Error: ${errorMessage}`, context);

      return {
        phase: 'error',
        metadata: {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          ...context,
        },
      };
    },
  };
};

/**
 * Utility to measure execution time
 */
export const createTimer = (): { elapsed: () => number } => {
  const startTime = performance.now();

  return {
    elapsed: () => performance.now() - startTime,
  };
};

/**
 * Log a workflow-level event (not tied to a specific step)
 */
export const logWorkflowEvent = (
  event: 'start' | 'pause' | 'resume' | 'stop' | 'complete' | 'error',
  message: string,
  data?: Record<string, unknown>
): void => {
  const time = formatTime();
  const colors: Record<string, string> = {
    start: '#4CAF50',
    pause: '#FF9800',
    resume: '#2196F3',
    stop: '#9E9E9E',
    complete: '#4CAF50',
    error: '#F44336',
  };

  const icons: Record<string, string> = {
    start: '\u25B6',
    pause: '\u23F8',
    resume: '\u25B6',
    stop: '\u23F9',
    complete: '\u2713',
    error: '\u2717',
  };

  console.log(
    `%c[${time}] [WORKFLOW] ${icons[event]} ${message}`,
    `color: ${colors[event]}; font-weight: bold;`,
    data ? data : ''
  );
};

export default createStepLogger;
