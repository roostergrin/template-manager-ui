import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateGlobalResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateGlobalService = async (request: GenerateContentRequest): Promise<GenerateGlobalResponse> => {
  console.log("📤 generateGlobalService - Sending request:", request);
  const res = await api.post("/generate-global/", request);
  console.log("📥 generateGlobalService - Received response:", res);
  console.log("🌐 generateGlobalService - Response data:", res?.data);
  if (!res?.data) {
    console.error("❌ generateGlobalService - No data in response");
    throw new Error("Failed to generate global data");
  }
  console.log("✅ generateGlobalService - Returning data:", res.data);
  return res.data;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateGlobalQueryFunction: QueryFunction<GenerateGlobalResponse, ["generate-global", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateGlobalService(request);
};

export default generateGlobalService;
export { generateGlobalQueryFunction }; 