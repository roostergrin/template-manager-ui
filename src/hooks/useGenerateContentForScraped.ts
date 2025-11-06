import { useMutation, QueryStatus } from "@tanstack/react-query";
import generateContentForScrapedService from "../services/generateContentForScrapedService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

/**
 * Hook for generating content from scraped/migrated websites.
 *
 * This hook uses the /generate-content-for-scraped/ endpoint which:
 * 1. Preserves existing valid images from scraped content
 * 2. Uses images extracted from allocated_markdown
 * 3. Falls back to Adobe Stock only when necessary
 *
 * Use this hook in the Migration Wizard instead of useGenerateContent.
 */
const useGenerateContentForScraped = () => {
  const mutation = useMutation<GenerateContentResponse, Error, GenerateContentRequest>({
    mutationFn: generateContentForScrapedService,
    retry: false,
    onSuccess: (data) => {
      console.log('✅ Scraped content generated successfully with image preservation:', data);
    },
    onError: (error) => {
      console.error('❌ Error generating scraped content:', error);
    },
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [GenerateContentResponse | undefined, QueryStatus, (request: GenerateContentRequest) => Promise<GenerateContentResponse>];
};

export default useGenerateContentForScraped;
