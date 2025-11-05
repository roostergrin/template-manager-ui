// Questionnaire Data Types
export interface QuestionnaireData {
  siteName?: string;
  siteDescription?: string;
  primaryColors?: string[];
  secondaryColors?: string[];
  fonts?: string[];
  style?: string;
  targetAudience?: string;
  businessGoals?: string[];
  additionalFeatures?: string[];
  [key: string]: unknown;
}

// Page Types
export interface PageData {
  id: string;
  title: string;
  slug: string;
  content?: string;
  template?: string;
  sections?: Record<string, unknown>;
  metadata?: {
    description?: string;
    keywords?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SitemapData {
  pages: unknown; // Accepts various page structures from UI
  questionnaireData: QuestionnaireData;
}

// API Request/Response Types
export interface GenerateContentRequest {
  sitemap_data: SitemapData;
  site_type: string;
  assign_images: boolean;
}

export interface GenerateContentResponse {
  // Flexible response; keys are page identifiers
  [key: string]: unknown;
}

export interface GenerateGlobalResponse {
  global_data: {
    site_settings?: Record<string, unknown>;
    theme_config?: Record<string, unknown>;
    navigation?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface UpdateRepoDataRequest {
  owner: string;
  repo: string;
  pages_data: Record<string, unknown>;
  global_data: Record<string, unknown>;
}

export interface UpdateRepoDataResponse {
  success: boolean;
  message?: string;
}

// Single File Update Types
export interface UpdateGithubRepoFileRequest {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message?: string;
  branch?: string;
  sha?: string; // Required if updating existing file
}

export interface UpdateGithubRepoFileResponse {
  success: boolean;
  message?: string;
  commit?: {
    sha: string;
    url: string;
  };
  content?: {
    sha: string;
    download_url: string;
  };
}

// File Upload Types
export interface UpdateGithubRepoFileUploadRequest {
  owner: string;
  repo: string;
  path: string;
  upload_file: File;
  message?: string;
  branch?: string;
  sha?: string; // Required if updating existing file
}

export interface UpdateGithubRepoFileUploadResponse {
  success: boolean;
  message?: string;
  commit?: {
    sha: string;
    url: string;
  };
  content?: {
    sha: string;
    download_url: string;
  };
}

// Router Generation Types
export interface GenerateRouterRequest {
  wordpress_api_url: string;
  site_type: 'stinson' | 'haightashbury' | 'bayarea' | 'calistoga';
}

export interface GenerateRouterResponse {
  success: boolean;
  message?: string;
  router_entries?: Array<{
    name: string;
    path: string;
    navigation: boolean;
    children?: Array<{
      name: string;
      hash: string;
    }>;
  }>;
  router_string?: string;
  export_format?: string;
  total_pages?: number;
  navigation_pages?: number;
  footer_pages?: number;
}

export interface CreateRepoRequest {
  new_name: string;
  template_repo: string;
}

export interface CreateRepoResponse {
  owner: string;
  repo: string;
  full_name: string;
}

export interface SiteProvision {
  bucket_name: string;
  github_owner: string;
  github_repo: string;
  github_branch: string;
  page_type: "template" | "landing";
  enable_redirect?: boolean;
  redirect_source_domain?: string;
  redirect_target_domain?: string;
}

// Base API Response Types
export interface APIError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface APIResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  error?: APIError;
}

// Site Provision Types
export interface SiteProvisionResponse {
  success: boolean;
  site_url?: string;
  deployment_id?: string;
  bucket_name?: string;
  message?: string;
  error?: APIError;
  // Optional CloudFront URLs returned by backend
  cloudfront_distribution_url?: string;
  assets_distribution_url?: string;
} 

// Plesk / WordPress Provisioning Types
export interface CreateSubscriptionRequest {
  plesk_ip: string;
  domain: string;
  subdomain: string;
}

export interface CreateSubscriptionResponse {
  success?: boolean;
  domain?: string;
  subdomain?: string;
  credentials?: Record<string, string>;
  // Allow additional fields returned by the backend
  [key: string]: unknown;
}

// Copy Plesk Subscription Types
export interface CopySubscriptionRequest {
  source_domain: string;
  target_domain: string;
  server: string; // e.g., "default" | "sunset" | "uluwatu"
  subdomain: string;
  copy_files: boolean;
  copy_databases: boolean;
  update_config_files: boolean;
}

export interface CopySubscriptionResponse {
  success?: boolean;
  source_domain?: string;
  target_domain?: string;
  subdomain?: string;
  credentials?: Record<string, unknown>;
  target_credentials?: Record<string, unknown>;
  operations?: Record<string, unknown>;
  errors?: string[];
  message?: string;
  [key: string]: unknown;
}
