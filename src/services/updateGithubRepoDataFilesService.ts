import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";
import { UpdateRepoDataRequest, UpdateRepoDataResponse } from "../types/APIServiceTypes";

// For useMutation - plain async function
const updateGithubRepoDataFilesService = async (request: UpdateRepoDataRequest): Promise<UpdateRepoDataResponse> => {
  return await apiClient.post<UpdateRepoDataResponse>("/update-github-repo-data-files/", request);
};

// For useQuery - QueryFunction that extracts request from queryKey
const updateGithubRepoDataFilesQueryFunction: QueryFunction<UpdateRepoDataResponse, ["update-github-repo-data-files", UpdateRepoDataRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return updateGithubRepoDataFilesService(request);
};
export default updateGithubRepoDataFilesService;
export { updateGithubRepoDataFilesQueryFunction }; 