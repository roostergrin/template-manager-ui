// Mock data for WordPress export step
import { WordPressStepResult, SecondPassResult } from '../../types/UnifiedWorkflowTypes';

export const createMockWordPressResult = (): WordPressStepResult => {
  return {
    success: true,
    pagesUpdated: 9,
    globalUpdated: true,
  };
};

export const createMockSecondPassResult = (): SecondPassResult => {
  return {
    success: true,
    idsFixed: 15,
    accessibilityFixes: 8,
    imageSizeFixes: 12,
  };
};
