import apiClient from "./apiService";
import { CreateDistributionRequest, CreateDistributionResponse } from "../types/APIServiceTypes";

const createDistributionService = async (request: CreateDistributionRequest): Promise<CreateDistributionResponse> => {
  return await apiClient.post<CreateDistributionResponse>("/create-distribution/", request);
};

export default createDistributionService;

