export interface GenerateContentRequest {
  sitemap_data: {
    pages: any;
    questionnaireData: any;
  };
  site_type: string;
}

export interface GenerateContentResponse {
  page_data: any;
}

export interface GenerateGlobalResponse {
  global_data: any;
}

export interface UpdateRepoDataRequest {
  owner: string;
  repo: string;
  pages_data: any;
  global_data: any;
}

export interface UpdateRepoDataResponse {
  success: boolean;
}

export interface CreateRepoRequest {
  new_name: string;
  site_type: string;
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
}

export type SiteProvisionResponse = Record<string, any>; // Replace with actual response type if known 