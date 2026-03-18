import apiClient, { startAndPollAsyncJob, StartAndPollOptions } from './apiService';
import { fetchGitHubRepos, GitHubRepoRecord } from './jobHistoryService';

export { fetchGitHubRepos };
export type { GitHubRepoRecord };

export interface CloudflareConnectionResult {
  success: boolean;
  message?: string;
  account_id?: string;
  project_count?: number;
}

export interface CloudflareDeployParams {
  project_name: string;
  repo_name: string;
  repo_owner?: string;
  build_command: string;
  build_output_dir: string;
  node_version: string;
}

export interface CloudflareDeployResult {
  success?: boolean;
  project_name?: string;
  pages_url?: string;
  message?: string;
  deployment_id?: string;
  build_status?: string;
  [key: string]: unknown;
}

export async function testCloudflareConnection(): Promise<CloudflareConnectionResult> {
  return apiClient.get<CloudflareConnectionResult>('/test-cloudflare-connection');
}

export async function deployToCloudflarePages(
  params: CloudflareDeployParams,
  options?: StartAndPollOptions,
): Promise<CloudflareDeployResult> {
  return startAndPollAsyncJob<CloudflareDeployResult>(
    '/provision-cloudflare-pages/start/',
    params,
    options,
  );
}
