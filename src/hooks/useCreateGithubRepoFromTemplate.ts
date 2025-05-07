import { useMutation, QueryStatus } from "@tanstack/react-query";
import createGithubRepoFromTemplateService from "../services/createGithubRepoFromTemplateService";
import { CreateRepoRequest, CreateRepoResponse } from "../types/APIServiceTypes";

const useCreateGithubRepoFromTemplate = () => {
  const mutation = useMutation<CreateRepoResponse, Error, CreateRepoRequest>({
    mutationFn: createGithubRepoFromTemplateService
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [CreateRepoResponse | undefined, QueryStatus, (request: CreateRepoRequest) => Promise<CreateRepoResponse>];
};
export default useCreateGithubRepoFromTemplate; 