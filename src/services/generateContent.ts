import apiService from "./apiService";
import { SitemapSection, QuestionnaireData } from "../types/SitemapTypes";

export interface GenerateContentRequest {
  pages: SitemapSection[];
  questionnaireData: QuestionnaireData;
}

export interface GenerateContentResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

const generateContent = async (
  data: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  const res = await apiService.post<GenerateContentResponse>("/generate-content/", data);
  return res;
};

export default generateContent; 