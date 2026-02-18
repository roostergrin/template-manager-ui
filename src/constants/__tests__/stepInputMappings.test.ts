import { describe, it, expect } from 'vitest';
import {
  getStepEditData,
  getStepInputData,
  getStepOutputKey,
  isStepEditable,
} from '../stepInputMappings';

describe('stepInputMappings', () => {
  // Realistic test data shapes
  const scrapeResult = {
    pages: { '/': { markdown: '# Home', url: 'https://example.com' } },
    styleOverview: { colors: ['#fff'] },
  };

  const vectorStoreResult = {
    success: true,
    vector_store_id: 'vs_abc123',
  };

  const allocatedSitemap = {
    pages: [{ path: '/', sections: [] }],
  };

  describe('getStepEditData', () => {
    it('returns undefined when step has no output yet', () => {
      const generatedData: Record<string, unknown> = { scrapeResult };
      const result = getStepEditData('create-vector-store', generatedData);
      expect(result).toBeUndefined();
    });

    it('does NOT fall back to input data when output is missing', () => {
      // This was the bug — old code returned scrapeResult for create-vector-store
      const generatedData: Record<string, unknown> = { scrapeResult };
      const result = getStepEditData('create-vector-store', generatedData);
      // Must NOT return scrapeResult
      expect(result).not.toEqual(scrapeResult);
      expect(result).toBeUndefined();
    });

    it('returns own output when it exists (re-editing)', () => {
      const generatedData: Record<string, unknown> = {
        scrapeResult,
        vectorStoreResult,
      };
      const result = getStepEditData('create-vector-store', generatedData);
      expect(result).toEqual(vectorStoreResult);
    });

    it('returns own output for allocate-content', () => {
      const generatedData: Record<string, unknown> = {
        vectorStoreResult,
        allocatedSitemap,
      };
      const result = getStepEditData('allocate-content', generatedData);
      expect(result).toEqual(allocatedSitemap);
    });

    it('returns undefined for unknown step', () => {
      const result = getStepEditData('nonexistent-step', { scrapeResult });
      expect(result).toBeUndefined();
    });

    it('returns undefined for step with no output in generatedData', () => {
      const result = getStepEditData('scrape-site', {});
      expect(result).toBeUndefined();
    });
  });

  describe('getStepInputData', () => {
    it('returns upstream input data for a step', () => {
      const generatedData: Record<string, unknown> = { scrapeResult };
      const result = getStepInputData('create-vector-store', generatedData);
      expect(result).toEqual(scrapeResult);
    });

    it('returns vectorStoreResult as input for allocate-content', () => {
      const generatedData: Record<string, unknown> = { vectorStoreResult };
      const result = getStepInputData('allocate-content', generatedData);
      expect(result).toEqual(vectorStoreResult);
    });

    it('returns undefined when no input data exists', () => {
      const result = getStepInputData('create-vector-store', {});
      expect(result).toBeUndefined();
    });

    it('returns undefined for steps with no inputs (e.g., scrape-site)', () => {
      const generatedData: Record<string, unknown> = { scrapeResult };
      const result = getStepInputData('scrape-site', generatedData);
      expect(result).toBeUndefined();
    });

    it('returns undefined for unknown step', () => {
      const result = getStepInputData('nonexistent', { scrapeResult });
      expect(result).toBeUndefined();
    });
  });

  describe('getStepEditData vs getStepInputData — no cross-contamination', () => {
    it('Edit on create-vector-store with only scrapeResult returns undefined (not scrape data)', () => {
      const generatedData: Record<string, unknown> = { scrapeResult };

      const editData = getStepEditData('create-vector-store', generatedData);
      const inputData = getStepInputData('create-vector-store', generatedData);

      // Edit should be empty (no own output yet)
      expect(editData).toBeUndefined();
      // Input should be scrapeResult (upstream data for running the step)
      expect(inputData).toEqual(scrapeResult);
    });

    it('after saving vectorStoreResult, Edit returns it and allocate-content can read it as input', () => {
      const generatedData: Record<string, unknown> = {
        scrapeResult,
        vectorStoreResult,
      };

      // Re-editing create-vector-store shows its own output
      const editData = getStepEditData('create-vector-store', generatedData);
      expect(editData).toEqual(vectorStoreResult);
      expect((editData as { vector_store_id: string }).vector_store_id).toBe('vs_abc123');

      // allocate-content input reads vectorStoreResult
      const allocateInput = getStepInputData('allocate-content', generatedData);
      expect(allocateInput).toEqual(vectorStoreResult);
      expect((allocateInput as { vector_store_id: string }).vector_store_id).toBe('vs_abc123');
    });

    it('saving scrape-shaped data as vectorStoreResult causes allocate-content to fail (demonstrates wrong paste)', () => {
      // Simulates the bug: user pastes scrape data into vector store editor
      const badSave: Record<string, unknown> = {
        scrapeResult,
        vectorStoreResult: scrapeResult, // WRONG: scrape data stored as vector store
      };

      const allocateInput = getStepInputData('allocate-content', badSave);
      // allocate-content would get scrape data (no vector_store_id)
      expect((allocateInput as Record<string, unknown>).vector_store_id).toBeUndefined();
      expect((allocateInput as Record<string, unknown>).pages).toBeDefined();
    });
  });

  describe('getStepOutputKey', () => {
    it('returns correct output key for each step', () => {
      expect(getStepOutputKey('create-vector-store')).toBe('vectorStoreResult');
      expect(getStepOutputKey('scrape-site')).toBe('scrapeResult');
      expect(getStepOutputKey('allocate-content')).toBe('allocatedSitemap');
    });

    it('returns undefined for unknown step', () => {
      expect(getStepOutputKey('nonexistent')).toBeUndefined();
    });
  });

  describe('isStepEditable', () => {
    it('returns true for editable steps', () => {
      expect(isStepEditable('scrape-site')).toBe(true);
      expect(isStepEditable('create-vector-store')).toBe(true);
      expect(isStepEditable('allocate-content')).toBe(true);
    });

    it('returns false for non-editable steps', () => {
      expect(isStepEditable('create-github-repo')).toBe(false);
      expect(isStepEditable('select-template')).toBe(false);
    });

    it('returns false for unknown step', () => {
      expect(isStepEditable('nonexistent')).toBe(false);
    });
  });
});
