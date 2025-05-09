import { useMutation, MutationStatus } from "@tanstack/react-query";
import provisionSite from "../services/provisionSiteService";
import { SiteProvision, SiteProvisionResponse } from "../types/APIServiceTypes";

const useProvisionSite = () => {
  const mutation = useMutation<SiteProvisionResponse, Error, SiteProvision>({
    mutationFn: provisionSite,
  });
  return [mutation.data, mutation.status, mutation.mutateAsync] as [SiteProvisionResponse | undefined, MutationStatus, (req: SiteProvision) => Promise<SiteProvisionResponse>];
};

export default useProvisionSite; 