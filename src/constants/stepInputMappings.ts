// Step Input Mappings
// Maps each step to its input data source from generatedData
// Used for pre-step input editing feature

export interface StepInputMapping {
  dataKey: string;           // Key in generatedData where input data is stored
  dataPath?: string;         // Optional nested path within the data (e.g., "scrapedContent")
  description: string;       // Human-readable description of what this input is
  editable: boolean;         // Whether this input can be edited before step runs
}

export const STEP_INPUT_MAPPINGS: Record<string, StepInputMapping> = {
  'create-github-repo': {
    dataKey: '',  // No input data - uses config only
    description: 'No input data - uses domain from config to create repo name',
    editable: false,
  },
  'provision-wordpress-backend': {
    dataKey: '',  // No input data - uses config only
    description: 'No input data - copies WordPress subscription from template',
    editable: false,
  },
  'provision-site': {
    dataKey: '',  // No input data - uses config only
    description: 'No input data - uses site configuration',
    editable: false,
  },
  'scrape-site': {
    dataKey: '',  // No input data - uses config only
    description: 'No input data - uses scrape domain from config',
    editable: false,
  },
  'create-vector-store': {
    dataKey: 'scrapeResult',
    dataPath: 'pages',
    description: 'Scraped pages to index in vector store',
    editable: true,
  },
  'select-template': {
    dataKey: '',  // Uses config.template
    description: 'Template selection from config',
    editable: false,
  },
  'allocate-content': {
    dataKey: 'vectorStoreResult',
    description: 'Vector store ID for content allocation',
    editable: false,  // Can't edit vector store ID
  },
  'generate-sitemap': {
    dataKey: 'allocatedSitemap',
    dataPath: 'pages',
    description: 'Allocated sitemap pages',
    editable: true,
  },
  'generate-content': {
    dataKey: 'sitemapResult',
    dataPath: 'pages',
    description: 'Sitemap pages for content generation',
    editable: true,
  },
  'download-theme': {
    dataKey: 'scrapeResult',
    dataPath: 'designSystem',
    description: 'Design system from scraped site',
    editable: true,
  },
  'image-picker': {
    dataKey: 'contentResult',
    dataPath: 'pageData',
    description: 'Generated page content with image placeholders',
    editable: true,
  },
  'prevent-hotlinking': {
    dataKey: 'hotlinkInputData',
    description: 'Pages and theme data to sync to S3 with CloudFront URLs',
    editable: true,
  },
  'upload-json-to-github': {
    dataKey: 'githubInputData',
    description: 'Pages, globalData, and theme JSON to upload to GitHub',
    editable: true,
  },
  'export-to-wordpress': {
    dataKey: 'imagePickerResult',
    description: 'Page data with updated images',
    editable: true,
  },
  'second-pass': {
    dataKey: '',  // Uses WordPress API URL from config
    description: 'No input data - uses WordPress API URL',
    editable: false,
  },
  'upload-logo': {
    dataKey: 'themeResult',
    dataPath: 'theme',
    description: 'Theme configuration with logo settings',
    editable: false,
  },
  'upload-favicon': {
    dataKey: 'themeResult',
    dataPath: 'theme',
    description: 'Theme configuration with favicon settings',
    editable: false,
  },
};

// Helper to get input data for a step from generatedData
export const getStepInputData = (
  stepId: string,
  generatedData: Record<string, unknown>
): unknown => {
  const mapping = STEP_INPUT_MAPPINGS[stepId];
  if (!mapping || !mapping.dataKey) {
    return undefined;
  }

  const data = generatedData[mapping.dataKey];
  if (!data) {
    return undefined;
  }

  // If there's a dataPath, extract the nested value
  if (mapping.dataPath && typeof data === 'object' && data !== null) {
    return (data as Record<string, unknown>)[mapping.dataPath];
  }

  return data;
};

// Helper to check if a step has editable input
export const isStepInputEditable = (stepId: string): boolean => {
  const mapping = STEP_INPUT_MAPPINGS[stepId];
  return mapping?.editable === true && !!mapping.dataKey;
};

// Helper to get editable steps
export const getEditableSteps = (): string[] => {
  return Object.entries(STEP_INPUT_MAPPINGS)
    .filter(([_, mapping]) => mapping.editable && mapping.dataKey)
    .map(([stepId]) => stepId);
};

export default STEP_INPUT_MAPPINGS;
