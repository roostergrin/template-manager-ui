import { useMutation, UseMutationResult } from "@tanstack/react-query";
import createS3BucketService from "../services/createS3BucketService";
import { CreateS3BucketRequest, CreateS3BucketResponse } from "../types/APIServiceTypes";

const useCreateS3Bucket = (): UseMutationResult<CreateS3BucketResponse, Error, CreateS3BucketRequest> => {
  return useMutation<CreateS3BucketResponse, Error, CreateS3BucketRequest>({
    mutationFn: createS3BucketService,
  });
};

export default useCreateS3Bucket;

