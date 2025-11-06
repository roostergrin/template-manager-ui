import { useMutation, MutationStatus } from "@tanstack/react-query";
import createS3Bucket from "../services/createS3BucketService";
import { CreateS3BucketRequest, CreateS3BucketResponse } from "../types/APIServiceTypes";

const useCreateS3Bucket = () => {
  const mutation = useMutation<CreateS3BucketResponse, Error, CreateS3BucketRequest>({
    mutationFn: createS3Bucket,
  });
  return [mutation.data, mutation.status, mutation.mutateAsync] as [CreateS3BucketResponse | undefined, MutationStatus, (req: CreateS3BucketRequest) => Promise<CreateS3BucketResponse>];
};

export default useCreateS3Bucket;
