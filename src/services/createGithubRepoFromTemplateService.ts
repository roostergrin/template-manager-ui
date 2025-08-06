import apiClient from "./apiService";
import { CreateRepoRequest, CreateRepoResponse } from "../types/APIServiceTypes";

const createGithubRepoFromTemplateService = async (request: CreateRepoRequest): Promise<CreateRepoResponse> => {
  return await apiClient.post<CreateRepoResponse>("/create-github-repo-from-template/", request);
};
export default createGithubRepoFromTemplateService; 