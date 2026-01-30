import apiClient from './apiService';

/**
 * Metadata for a saved sitemap file on the backend
 */
export interface SavedSitemapMeta {
  filename: string;
  name: string;
  created: string;
}

/**
 * Response from /list-sitemaps/ endpoint
 */
interface ListSitemapsResponse {
  sitemaps: SavedSitemapMeta[];
}

/**
 * Fetch list of all saved sitemaps from the backend folder
 */
export const listSavedSitemaps = async (): Promise<SavedSitemapMeta[]> => {
  const response = await apiClient.get<ListSitemapsResponse>('/list-sitemaps/');
  return response.sitemaps;
};

/**
 * Fetch a specific sitemap's full data by filename
 */
export const getSavedSitemap = async (filename: string): Promise<unknown> => {
  const response = await apiClient.get<unknown>(`/get-sitemap/${encodeURIComponent(filename)}`);
  return response;
};

export default {
  listSavedSitemaps,
  getSavedSitemap,
};
