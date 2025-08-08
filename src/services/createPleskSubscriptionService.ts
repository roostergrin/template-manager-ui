import apiClient from "./apiService";
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from "../types/APIServiceTypes";

const createPleskSubscription = async (
  request: CreateSubscriptionRequest
): Promise<CreateSubscriptionResponse> => {
  return await apiClient.post<CreateSubscriptionResponse>(
    "/create-subscription",
    request
  );
};

export default createPleskSubscription;


