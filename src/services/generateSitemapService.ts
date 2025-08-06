import apiClient from './apiService';
import { GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';

const generateSitemapService = async (data: GenerateSitemapRequest): Promise<GenerateSitemapResponse> => {
  return await apiClient.post<GenerateSitemapResponse>('/generate-sitemap/', data);
};

export default generateSitemapService; 