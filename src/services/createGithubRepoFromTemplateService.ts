import { QueryFunction } from "@tanstack/react-query";
import api from "./apiService";
import { CreateRepoRequest, CreateRepoResponse } from "../types/APIServiceTypes";

const createGithubRepoFromTemplateService: QueryFunction<CreateRepoResponse, ["create-github-repo-from-template", CreateRepoRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  const res = await api.post("/create-github-repo-from-template/", request);
  if (!res.data) {
    throw new Error("Failed to create repo from template");
  }
  return res.data;
};
export default createGithubRepoFromTemplateService; 