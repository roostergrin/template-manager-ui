import { useMutation, UseMutationResult } from "@tanstack/react-query";
import createCodePipelineService from "../services/createCodePipelineService";
import { CreateCodePipelineRequest, CreateCodePipelineResponse } from "../types/APIServiceTypes";

const useCreateCodePipeline = (): UseMutationResult<CreateCodePipelineResponse, Error, CreateCodePipelineRequest> => {
  return useMutation<CreateCodePipelineResponse, Error, CreateCodePipelineRequest>({
    mutationFn: createCodePipelineService,
  });
};

export default useCreateCodePipeline;

