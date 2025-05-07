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