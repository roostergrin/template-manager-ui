import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

// Service for generating content for a single page
const generatePageContentService = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  console.log("📤 generatePageContentService - Sending request for single page:", request);
  const response = await apiClient.post<GenerateContentResponse>("/generate-content/", request);
  console.log("✅ generatePageContentService - Page content generated successfully");
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generatePageContentQueryFunction: QueryFunction<GenerateContentResponse, ["generate-page-content", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generatePageContentService(request);
};

export default generatePageContentService;
export { generatePageContentQueryFunction };
