// Unified Step Data Contracts
// Single source of truth for what each step reads (inputs), writes (outputs),
// whether it supports Edit/Save, and a human-readable description.

export interface StepDataContract {
  inputs: string[];          // generatedData keys this step READS
  outputs: string[];         // generatedData keys this step WRITES
  primaryOutputKey: string;  // main output key (used by Save)
  editable: boolean;         // supports Edit/Save
  description: string;       // human-readable description
}

export const STEP_DATA_CONTRACT: Record<string, StepDataContract> = {
  'create-github-repo': {
    inputs: [],
    outputs: ['githubRepoResult'],
    primaryOutputKey: 'githubRepoResult',
    editable: false,
    description: 'Creates GitHub repo from domain config',
  },
  'provision-wordpress-backend': {
    inputs: [],
    outputs: ['wordpressBackendResult'],
    primaryOutputKey: 'wordpressBackendResult',
    editable: false,
    description: 'Copies WordPress subscription from template',
  },
  'provision-site': {
    inputs: [],
    outputs: ['provisionResult'],
    primaryOutputKey: 'provisionResult',
    editable: false,
    description: 'Provisions S3 bucket, CloudFront, and CodePipeline',
  },
  'scrape-site': {
    inputs: [],
    outputs: ['scrapeResult'],
    primaryOutputKey: 'scrapeResult',
    editable: true,
    description: 'Scrapes target site for pages, markdown, and style overview',
  },
  'create-vector-store': {
    inputs: ['scrapeResult'],
    outputs: ['vectorStoreResult'],
    primaryOutputKey: 'vectorStoreResult',
    editable: true,
    description: 'Indexes scraped pages into an OpenAI vector store',
  },
  'select-template': {
    inputs: [],
    outputs: ['templateResult'],
    primaryOutputKey: 'templateResult',
    editable: false,
    description: 'Selects template and loads default sitemap',
  },
  'allocate-content': {
    inputs: ['vectorStoreResult'],
    outputs: ['allocatedSitemap'],
    primaryOutputKey: 'allocatedSitemap',
    editable: true,
    description: 'Allocates scraped content to sitemap sections via vector search',
  },
  'generate-sitemap': {
    inputs: ['allocatedSitemap'],
    outputs: ['sitemapResult'],
    primaryOutputKey: 'sitemapResult',
    editable: true,
    description: 'Generates final sitemap with queries and section assignments',
  },
  'generate-content': {
    inputs: ['sitemapResult'],
    outputs: ['contentResult'],
    primaryOutputKey: 'contentResult',
    editable: true,
    description: 'Generates page content and global data from sitemap',
  },
  'download-theme': {
    inputs: ['scrapeResult'],
    outputs: ['themeResult'],
    primaryOutputKey: 'themeResult',
    editable: true,
    description: 'Extracts design system and generates theme.json',
  },
  'image-picker': {
    inputs: ['contentResult'],
    outputs: ['imagePickerResult'],
    primaryOutputKey: 'imagePickerResult',
    editable: true,
    description: 'Selects and assigns images to content placeholders',
  },
  'prevent-hotlinking': {
    inputs: ['imagePickerResult', 'themeResult', 'provisionResult'],
    outputs: ['hotlinkResult'],
    primaryOutputKey: 'hotlinkResult',
    editable: true,
    description: 'Syncs images to S3 with CloudFront URLs to prevent hotlinking',
  },
  'upload-json-to-github': {
    inputs: ['hotlinkResult', 'contentResult', 'themeResult', 'githubRepoResult'],
    outputs: ['githubJsonResult'],
    primaryOutputKey: 'githubJsonResult',
    editable: true,
    description: 'Uploads pages.json, globalData.json, and theme.json to GitHub',
  },
  'export-to-wordpress': {
    inputs: ['imagePickerResult', 'contentResult'],
    outputs: ['wordpressResult'],
    primaryOutputKey: 'wordpressResult',
    editable: true,
    description: 'Exports page data to WordPress',
  },
  'second-pass': {
    inputs: [],
    outputs: ['secondPassResult'],
    primaryOutputKey: 'secondPassResult',
    editable: false,
    description: 'Fixes IDs and accessibility issues in WordPress',
  },
  'upload-logo': {
    inputs: ['themeResult'],
    outputs: ['logoResult'],
    primaryOutputKey: 'logoResult',
    editable: false,
    description: 'Uploads logo from theme configuration',
  },
  'upload-favicon': {
    inputs: ['themeResult'],
    outputs: ['faviconResult'],
    primaryOutputKey: 'faviconResult',
    editable: false,
    description: 'Uploads favicon from theme configuration',
  },
  'create-demo-repo': {
    inputs: [],
    outputs: ['demoRepoResult'],
    primaryOutputKey: 'demoRepoResult',
    editable: false,
    description: 'Creates demo repo in demo-rooster GitHub org',
  },
  'provision-cloudflare-pages': {
    inputs: ['demoRepoResult'],
    outputs: ['cloudflareResult'],
    primaryOutputKey: 'cloudflareResult',
    editable: false,
    description: 'Provisions Cloudflare Pages project for demo site',
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Get a step's primary output key (used by Save and session logging). */
export const getStepOutputKey = (stepId: string): string | undefined => {
  return STEP_DATA_CONTRACT[stepId]?.primaryOutputKey;
};

/**
 * Get the data to show in the Edit panel for a step.
 * Returns ONLY the step's own output (for re-editing saved results).
 * When no output exists, returns undefined so the editor starts empty
 * and the user can paste the correct output-shaped data.
 */
export const getStepEditData = (
  stepId: string,
  generatedData: Record<string, unknown>,
): unknown => {
  const contract = STEP_DATA_CONTRACT[stepId];
  if (!contract) return undefined;
  return generatedData[contract.primaryOutputKey];
};

/** Check whether a step supports Edit/Save. */
export const isStepEditable = (stepId: string): boolean => {
  const contract = STEP_DATA_CONTRACT[stepId];
  return contract?.editable === true;
};

/** Get the input keys a step reads from. */
export const getStepInputKeys = (stepId: string): string[] => {
  return STEP_DATA_CONTRACT[stepId]?.inputs ?? [];
};

// ---------------------------------------------------------------------------
// Backward-compatible aliases
// ---------------------------------------------------------------------------

/** @deprecated Use STEP_DATA_CONTRACT instead */
export const STEP_OUTPUT_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(STEP_DATA_CONTRACT).map(([stepId, contract]) => [
    stepId,
    contract.primaryOutputKey,
  ]),
);

/** @deprecated Use isStepEditable instead */
export const isStepInputEditable = isStepEditable;

/**
 * Get the INPUT data for a step (from upstream steps).
 * Used for pre-step editing (YOLO mode) where the user reviews/edits
 * the data that will be fed INTO the step before running it.
 */
export const getStepInputData = (
  stepId: string,
  generatedData: Record<string, unknown>,
): unknown => {
  const contract = STEP_DATA_CONTRACT[stepId];
  if (!contract) return undefined;
  for (const inputKey of contract.inputs) {
    const inputData = generatedData[inputKey];
    if (inputData !== undefined) return inputData;
  }
  return undefined;
};

/** Get list of editable step IDs. */
export const getEditableSteps = (): string[] => {
  return Object.entries(STEP_DATA_CONTRACT)
    .filter(([, contract]) => contract.editable)
    .map(([stepId]) => stepId);
};

export default STEP_DATA_CONTRACT;
