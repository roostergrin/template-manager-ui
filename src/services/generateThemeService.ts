import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { GenerateThemeRequest, GenerateThemeResponse } from "../types/APIServiceTypes";

/**
 * Generate a theme from design system data.
 *
 * This service calls the /generate-theme/ endpoint to create an accessible
 * color palette from scraped design system data. Each color in the response
 * includes a 'source' field indicating whether it came from:
 * - 'website': Found in the scraped brand colors
 * - 'semantic': Identified by AI semantic analysis
 * - 'generated': Generated/adjusted to meet accessibility requirements
 */
const generateThemeService = async (request: GenerateThemeRequest): Promise<GenerateThemeResponse> => {
  console.log("🎨 generateThemeService - Sending request:", request);
  const response = await apiClient.post<GenerateThemeResponse>("/generate-theme/", request);
  console.log("✅ generateThemeService - Theme generated successfully");
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateThemeQueryFunction: QueryFunction<GenerateThemeResponse, ["generate-theme", GenerateThemeRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateThemeService(request);
};

export default generateThemeService;
export { generateThemeQueryFunction };
