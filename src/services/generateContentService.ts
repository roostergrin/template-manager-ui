import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

const generateContentService: QueryFunction<GenerateContentResponse, ["generate-content", GenerateContentRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  console.log("generateContentService", request);
  const res = await api.post("/generate-content/", request);
  if (!res?.data) {
    throw new Error("Failed to generate content");
  }
  return res.data;
};
export default generateContentService; 