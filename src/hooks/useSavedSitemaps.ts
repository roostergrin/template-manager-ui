import { useQuery } from '@tanstack/react-query';
import { listSavedSitemaps, getSavedSitemap, SavedSitemapMeta } from '../services/sitemapHistoryService';

/**
 * Hook for fetching the list of saved sitemaps from the backend
 */
export const useSavedSitemaps = () => {
  return useQuery<SavedSitemapMeta[]>({
    queryKey: ['saved-sitemaps'],
    queryFn: listSavedSitemaps,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching a specific sitemap by filename
 */
export const useSavedSitemap = (filename: string | null) => {
  return useQuery<unknown>({
    queryKey: ['saved-sitemap', filename],
    queryFn: () => getSavedSitemap(filename!),
    enabled: !!filename, // Only run when filename is provided
    staleTime: 60000, // Consider data fresh for 1 minute
  });
};

export default useSavedSitemaps;
