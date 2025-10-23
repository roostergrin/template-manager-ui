import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

/**
 * Generate content for scraped/migrated websites with intelligent image handling.
 *
 * This service calls the /generate-content-for-scraped/ endpoint which:
 * 1. Preserves existing valid images in generated components
 * 2. Uses images from allocated_markdown (scraped from source website)
 * 3. Falls back to Adobe Stock search only when no valid images are available
 *
 * This differs from standard generateContentService which always uses Adobe Stock.
 */
const generateContentForScrapedService = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  console.log("📤 generateContentForScrapedService - Sending request:", request);
  console.log("   🎯 Using /generate-content-for-scraped/ endpoint (preserves scraped images)");
  const response = await apiClient.post<GenerateContentResponse>("/generate-content-for-scraped/", request);
  console.log("✅ generateContentForScrapedService - Content generated successfully with image preservation");
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateContentForScrapedQueryFunction: QueryFunction<GenerateContentResponse, ["generate-content-for-scraped", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateContentForScrapedService(request);
};

export default generateContentForScrapedService;
export { generateContentForScrapedQueryFunction };
