import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateGlobalResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const generateGlobalService = async (request: GenerateContentRequest): Promise<GenerateGlobalResponse> => {
  console.log("generateGlobalService", request);
  const res = await api.post("/generate-global/", request);
  if (!res?.data) {
    throw new Error("Failed to generate global data");
  }
  return res.data;
};

// For useQuery - QueryFunction that extracts request from queryKey
const generateGlobalQueryFunction: QueryFunction<GenerateGlobalResponse, ["generate-global", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return generateGlobalService(request);
};

export default generateGlobalService;
export { generateGlobalQueryFunction }; 