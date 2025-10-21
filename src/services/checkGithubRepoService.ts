import apiClient from "./apiService";
import { CheckGithubRepoRequest, CheckGithubRepoResponse } from "../types/APIServiceTypes";

const checkGithubRepoService = async (request: CheckGithubRepoRequest): Promise<CheckGithubRepoResponse> => {
  return await apiClient.post<CheckGithubRepoResponse>("/check-github-repo/", request);
};

export default checkGithubRepoService;

