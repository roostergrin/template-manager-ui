import apiClient from "./apiService";
import { CreatePleskSubscriptionRequest, CreatePleskSubscriptionResponse } from "../types/APIServiceTypes";

const createPleskSubscriptionService = async (request: CreatePleskSubscriptionRequest): Promise<CreatePleskSubscriptionResponse> => {
  return await apiClient.post<CreatePleskSubscriptionResponse>("/create-subscription-with-htaccess/", request);
};

export default createPleskSubscriptionService;
