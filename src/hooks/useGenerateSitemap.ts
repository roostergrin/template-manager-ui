import { useMutation, MutationStatus } from '@tanstack/react-query';
import generateSitemapService from '../services/generateSitemapService';
import { GenerateSitemapRequest, GenerateSitemapResponse } from '../types/SitemapTypes';

const useGenerateSitemap = () => {
  const mutation = useMutation<GenerateSitemapResponse, unknown, GenerateSitemapRequest>({
    mutationFn: generateSitemapService,
    retry: false,
    onSuccess: (data) => {
      console.log('Sitemap generated successfully:', data);
    },
    onError: (error) => {
      console.error('Error generating sitemap:', error);
    },
  });
  return [mutation.data, mutation.status, mutation.mutate] as [GenerateSitemapResponse | undefined, MutationStatus, (data: GenerateSitemapRequest) => void];
};

export default useGenerateSitemap; 