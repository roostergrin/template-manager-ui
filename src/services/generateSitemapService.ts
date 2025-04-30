import api from './apiService';
import { GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';

const generateSitemapService = async (data: GenerateSitemapRequest): Promise<GenerateSitemapResponse> => {
  const response = await api.post<GenerateSitemapResponse>('/generate-sitemap/', data);
  return response.data;
};

export default generateSitemapService; 