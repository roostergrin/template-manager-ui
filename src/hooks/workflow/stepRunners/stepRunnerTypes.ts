import React from 'react';
import { UnifiedWorkflowActions, StepLogDetails } from '../../../types/UnifiedWorkflowTypes';
import { StepLogger } from '../../../utils/workflowLogger';

export interface StepResult {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: StepLogDetails;
}

export type StepExecutor = (logger: StepLogger) => Promise<StepResult>;

// Helper to determine if an API response was successful
// Handles cases where API returns data directly without a success field
export const isResponseSuccessful = (response: Record<string, unknown>): boolean => {
  // If explicitly marked as failed, return false
  if (response.success === false || response.error) {
    return false;
  }
  // If explicitly marked as successful, return true
  if (response.success === true) {
    return true;
  }
  // Otherwise, assume success if we got any data back (no success field)
  return true;
};

export interface StepRunnerDeps extends UnifiedWorkflowActions {
  getGeneratedData: <T>(key: string) => T | undefined;
  setGeneratedDataWithRef: (key: string, data: unknown) => void;
  editedInputDataRef: React.MutableRefObject<Record<string, unknown>>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}
