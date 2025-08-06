import apiClient from "./apiService";

export interface WordPressConfig {
  api_url: string;
  username: string;
  password: string;
}

export interface WordPressUpdateData {
  wordpress_config: WordPressConfig;
  data: Record<string, unknown>;
}

export interface WordPressPageResult {
  page_id: string | number;
  success: boolean;
  message?: string;
  created_new_page?: boolean;
  new_page_id?: number;
}

export interface WordPressUpdateResponse {
  success: boolean;
  total_pages: number;
  successful_updates: number;
  failed_updates: number;
  results: WordPressPageResult[];
  message?: string;
}

export const updateWordPressService = async (data: WordPressUpdateData): Promise<WordPressUpdateResponse> => {
  console.log('📝 Sending WordPress update request...');
  return await apiClient.post<WordPressUpdateResponse>("/update-wordpress/", data);
};

 