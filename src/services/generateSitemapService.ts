import apiClient from './apiService';
import {
  GenerateSitemapRequest,
  GenerateSitemapResponse,
  isScrapedRequest,
} from '../types/SitemapTypes';

const generateSitemapService = async (data: GenerateSitemapRequest): Promise<GenerateSitemapResponse> => {
  // Route to appropriate endpoint based on request structure
  const endpoint = isScrapedRequest(data)
    ? '/generate-sitemap-from-scraped/'
    : '/generate-sitemap/';

  console.log(`🔀 Routing to ${endpoint} based on request type`);

  return await apiClient.post<GenerateSitemapResponse>(endpoint, data);
};

export default generateSitemapService; 