import { useMutation, UseMutationResult } from "@tanstack/react-query";
import checkGithubRepoService from "../services/checkGithubRepoService";
import { CheckGithubRepoRequest, CheckGithubRepoResponse } from "../types/APIServiceTypes";

const useCheckGithubRepo = (): UseMutationResult<CheckGithubRepoResponse, Error, CheckGithubRepoRequest> => {
  return useMutation<CheckGithubRepoResponse, Error, CheckGithubRepoRequest>({
    mutationFn: checkGithubRepoService,
  });
};

export default useCheckGithubRepo;

