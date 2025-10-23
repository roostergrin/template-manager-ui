import { useMutation, MutationStatus } from "@tanstack/react-query";
import createPleskSubscriptionService from "../services/createPleskSubscriptionService";
import { CreatePleskSubscriptionRequest, CreatePleskSubscriptionResponse } from "../types/APIServiceTypes";

const useCreatePleskSubscription = () => {
  const mutation = useMutation<CreatePleskSubscriptionResponse, Error, CreatePleskSubscriptionRequest>({
    mutationFn: createPleskSubscriptionService,
  });
  
  // Return array format to match existing usage in ProvisionWordPressSection
  // [createResponse, createStatus, createSubscription, createError, copyResponse, copyStatus, copySubscription, copyError]
  return [
    undefined, // createResponse (unused)
    undefined, // createStatus (unused)
    undefined, // createSubscription (unused)
    undefined, // createError (unused)
    mutation.data, // copyResponse
    mutation.status, // copyStatus
    mutation.mutateAsync, // copySubscription
    mutation.error, // copyError
  ] as [
    undefined,
    undefined,
    undefined,
    undefined,
    CreatePleskSubscriptionResponse | undefined,
    MutationStatus,
    (req: CreatePleskSubscriptionRequest) => Promise<CreatePleskSubscriptionResponse>,
    Error | null
  ];
};

export default useCreatePleskSubscription;
