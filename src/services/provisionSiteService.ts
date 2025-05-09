import api from "./apiService";
import { SiteProvision, SiteProvisionResponse } from "../types/APIServiceTypes";

const provisionSite = async (request: SiteProvision): Promise<SiteProvisionResponse> => {
  const res = await api.post("/provision/", request);
  if (!res.data) throw new Error("No data returned from provision endpoint");
  return res.data;
};

export default provisionSite; 