import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { UpdateRepoDataRequest, UpdateRepoDataResponse } from "../types/APIServiceTypes";

const updateGithubRepoDataFilesService: QueryFunction<UpdateRepoDataResponse, ["update-github-repo-data-files", UpdateRepoDataRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  const res = await api.post("/update-github-repo-data-files/", request);
  if (!res?.data) {
    throw new Error("Failed to update GitHub repo data files");
  }
  return res.data;
};
export default updateGithubRepoDataFilesService; 