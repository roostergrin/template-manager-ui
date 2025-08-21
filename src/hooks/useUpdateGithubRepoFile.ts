import { useMutation, QueryStatus } from "@tanstack/react-query";
import updateGithubRepoFileService from "../services/updateGithubRepoFileService";
import { UpdateGithubRepoFileRequest, UpdateGithubRepoFileResponse } from "../types/APIServiceTypes";

const useUpdateGithubRepoFile = () => {
  const mutation = useMutation<UpdateGithubRepoFileResponse, Error, UpdateGithubRepoFileRequest>({
    mutationFn: (request) => updateGithubRepoFileService(request)
  });
  
  return [
    mutation.data, 
    mutation.status as QueryStatus, 
    mutation.mutateAsync
  ] as [
    UpdateGithubRepoFileResponse | undefined, 
    QueryStatus, 
    (request: UpdateGithubRepoFileRequest) => Promise<UpdateGithubRepoFileResponse>
  ];
};

export default useUpdateGithubRepoFile;
