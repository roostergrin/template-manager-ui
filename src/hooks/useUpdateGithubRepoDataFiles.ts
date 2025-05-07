import { useMutation, QueryStatus } from "@tanstack/react-query";
import updateGithubRepoDataFilesService from "../services/updateGithubRepoDataFilesService";
import { UpdateRepoDataRequest, UpdateRepoDataResponse } from "../types/APIServiceTypes";

const useUpdateGithubRepoDataFiles = () => {
  const mutation = useMutation<UpdateRepoDataResponse, Error, UpdateRepoDataRequest>({
    mutationFn: (request) => updateGithubRepoDataFilesService({ queryKey: ["update-github-repo-data-files", request] })
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [UpdateRepoDataResponse | undefined, QueryStatus, (request: UpdateRepoDataRequest) => Promise<UpdateRepoDataResponse>];
};
export default useUpdateGithubRepoDataFiles; 