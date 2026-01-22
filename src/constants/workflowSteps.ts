import { WorkflowStep, WorkflowPhase } from '../types/UnifiedWorkflowTypes';

export const WORKFLOW_STEP_IDS = {
  CREATE_GITHUB_REPO: 'create-github-repo',
  PROVISION_WORDPRESS_BACKEND: 'provision-wordpress-backend',
  PROVISION_SITE: 'provision-site',
  SCRAPE_SITE: 'scrape-site',
  CREATE_VECTOR_STORE: 'create-vector-store',
  SELECT_TEMPLATE: 'select-template',
  GENERATE_SITEMAP: 'generate-sitemap',
  ALLOCATE_CONTENT: 'allocate-content',
  GENERATE_CONTENT: 'generate-content',
  DOWNLOAD_THEME: 'download-theme',
  IMAGE_PICKER: 'image-picker',
  PREVENT_HOTLINKING: 'prevent-hotlinking',
  UPLOAD_JSON_TO_GITHUB: 'upload-json-to-github',
  EXPORT_TO_WORDPRESS: 'export-to-wordpress',
  SECOND_PASS: 'second-pass',
  UPLOAD_LOGO: 'upload-logo',
  UPLOAD_FAVICON: 'upload-favicon',
  // Demo site (Cloudflare Pages) steps
  CREATE_DEMO_REPO: 'create-demo-repo',
  PROVISION_CLOUDFLARE_PAGES: 'provision-cloudflare-pages',
} as const;

export type WorkflowStepId = typeof WORKFLOW_STEP_IDS[keyof typeof WORKFLOW_STEP_IDS];

export const WORKFLOW_PHASES: Record<WorkflowPhase, { label: string; description: string }> = {
  infrastructure: {
    label: 'Infrastructure',
    description: 'Set up cloud resources and hosting',
  },
  planning: {
    label: 'Planning',
    description: 'Content generation and site structure',
  },
  deployment: {
    label: 'Deployment',
    description: 'Push content to production',
  },
};

export const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: WORKFLOW_STEP_IDS.CREATE_GITHUB_REPO,
    name: 'Create GitHub Repo',
    description: 'Create GitHub repository from template',
    phase: 'infrastructure',
    status: 'pending',
    dependencies: [],
    estimatedDurationSeconds: 15,
  },
  {
    id: WORKFLOW_STEP_IDS.PROVISION_WORDPRESS_BACKEND,
    name: 'Provision WordPress Backend',
    description: 'Copy Plesk subscription for WordPress API backend (WordPress templates only)',
    phase: 'infrastructure',
    status: 'skipped',
    dependencies: [],
    estimatedDurationSeconds: 120,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.PROVISION_SITE,
    name: 'Provision Site',
    description: 'Create S3 bucket and CloudFront distributions (dist + assets)',
    phase: 'infrastructure',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.CREATE_GITHUB_REPO],
    estimatedDurationSeconds: 45,
  },
  {
    id: WORKFLOW_STEP_IDS.SCRAPE_SITE,
    name: 'Scrape Site',
    description: 'Scrape existing site content and design system',
    phase: 'planning',
    status: 'pending',
    dependencies: [],
    estimatedDurationSeconds: 120,
  },
  {
    id: WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE,
    name: 'Create Vector Store',
    description: 'Index scraped content for AI-powered content allocation',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.SCRAPE_SITE],
    estimatedDurationSeconds: 30,
  },
  {
    id: WORKFLOW_STEP_IDS.SELECT_TEMPLATE,
    name: 'Select Template',
    description: 'Choose from 8 available templates',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE],
    estimatedDurationSeconds: 2,
  },
  {
    id: WORKFLOW_STEP_IDS.ALLOCATE_CONTENT,
    name: 'Allocate Content',
    description: 'Map scraped markdown to default template sitemap using vector store',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE, WORKFLOW_STEP_IDS.SELECT_TEMPLATE],
    estimatedDurationSeconds: 45,
  },
  {
    id: WORKFLOW_STEP_IDS.GENERATE_SITEMAP,
    name: 'Generate Sitemap',
    description: 'Generate page structure and hierarchy (strict template mode)',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.ALLOCATE_CONTENT],
    estimatedDurationSeconds: 30,
  },
  {
    id: WORKFLOW_STEP_IDS.GENERATE_CONTENT,
    name: 'Generate Content',
    description: 'Generate page and global JSON content (AI-powered)',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.GENERATE_SITEMAP],
    estimatedDurationSeconds: 300, // 5 minutes - this is the slow step
  },
  {
    id: WORKFLOW_STEP_IDS.DOWNLOAD_THEME,
    name: 'Download Theme.json',
    description: 'Auto-download theme configuration file',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.SCRAPE_SITE],
    estimatedDurationSeconds: 5,
  },
  {
    id: WORKFLOW_STEP_IDS.IMAGE_PICKER,
    name: 'Image Picker',
    description: 'Update images while preserving doctor photos',
    phase: 'planning',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.GENERATE_CONTENT],
    estimatedDurationSeconds: 60,
  },
  {
    id: WORKFLOW_STEP_IDS.PREVENT_HOTLINKING,
    name: 'Prevent Hotlinking',
    description: 'Sync images to S3 and configure CloudFront-only access',
    phase: 'infrastructure',
    status: 'pending',
    dependencies: [WORKFLOW_STEP_IDS.PROVISION_SITE, WORKFLOW_STEP_IDS.IMAGE_PICKER, WORKFLOW_STEP_IDS.DOWNLOAD_THEME],
    estimatedDurationSeconds: 15,
  },
  {
    id: WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB,
    name: 'Upload JSON to GitHub',
    description: 'Upload pages.json, globalData.json, and theme.json to GitHub repo (JSON templates only)',
    phase: 'deployment',
    status: 'pending',
    dependencies: [
      WORKFLOW_STEP_IDS.CREATE_GITHUB_REPO,
      WORKFLOW_STEP_IDS.PREVENT_HOTLINKING,
    ],
    estimatedDurationSeconds: 20,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS,
    name: 'Export to WordPress',
    description: 'Push content via REST API (WordPress templates only)',
    phase: 'deployment',
    status: 'skipped',
    dependencies: [
      WORKFLOW_STEP_IDS.GENERATE_CONTENT,
      WORKFLOW_STEP_IDS.IMAGE_PICKER,
    ],
    estimatedDurationSeconds: 60,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.SECOND_PASS,
    name: 'Second Pass',
    description: 'Fix IDs, accessibility, and image sizes (WordPress templates only)',
    phase: 'deployment',
    status: 'skipped',
    dependencies: [WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS],
    estimatedDurationSeconds: 45,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.UPLOAD_LOGO,
    name: 'Upload Logo',
    description: 'Upload PNG logo with header color detection',
    phase: 'deployment',
    status: 'skipped',
    dependencies: [WORKFLOW_STEP_IDS.DOWNLOAD_THEME],
    estimatedDurationSeconds: 15,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.UPLOAD_FAVICON,
    name: 'Upload Favicon',
    description: 'Upload site favicon',
    phase: 'deployment',
    status: 'skipped',
    dependencies: [WORKFLOW_STEP_IDS.DOWNLOAD_THEME],
    estimatedDurationSeconds: 10,
    isOptional: true,
  },
  // Demo site (Cloudflare Pages) steps - skipped by default, enabled when deploymentTarget === 'demo'
  {
    id: WORKFLOW_STEP_IDS.CREATE_DEMO_REPO,
    name: 'Create Demo Repository',
    description: 'Create GitHub repository in demo-rooster organization',
    phase: 'infrastructure',
    status: 'skipped',
    dependencies: [],
    estimatedDurationSeconds: 15,
    isOptional: true,
  },
  {
    id: WORKFLOW_STEP_IDS.PROVISION_CLOUDFLARE_PAGES,
    name: 'Provision Cloudflare Pages',
    description: 'Create Cloudflare Pages project and connect to GitHub repo',
    phase: 'infrastructure',
    status: 'skipped',
    dependencies: [WORKFLOW_STEP_IDS.CREATE_DEMO_REPO],
    estimatedDurationSeconds: 30,
    isOptional: true,
  },
];

export const AVAILABLE_TEMPLATES = [
  { id: 'stinson', name: 'Stinson', description: 'Clean, modern design' },
  { id: 'haightashbury', name: 'Haight Ashbury', description: 'Vibrant and colorful' },
  { id: 'bayarea', name: 'Bay Area', description: 'Professional and sleek' },
  { id: 'calistoga', name: 'Calistoga', description: 'Warm and inviting' },
  { id: 'napa', name: 'Napa', description: 'Elegant and refined' },
  { id: 'sonoma', name: 'Sonoma', description: 'Rustic and charming' },
  { id: 'marin', name: 'Marin', description: 'Modern coastal' },
  { id: 'mendocino', name: 'Mendocino', description: 'Natural and organic' },
] as const;

export type TemplateName = typeof AVAILABLE_TEMPLATES[number]['id'];

// Helper function to get step by ID
export const getStepById = (steps: WorkflowStep[], stepId: string): WorkflowStep | undefined => {
  return steps.find(step => step.id === stepId);
};

// Helper function to get steps by phase
export const getStepsByPhase = (steps: WorkflowStep[], phase: WorkflowPhase): WorkflowStep[] => {
  return steps.filter(step => step.phase === phase);
};

// Helper function to check if all dependencies are met
export const areDependenciesMet = (steps: WorkflowStep[], stepId: string): boolean => {
  const step = getStepById(steps, stepId);
  if (!step) return false;

  return step.dependencies.every(depId => {
    const depStep = getStepById(steps, depId);
    return depStep && (depStep.status === 'completed' || depStep.status === 'skipped');
  });
};

// Helper function to perform topological sort of steps based on dependencies
export const topologicalSortSteps = (steps: WorkflowStep[]): WorkflowStep[] => {
  const sorted: WorkflowStep[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (stepId: string) => {
    if (visited.has(stepId)) return;
    if (visiting.has(stepId)) {
      console.warn(`Circular dependency detected for step: ${stepId}`);
      return;
    }

    visiting.add(stepId);
    const step = getStepById(steps, stepId);
    if (step) {
      for (const depId of step.dependencies) {
        visit(depId);
      }
      visited.add(stepId);
      visiting.delete(stepId);
      sorted.push(step);
    }
  };

  for (const step of steps) {
    visit(step.id);
  }

  return sorted;
};

// Calculate total estimated duration for all steps
export const getTotalEstimatedDuration = (steps: WorkflowStep[]): number => {
  return steps.reduce((total, step) => total + step.estimatedDurationSeconds, 0);
};

// Calculate elapsed time for workflow
export const getElapsedTime = (steps: WorkflowStep[]): number => {
  return steps.reduce((total, step) => total + (step.actualDurationSeconds || 0), 0);
};

// Get execution order for YOLO mode (production AWS deployment)
export const getYoloExecutionOrder = (): string[] => {
  return [
    WORKFLOW_STEP_IDS.CREATE_GITHUB_REPO,
    WORKFLOW_STEP_IDS.PROVISION_WORDPRESS_BACKEND,
    WORKFLOW_STEP_IDS.PROVISION_SITE,
    WORKFLOW_STEP_IDS.SCRAPE_SITE,
    WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE,
    WORKFLOW_STEP_IDS.SELECT_TEMPLATE,
    WORKFLOW_STEP_IDS.ALLOCATE_CONTENT,
    WORKFLOW_STEP_IDS.GENERATE_SITEMAP,
    WORKFLOW_STEP_IDS.GENERATE_CONTENT,
    WORKFLOW_STEP_IDS.DOWNLOAD_THEME,
    WORKFLOW_STEP_IDS.IMAGE_PICKER,
    WORKFLOW_STEP_IDS.PREVENT_HOTLINKING,
    WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB,
    WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS,
    WORKFLOW_STEP_IDS.SECOND_PASS,
    WORKFLOW_STEP_IDS.UPLOAD_LOGO,
    WORKFLOW_STEP_IDS.UPLOAD_FAVICON,
  ];
};

// Get execution order for demo mode (Cloudflare Pages deployment)
export const getDemoExecutionOrder = (): string[] => {
  return [
    WORKFLOW_STEP_IDS.CREATE_DEMO_REPO,
    WORKFLOW_STEP_IDS.SCRAPE_SITE,
    WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE,
    WORKFLOW_STEP_IDS.SELECT_TEMPLATE,
    WORKFLOW_STEP_IDS.ALLOCATE_CONTENT,
    WORKFLOW_STEP_IDS.GENERATE_SITEMAP,
    WORKFLOW_STEP_IDS.GENERATE_CONTENT,
    WORKFLOW_STEP_IDS.DOWNLOAD_THEME,
    WORKFLOW_STEP_IDS.IMAGE_PICKER,
    // Note: For demo sites, we skip hotlinking prevention (images stay hotlinked)
    WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB,
    WORKFLOW_STEP_IDS.PROVISION_CLOUDFLARE_PAGES,
  ];
};

// Get execution order based on deployment target
export const getExecutionOrderByTarget = (deploymentTarget: 'production' | 'demo' = 'production'): string[] => {
  return deploymentTarget === 'demo' ? getDemoExecutionOrder() : getYoloExecutionOrder();
};
