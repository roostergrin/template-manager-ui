import { useMutation, UseMutationResult } from "@tanstack/react-query";
import createDistributionService from "../services/createDistributionService";
import { CreateDistributionRequest, CreateDistributionResponse } from "../types/APIServiceTypes";

const useCreateDistribution = (): UseMutationResult<CreateDistributionResponse, Error, CreateDistributionRequest> => {
  return useMutation<CreateDistributionResponse, Error, CreateDistributionRequest>({
    mutationFn: createDistributionService,
  });
};

export default useCreateDistribution;

