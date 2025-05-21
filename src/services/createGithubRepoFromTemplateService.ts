import api from "./apiService";
import { CreateRepoRequest, CreateRepoResponse } from "../types/APIServiceTypes";

const createGithubRepoFromTemplateService = async (request: CreateRepoRequest): Promise<CreateRepoResponse> => {
  const res = await api.post("/create-github-repo-from-template/", request);
  if (!res.data) {
    throw new Error("Failed to create repo from template");
  }
  return res.data;
};
export default createGithubRepoFromTemplateService; 