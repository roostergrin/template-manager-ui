import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateContentService = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  console.log("generateContentService", request);
  const res = await api.post("/generate-content/", request);
  if (!res?.data) {
    throw new Error("Failed to generate content");
  }
  return res.data;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateContentQueryFunction: QueryFunction<GenerateContentResponse, ["generate-content", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateContentService(request);
};

export default generateContentService;
export { generateContentQueryFunction }; 