import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { GenerateContentRequest, GenerateGlobalResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateGlobalService = async (request: GenerateContentRequest): Promise<GenerateGlobalResponse> => {
  console.log("📤 generateGlobalService - Sending request:", request);
  const response = await apiClient.post<GenerateGlobalResponse>("/generate-global/", request);
  console.log("✅ generateGlobalService - Global data generated successfully");
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateGlobalQueryFunction: QueryFunction<GenerateGlobalResponse, ["generate-global", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateGlobalService(request);
};

export default generateGlobalService;
export { generateGlobalQueryFunction }; 