import apiClient from "./apiService";
import { CreateS3BucketRequest, CreateS3BucketResponse } from "../types/APIServiceTypes";

const createS3Bucket = async (request: CreateS3BucketRequest): Promise<CreateS3BucketResponse> => {
  return await apiClient.post<CreateS3BucketResponse>("/create-s3-bucket/", request);
};

export default createS3Bucket;
