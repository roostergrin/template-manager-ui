import apiClient from "./apiService";
import { CreateCodePipelineRequest, CreateCodePipelineResponse } from "../types/APIServiceTypes";

const createCodePipeline = async (request: CreateCodePipelineRequest): Promise<CreateCodePipelineResponse> => {
  return await apiClient.post<CreateCodePipelineResponse>("/create-codepipeline/", request);
};

export default createCodePipeline;
