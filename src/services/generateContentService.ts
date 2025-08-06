import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateContentService = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  console.log("📤 generateContentService - Sending request:", request);
  const response = await apiClient.post<GenerateContentResponse>("/generate-content/", request);
  console.log("✅ generateContentService - Content generated successfully");
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateContentQueryFunction: QueryFunction<GenerateContentResponse, ["generate-content", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateContentService(request);
};

export default generateContentService;
export { generateContentQueryFunction }; 