import apiClient from "./apiService";
import { SiteProvision, SiteProvisionResponse } from "../types/APIServiceTypes";

const provisionSite = async (request: SiteProvision): Promise<SiteProvisionResponse> => {
  return await apiClient.post<SiteProvisionResponse>("/provision/", request);
};

export default provisionSite; 