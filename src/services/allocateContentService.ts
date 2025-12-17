import apiClient from './apiService';

export interface AllocateContentRequest {
  sitemap: any;
  scraped_content: any;
  site_type: string;
}

export interface AllocateContentResponse {
  success: boolean;
  enhanced_sitemap: any;
  allocation_summary: {
    total_pages: number;
    allocated_pages: number;
    failed_pages: number;
    allocation_rate: number;
    average_confidence: number;
    total_content_length: number;
    total_images: number;
    page_metadata: Array<{
      page_key: string;
      page_title: string;
      allocated: boolean;
      content_length: number;
      image_count: number;
      confidence: number;
      error?: string;
    }>;
  };
  message?: string;
}

const allocateContentService = async (data: AllocateContentRequest): Promise<AllocateContentResponse> => {
  return await apiClient.post<AllocateContentResponse>('/allocate-content-to-sitemap/', data);
};

// First Pass - Suggest Sections (model_query_pairs)
export interface FirstPassAllocationRequest {
  sitemap: Record<string, any>;
  vector_store_id: string;
  site_type: string;
}

export interface FirstPassAllocationResponse {
  success: boolean;
  enhanced_sitemap: Record<string, any>;
  summary: {
    total_pages: number;
    pages_with_content: number;
    pages_without_content: number;
    total_sections_suggested: number;
    average_sections_per_page: number;
  };
  message?: string;
}

export const firstPassAllocationService = async (
  data: FirstPassAllocationRequest
): Promise<FirstPassAllocationResponse> => {
  return await apiClient.post<FirstPassAllocationResponse>('/allocate-content-first-pass/', data);
};

// Second Pass - Allocate Markdown
export interface SecondPassAllocationRequest {
  sitemap: Record<string, any>;
  vector_store_id: string;
  site_type: string;
}

export interface SecondPassAllocationResponse {
  success: boolean;
  enhanced_sitemap: Record<string, any>;
  summary: {
    total_pages: number;
    allocated_pages: number;
    pages_without_content: number;
    total_content_length: number;
    average_content_per_page: number;
  };
  message?: string;
}

export const secondPassAllocationService = async (
  data: SecondPassAllocationRequest
): Promise<SecondPassAllocationResponse> => {
  return await apiClient.post<SecondPassAllocationResponse>('/allocate-content-second-pass/', data);
};

export default allocateContentService;
