import { useMutation, MutationStatus } from "@tanstack/react-query";
import createCodePipeline from "../services/createCodePipelineService";
import { CreateCodePipelineRequest, CreateCodePipelineResponse } from "../types/APIServiceTypes";

const useCreateCodePipeline = () => {
  const mutation = useMutation<CreateCodePipelineResponse, Error, CreateCodePipelineRequest>({
    mutationFn: createCodePipeline,
  });
  return [mutation.data, mutation.status, mutation.mutateAsync] as [CreateCodePipelineResponse | undefined, MutationStatus, (req: CreateCodePipelineRequest) => Promise<CreateCodePipelineResponse>];
};

export default useCreateCodePipeline;
