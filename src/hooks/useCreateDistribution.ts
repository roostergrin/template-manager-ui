import { useMutation, MutationStatus } from "@tanstack/react-query";
import createDistribution from "../services/createDistributionService";
import { CreateDistributionRequest, CreateDistributionResponse } from "../types/APIServiceTypes";

const useCreateDistribution = () => {
  const mutation = useMutation<CreateDistributionResponse, Error, CreateDistributionRequest>({
    mutationFn: createDistribution,
  });
  return [mutation.data, mutation.status, mutation.mutateAsync] as [CreateDistributionResponse | undefined, MutationStatus, (req: CreateDistributionRequest) => Promise<CreateDistributionResponse>];
};

export default useCreateDistribution;
