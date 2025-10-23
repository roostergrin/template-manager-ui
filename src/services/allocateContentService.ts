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

export default allocateContentService;
