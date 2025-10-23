import apiClient from "./apiService";
import { CreateCodePipelineRequest, CreateCodePipelineResponse } from "../types/APIServiceTypes";

const createCodePipelineService = async (request: CreateCodePipelineRequest): Promise<CreateCodePipelineResponse> => {
  return await apiClient.post<CreateCodePipelineResponse>("/create-codepipeline/", request);
};

export default createCodePipelineService;

