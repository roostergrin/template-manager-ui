import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateGlobalResponse } from "../types/APIServiceTypes";

const generateGlobalService: QueryFunction<GenerateGlobalResponse, ["generate-global", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  console.log("generateGlobalService", request);
  const res = await api.post("/generate-global/", request);
  if (!res?.data) {
    throw new Error("Failed to generate global data");
  }
  return res.data;
};
export default generateGlobalService; 