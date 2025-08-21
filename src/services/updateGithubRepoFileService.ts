import apiClient from "./apiService";
import { UpdateGithubRepoFileRequest, UpdateGithubRepoFileResponse } from "../types/APIServiceTypes";

// Service for updating a single file in a GitHub repository
const updateGithubRepoFileService = async (request: UpdateGithubRepoFileRequest): Promise<UpdateGithubRepoFileResponse> => {
  const response = await apiClient.post<UpdateGithubRepoFileResponse>("/update-github-repo-file", request);
  
  if (!response.data) {
    throw new Error('Failed to update GitHub repository file');
  }
  
  return response.data;
};

export default updateGithubRepoFileService;
