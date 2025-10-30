import apiClient from "./apiService";
import { CopySubscriptionRequest, CopySubscriptionResponse } from "../types/APIServiceTypes";

export const testSSHConnection = async (plesk_ip: string) => {
  return await apiClient.get<any>(`/test-ssh-connection`, {
    params: { plesk_ip },
  });
};

export const listSubscriptions = async (plesk_ip: string) => {
  return await apiClient.get<any>(`/list-subscriptions`, {
    params: { plesk_ip },
  });
};

export const listSubdomains = async (domain: string, plesk_ip: string) => {
  return await apiClient.get<any>(`/list-subdomains`, {
    params: { domain, plesk_ip },
  });
};

export const getSubscriptionDetails = async (domain: string, plesk_ip: string) => {
  return await apiClient.get<any>(`/subscription-details/${encodeURIComponent(domain)}`, {
    params: { plesk_ip },
  });
};

export const checkWpConfig = async (
  domain: string,
  subdomain: string,
  plesk_ip: string
) => {
  return await apiClient.get<any>(
    `/check-wp-config/${encodeURIComponent(domain)}/${encodeURIComponent(subdomain)}`,
    { params: { plesk_ip } }
  );
};

export const testDatabaseServerInfo = async (plesk_ip: string) => {
  return await apiClient.get<any>(`/test-database-server-info`, {
    params: { plesk_ip },
  });
};

export const copySubscription = async (
  req: CopySubscriptionRequest
): Promise<CopySubscriptionResponse> => {
  // Backend expects query params for this POST route
  const params = new URLSearchParams({
    source_domain: req.source_domain,
    target_domain: req.target_domain,
    server: req.server,
    subdomain: req.subdomain,
    copy_files: String(req.copy_files),
    copy_databases: String(req.copy_databases),
    update_config_files: String(req.update_config_files),
  }).toString();

  return await apiClient.post<CopySubscriptionResponse>(
    `/copy-subscription?${params}`
  );
};

export const copySubdomainWithinSubscription = async (
  source_subdomain: string,
  target_subdomain: string,
  parent_domain: string,
  server: string
) => {
  const params = new URLSearchParams({
    source_subdomain,
    target_subdomain,
    parent_domain,
    server,
    copy_files: "true",
    copy_databases: "true",
  }).toString();

  return await apiClient.post<any>(
    `/copy-subdomain-within-subscription?${params}`
  );
};


