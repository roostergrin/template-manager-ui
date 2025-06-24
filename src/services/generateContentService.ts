import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateContentService = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  console.log("📤 generateContentService - Sending request:", request);
  const res = await api.post("/generate-content/", request);
  console.log("📥 generateContentService - Received response:", res);
  console.log("📄 generateContentService - Response data:", res?.data);
  if (!res?.data) {
    console.error("❌ generateContentService - No data in response");
    throw new Error("Failed to generate content");
  }
  console.log("✅ generateContentService - Returning data:", res.data);
  return res.data;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateContentQueryFunction: QueryFunction<GenerateContentResponse, ["generate-content", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateContentService(request);
};

export default generateContentService;
export { generateContentQueryFunction }; 