import { useMutation, UseMutationResult } from "@tanstack/react-query";
import createPleskSubscriptionService from "../services/createPleskSubscriptionService";
import { CreatePleskSubscriptionRequest, CreatePleskSubscriptionResponse } from "../types/APIServiceTypes";

const useCreatePleskSubscription = (): UseMutationResult<CreatePleskSubscriptionResponse, Error, CreatePleskSubscriptionRequest> => {
  return useMutation<CreatePleskSubscriptionResponse, Error, CreatePleskSubscriptionRequest>({
    mutationFn: createPleskSubscriptionService,
  });
};

export default useCreatePleskSubscription;
