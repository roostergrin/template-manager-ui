// Unified Workflow Types

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';

// Logging types for detailed step tracking
export type StepLogPhase = 'start' | 'api_request' | 'api_response' | 'processing' | 'complete' | 'error';

export interface StepLogDetails {
  phase: StepLogPhase;
  endpoint?: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export type WorkflowMode = 'manual' | 'yolo' | 'batch';

export type WorkflowPhase = 'infrastructure' | 'planning' | 'deployment';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  phase: WorkflowPhase;
  status: WorkflowStepStatus;
  dependencies: string[];
  estimatedDurationSeconds: number;
  actualDurationSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
  isOptional?: boolean;
}

export type TemplateType = 'json' | 'wordpress';

// Deployment target: 'production' uses AWS (S3/CloudFront/CodePipeline), 'demo' uses Cloudflare Pages
export type DeploymentTarget = 'production' | 'demo';

export interface SiteConfig {
  domain: string;
  template: string;
  templateType: TemplateType; // 'json' for ai-template-*, 'wordpress' for rg-template-*
  siteType: string;
  scrapeDomain?: string;
  preserveDoctorPhotos: boolean;
  enableImagePicker: boolean;
  enableHotlinking: boolean;
  wordpressApiUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  // Deployment target - controls whether to use AWS or Cloudflare Pages
  deploymentTarget?: DeploymentTarget;
}

export interface BatchSiteEntry {
  domain: string;
  template: string;
  siteType: string;
  scrapeDomain?: string;
}

export interface BatchConfig {
  sites: BatchSiteEntry[];
  currentIndex: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  failedSites: Array<{
    site: BatchSiteEntry;
    error: string;
  }>;
  skippedSites: Array<{
    site: BatchSiteEntry;
    reason: string;
  }>;
}

export interface WorkflowProgressEvent {
  id: string;
  stepId: string;
  stepName: string;
  status: WorkflowStepStatus;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface UnifiedWorkflowConfig {
  mode: WorkflowMode;
  siteConfig: SiteConfig;
  batchConfig?: BatchConfig;
  autoStartOnLoad?: boolean;
  stopOnError?: boolean;
}

export interface UnifiedWorkflowState {
  // Workflow configuration
  config: UnifiedWorkflowConfig;

  // Steps state
  steps: WorkflowStep[];
  currentStepId: string | null;

  // Execution state
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;

  // Intervention mode state
  interventionMode: boolean;        // When true, pause after each step for inspection
  pendingIntervention: string | null;  // Step ID waiting for user action

  // Pre-step input editing state
  preStepPauseEnabled: boolean;     // When true, pause before editable steps to allow input editing
  pendingPreStepInput: string | null;  // Step ID waiting for input confirmation
  editedInputData: Record<string, unknown>;  // Temporary storage for edited inputs by step ID

  // Session logging
  sessionLog: SessionLogEntry[];

  // Progress events (activity log)
  progressEvents: WorkflowProgressEvent[];

  // Generated data from steps
  generatedData: {
    githubRepoResult?: unknown;
    wordpressBackendResult?: unknown;
    provisionResult?: unknown;
    scrapeResult?: unknown;
    vectorStoreResult?: VectorStoreResult;
    sitemapResult?: unknown;
    allocatedSitemap?: AllocatedSitemapResult;
    allocationSummary?: AllocationSummary;
    contentResult?: unknown;
    themeResult?: unknown;
    imagePickerResult?: unknown;
    hotlinkResult?: HotlinkProtectionResult;
    hotlinkPagesResult?: Record<string, unknown>;
    hotlinkThemeResult?: Record<string, unknown>;
    hotlinkGlobalDataResult?: Record<string, unknown>;
    wordpressResult?: unknown;
    secondPassResult?: unknown;
    logoResult?: unknown;
    faviconResult?: unknown;
    // Demo site (Cloudflare Pages) results
    demoRepoResult?: CreateDemoRepoResult;
    cloudflarePagesResult?: ProvisionCloudflarePageResult;
    demoSiteResult?: ProvisionDemoSiteResult;
  };

  // Error state
  lastError?: string;
}

export interface UnifiedWorkflowActions {
  // Mode management
  setMode: (mode: WorkflowMode) => void;

  // Configuration
  setSiteConfig: (config: Partial<SiteConfig>) => void;
  setBatchConfig: (config: BatchConfig) => void;

  // Step management
  setStepStatus: (stepId: string, status: WorkflowStepStatus, result?: unknown, error?: string) => void;
  setCurrentStep: (stepId: string | null) => void;

  // Workflow control
  startWorkflow: () => void;
  pauseWorkflow: () => void;
  resumeWorkflow: () => void;
  stopWorkflow: () => void;
  resetWorkflow: () => void;

  // Step control
  runStep: (stepId: string) => Promise<void>;
  retryStep: (stepId: string) => Promise<void>;
  skipStep: (stepId: string) => void;
  enableStep: (stepId: string) => void;

  // Intervention control
  setInterventionMode: (enabled: boolean) => void;
  setPendingIntervention: (stepId: string | null) => void;
  confirmStepAndContinue: () => void;
  modifyStepResult: (stepId: string, data: unknown) => void;

  // Pre-step input editing
  setPreStepPauseEnabled: (enabled: boolean) => void;
  setPendingPreStepInput: (stepId: string | null) => void;
  setEditedInputData: (stepId: string, data: unknown) => void;
  confirmInputAndContinue: () => void;
  clearEditedInputData: () => void;

  // Session logging
  addSessionLogEntry: (entry: Omit<SessionLogEntry, 'timestamp'>) => void;
  clearSessionLog: () => void;

  // Progress events
  addProgressEvent: (event: Omit<WorkflowProgressEvent, 'id' | 'timestamp'>) => void;
  clearProgressEvents: () => void;

  // Data management
  setGeneratedData: (key: keyof UnifiedWorkflowState['generatedData'], data: unknown) => void;
  clearGeneratedData: () => void;

  // Utility
  getNextStep: () => WorkflowStep | null;
  canRunStep: (stepId: string) => boolean;
  getProgress: () => { completed: number; total: number; percentage: number };
}

export interface UnifiedWorkflowContextValue {
  state: UnifiedWorkflowState;
  actions: UnifiedWorkflowActions;
  sessionId: string;
  openNewSession: () => void;
}

// Step result types for each workflow step
export interface CreateGithubRepoResult {
  success: boolean;
  owner?: string;
  repo?: string;
  full_name?: string;
  html_url?: string;
  message?: string;
}

export interface ProvisionWordPressBackendResult {
  success: boolean;
  source_domain?: string;
  target_domain?: string;
  subdomain?: string;
  credentials?: {
    ftp?: { username: string; password: string };
    database?: { username: string; password: string };
  };
  operations?: Record<string, unknown>;
  errors?: string[];
  message?: string;
}

export interface ProvisionStepResult {
  success?: boolean;
  bucket?: string;
  cloudfront_distribution_id?: string;
  cloudfront_distribution_url?: string;
  pipeline_name?: string;
  assets_cdn_domain?: string;
  assets_distribution_id?: string;
  assets_distribution_url?: string;
  redirect_function_arn?: string;
  redirect_function_name?: string;
  redirect_status?: string;
  redirect_type?: string;
  already_existed?: Record<string, boolean>;
  message?: string;
}

export interface ScrapeStepResult {
  success: boolean;
  domain?: string;
  // Real API response structure
  pages?: Record<string, {
    url?: string;
    title?: string;
    content?: string;
    markdown?: string;
    images?: string[];
  }>;
  global_markdown?: string;
  style_overview?: string;
  // Social links extracted from the scraped site
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    yelp?: string;
    google_review?: string;
    pinterest?: string;
    snapchat?: string;
  };
  // Backend returns design_system (snake_case)
  design_system?: unknown;
  // Legacy support for camelCase
  designSystem?: unknown;
}

export interface TemplateSelectionResult {
  template: string;
  templateName: string;
}

export interface SitemapStepResult {
  success: boolean;
  pages?: unknown;
  pageCount?: number;
}

export interface ContentStepResult {
  success: boolean;
  pagesGenerated?: number;
  globalData?: unknown;
  pageData?: Record<string, unknown>;
  pages?: Record<string, unknown>;  // Backend returns 'pages' from /generate-content/
  sitemap_metadata?: Record<string, { depth: number; slug?: string; parent_slug?: string }>;
}

export interface ThemeStepResult {
  success: boolean;
  theme?: unknown;
  themeJson?: string;
}

export interface ImagePickerResult {
  success: boolean;
  imagesUpdated?: number;
  preservedDoctorPhotos?: string[];
  pageData?: Record<string, unknown>;
}

export interface SyncedImage {
  success: boolean;
  original_url: string;
  s3_key: string;
  cloudfront_url: string;
  content_type: string;
}

export interface FailedImage {
  success: boolean;
  original_url: string;
  error: string;
}

export interface HotlinkProtectionResult {
  success: boolean;
  message?: string;
  processed_count: number;
  failed_count: number;
  synced_images: SyncedImage[];
  failed_images: FailedImage[];
  total_found: number;
  cloudfront_domain?: string;
  bucket_name: string;
  // Derived by step runner after URL replacement
  updatedTheme?: Record<string, unknown>;
  updatedPages?: Record<string, unknown>;
  updatedGlobalData?: Record<string, unknown>;
}

export interface WordPressStepResult {
  success: boolean;
  pagesUpdated?: number;
  globalUpdated?: boolean;
}

export interface SecondPassResult {
  success: boolean;
  idsFixed?: number;
  accessibilityFixes?: number;
  imageSizeFixes?: number;
}

export interface LogoUploadResult {
  success: boolean;
  logoUrl?: string;
  headerVariant?: 'dark' | 'light';
}

export interface FaviconUploadResult {
  success: boolean;
  faviconUrl?: string;
}

export interface GithubJsonUploadResult {
  success: boolean;
  pagesJsonUrl?: string;
  globalDataJsonUrl?: string;
  themeJsonUrl?: string;
  skipped?: boolean;
  message?: string;
}

// Demo Site (Cloudflare Pages) result types
export interface CreateDemoRepoResult {
  success: boolean;
  owner?: string;
  repo?: string;
  full_name?: string;
  html_url?: string;
  clone_url?: string;
  message?: string;
  already_existed?: boolean;
}

export interface ProvisionCloudflarePageResult {
  success: boolean;
  project_name?: string;
  subdomain?: string;
  pages_url?: string;
  message?: string;
  already_existed?: boolean;
}

export interface ProvisionDemoSiteResult {
  success: boolean;
  message?: string;
  // GitHub repo details
  repo_owner?: string;
  repo_name?: string;
  repo_url?: string;
  // Cloudflare Pages details
  pages_project_name?: string;
  pages_url?: string;
  // Status flags
  repo_already_existed?: boolean;
  pages_already_existed?: boolean;
}

// Vector Store types
export interface VectorStoreResult {
  success: boolean;
  vector_store_id?: string;
  page_count?: number;
  metadata_path?: string;
}

// Content Allocation types
export interface AllocatedPage {
  page_id: string;
  title: string;
  allocated_markdown: string;
  source_location: string;
  allocation_confidence: number;
  model_query_pairs?: Array<{ model: string; query: string }>;
}

export interface AllocatedSitemapResult {
  pages: Record<string, AllocatedPage>;
}

export interface AllocationSummary {
  total_pages: number;
  allocated_pages: number;
  failed_pages: number;
  allocation_rate: number;
  average_confidence: number;
}

// CSV Parsing types
export interface CSVParseResult {
  success: boolean;
  sites: BatchSiteEntry[];
  errors: string[];
  warnings: string[];
}

// Cleanup/Teardown types
export interface CleanupResources {
  s3Bucket?: string;
  cloudfrontDistributionId?: string;
  assetsCloudfrontDistributionId?: string;
  githubRepo?: string;
  pipelineName?: string;
}

export interface CleanupConfig {
  domain: string;
  resources: CleanupResources;
}

export interface CleanupResult {
  success: boolean;
  deletedResources: string[];
  failedResources: Array<{ resource: string; error: string }>;
}

// Session Log types for tracking workflow execution
export type SessionLogEvent = 'started' | 'completed' | 'error' | 'skipped' | 'input_edited';

export interface SessionLogEntry {
  timestamp: string;
  stepId: string;
  stepName: string;
  event: SessionLogEvent;
  durationMs?: number;
  dataFileRef?: string;  // Reference to generated data key (e.g., "scrapeResult")
  inputModified?: boolean;
}

// Workflow export bundle type
export interface WorkflowExportBundle {
  exportedAt: string;
  domain: string;
  config: UnifiedWorkflowConfig;
  steps: WorkflowStep[];
  generatedData: Record<string, unknown>;
  sessionLog: SessionLogEntry[];
  progressEvents: WorkflowProgressEvent[];
}
