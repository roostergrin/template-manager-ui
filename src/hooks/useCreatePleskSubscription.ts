import { useMutation, MutationStatus } from "@tanstack/react-query";
import createPleskSubscription from "../services/createPleskSubscriptionService";
import {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CopySubscriptionRequest,
  CopySubscriptionResponse,
} from "../types/APIServiceTypes";
import { copySubscription } from "../services/pleskAdminService";

const useCreatePleskSubscription = () => {
  const mutation = useMutation<
    CreateSubscriptionResponse,
    Error,
    CreateSubscriptionRequest
  >({
    mutationFn: createPleskSubscription,
  });

  const copyMutation = useMutation<
    CopySubscriptionResponse,
    Error,
    CopySubscriptionRequest
  >({
    mutationFn: copySubscription,
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutateAsync,
    mutation.error,
    // copy subscription controls
    copyMutation.data,
    copyMutation.status,
    copyMutation.mutateAsync,
    copyMutation.error,
  ] as [
    CreateSubscriptionResponse | undefined,
    MutationStatus,
    (req: CreateSubscriptionRequest) => Promise<CreateSubscriptionResponse>,
    Error | null,
    CopySubscriptionResponse | undefined,
    MutationStatus,
    (req: CopySubscriptionRequest) => Promise<CopySubscriptionResponse>,
    Error | null
  ];
};

export default useCreatePleskSubscription;


