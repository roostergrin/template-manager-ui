import apiClient from './apiService';

export interface ScrapeJob {
  id: string;
  domain: string;
  status: string;
  urls_discovered: number | null;
  pages_scraped: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ScrapeJobDetail extends ScrapeJob {
  design_system: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
}

export interface GitHubRepoRecord {
  id: number;
  owner: string;
  repo_name: string;
  url: string | null;
  domain: string | null;
  site_type: string | null;
  created_at: string | null;
}

export interface DeploymentRecord {
  id: number;
  domain: string;
  deploy_type: string;
  github_repo: string | null;
  status: string;
  infra_ids: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface DeploymentDetail extends DeploymentRecord {
  result: Record<string, unknown> | null;
}

export interface WorkflowSessionRecord {
  id: string;
  domain: string;
  site_type: string | null;
  session_id: string | null;
  steps_completed: number;
  steps_failed: number;
  total_steps: number;
  step_details: unknown[] | null;
  started_at: string | null;
  completed_at: string | null;
}

export async function fetchScrapeJobs(domain?: string): Promise<ScrapeJob[]> {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return apiClient.get<ScrapeJob[]>(`/db/scrape-jobs${params}`);
}

export async function fetchGitHubRepos(domain?: string): Promise<GitHubRepoRecord[]> {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return apiClient.get<GitHubRepoRecord[]>(`/db/github-repos${params}`);
}

export async function fetchDeployments(domain?: string): Promise<DeploymentRecord[]> {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return apiClient.get<DeploymentRecord[]>(`/db/deployments${params}`);
}

export async function fetchWorkflowSessions(domain?: string): Promise<WorkflowSessionRecord[]> {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return apiClient.get<WorkflowSessionRecord[]>(`/db/workflow-sessions${params}`);
}

export async function fetchScrapeJobDetail(jobId: string): Promise<ScrapeJobDetail> {
  return apiClient.get<ScrapeJobDetail>(`/db/scrape-jobs/${jobId}`);
}

export async function fetchDeploymentDetail(deployId: number): Promise<DeploymentDetail> {
  return apiClient.get<DeploymentDetail>(`/db/deployments/${deployId}`);
}
