import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, RefreshCw, Globe, GitBranch, Rocket, Workflow, AlertCircle, CheckCircle, Clock, Loader, ChevronRight, ChevronDown } from 'lucide-react';
import {
  fetchScrapeJobs,
  fetchGitHubRepos,
  fetchDeployments,
  fetchWorkflowSessions,
  fetchScrapeJobDetail,
  fetchDeploymentDetail,
  ScrapeJob,
  ScrapeJobDetail,
  GitHubRepoRecord,
  DeploymentRecord,
  DeploymentDetail,
  WorkflowSessionRecord,
} from '../services/jobHistoryService';
import './JobHistory.sass';

type Tab = 'scrapes' | 'repos' | 'deployments' | 'workflows';

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'scrapes', label: 'Scrape Jobs', icon: <Globe size={15} /> },
  { key: 'repos', label: 'GitHub Repos', icon: <GitBranch size={15} /> },
  { key: 'deployments', label: 'Deployments', icon: <Rocket size={15} /> },
  { key: 'workflows', label: 'Workflows', icon: <Workflow size={15} /> },
];

function StatusBadge({ status }: { status: string }) {
  const isOk = ['complete', 'completed', 'success'].includes(status.toLowerCase());
  const isErr = ['error', 'failed'].includes(status.toLowerCase());
  const isRunning = status.toLowerCase() === 'running';

  return (
    <span className={`job-history__status job-history__status--${isOk ? 'ok' : isErr ? 'error' : isRunning ? 'running' : 'default'}`}>
      {isOk && <CheckCircle size={12} />}
      {isErr && <AlertCircle size={12} />}
      {isRunning && <Loader size={12} className="job-history__spinner" />}
      {status}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="job-history__json">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ScrapeDetailRow({ jobId }: { jobId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['scrapeJobDetail', jobId],
    queryFn: () => fetchScrapeJobDetail(jobId),
  });

  if (isLoading) return <tr><td colSpan={7} className="job-history__detail-cell"><Loader size={14} className="job-history__spinner" /> Loading logs...</td></tr>;
  if (isError || !data) return <tr><td colSpan={7} className="job-history__detail-cell job-history__detail-cell--error">Failed to load details</td></tr>;

  return (
    <tr>
      <td colSpan={7} className="job-history__detail-cell">
        <div className="job-history__detail-sections">
          {data.error_message && (
            <div className="job-history__detail-section">
              <h4 className="job-history__detail-heading">Error</h4>
              <p className="job-history__detail-error">{data.error_message}</p>
            </div>
          )}
          {data.result && (
            <>
              {data.result.metadata && (
                <div className="job-history__detail-section">
                  <h4 className="job-history__detail-heading">Metadata</h4>
                  <JsonViewer data={data.result.metadata} />
                </div>
              )}
              {data.result.pages && (
                <div className="job-history__detail-section">
                  <h4 className="job-history__detail-heading">Pages Scraped ({Object.keys(data.result.pages as Record<string, unknown>).length})</h4>
                  <ul className="job-history__detail-list">
                    {Object.keys(data.result.pages as Record<string, unknown>).map(page => (
                      <li key={page}>{page}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.design_system && (
                <div className="job-history__detail-section">
                  <h4 className="job-history__detail-heading">Design System</h4>
                  <JsonViewer data={data.design_system} />
                </div>
              )}
              <div className="job-history__detail-section">
                <h4 className="job-history__detail-heading">Full Result</h4>
                <JsonViewer data={data.result} />
              </div>
            </>
          )}
          {!data.result && !data.error_message && (
            <p className="job-history__detail-empty">No detailed logs available for this job.</p>
          )}
        </div>
      </td>
    </tr>
  );
}

function DeployDetailRow({ deployId, colSpan }: { deployId: number; colSpan: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['deploymentDetail', deployId],
    queryFn: () => fetchDeploymentDetail(deployId),
  });

  if (isLoading) return <tr><td colSpan={colSpan} className="job-history__detail-cell"><Loader size={14} className="job-history__spinner" /> Loading logs...</td></tr>;
  if (isError || !data) return <tr><td colSpan={colSpan} className="job-history__detail-cell job-history__detail-cell--error">Failed to load details</td></tr>;

  return (
    <tr>
      <td colSpan={colSpan} className="job-history__detail-cell">
        <div className="job-history__detail-sections">
          {data.error_message && (
            <div className="job-history__detail-section">
              <h4 className="job-history__detail-heading">Error</h4>
              <p className="job-history__detail-error">{data.error_message}</p>
            </div>
          )}
          {data.infra_ids && (
            <div className="job-history__detail-section">
              <h4 className="job-history__detail-heading">Infrastructure IDs</h4>
              <JsonViewer data={data.infra_ids} />
            </div>
          )}
          {data.result && (
            <div className="job-history__detail-section">
              <h4 className="job-history__detail-heading">Full Result</h4>
              <JsonViewer data={data.result} />
            </div>
          )}
          {!data.result && !data.error_message && !data.infra_ids && (
            <p className="job-history__detail-empty">No detailed logs available for this deployment.</p>
          )}
        </div>
      </td>
    </tr>
  );
}

function ScrapeTable({ data }: { data: ScrapeJob[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (data.length === 0) return <p className="job-history__empty">No scrape jobs found.</p>;
  return (
    <table className="job-history__table">
      <thead>
        <tr>
          <th></th><th>Domain</th><th>Status</th><th>URLs Found</th><th>Pages Scraped</th><th>Started</th><th>Completed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <React.Fragment key={r.id}>
            <tr className={`job-history__row ${expandedId === r.id ? 'job-history__row--expanded' : ''}`} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
              <td className="job-history__expand-cell">
                {expandedId === r.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </td>
              <td className="job-history__domain">{r.domain}</td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.urls_discovered ?? '—'}</td>
              <td>{r.pages_scraped ?? '—'}</td>
              <td>{formatDate(r.started_at)}</td>
              <td>{formatDate(r.completed_at)}</td>
            </tr>
            {expandedId === r.id && <ScrapeDetailRow jobId={r.id} />}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function RepoTable({ data }: { data: GitHubRepoRecord[] }) {
  if (data.length === 0) return <p className="job-history__empty">No GitHub repos found.</p>;
  return (
    <table className="job-history__table">
      <thead>
        <tr>
          <th>Owner / Repo</th><th>Domain</th><th>Site Type</th><th>Created</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <tr key={r.id}>
            <td>
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="job-history__link">
                  {r.owner}/{r.repo_name}
                </a>
              ) : (
                `${r.owner}/${r.repo_name}`
              )}
            </td>
            <td>{r.domain ?? '—'}</td>
            <td>{r.site_type ?? '—'}</td>
            <td>{formatDate(r.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeployTable({ data }: { data: DeploymentRecord[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (data.length === 0) return <p className="job-history__empty">No deployments found.</p>;
  return (
    <table className="job-history__table">
      <thead>
        <tr>
          <th></th><th>Domain</th><th>Type</th><th>Status</th><th>GitHub Repo</th><th>Started</th><th>Completed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <React.Fragment key={r.id}>
            <tr className={`job-history__row ${expandedId === r.id ? 'job-history__row--expanded' : ''}`} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
              <td className="job-history__expand-cell">
                {expandedId === r.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </td>
              <td className="job-history__domain">{r.domain}</td>
              <td><span className="job-history__type-badge">{r.deploy_type}</span></td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.github_repo ?? '—'}</td>
              <td>{formatDate(r.started_at)}</td>
              <td>{formatDate(r.completed_at)}</td>
            </tr>
            {expandedId === r.id && <DeployDetailRow deployId={r.id} colSpan={7} />}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function WorkflowTable({ data }: { data: WorkflowSessionRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (data.length === 0) return <p className="job-history__empty">No workflow sessions found.</p>;
  return (
    <table className="job-history__table">
      <thead>
        <tr>
          <th></th><th>Domain</th><th>Site Type</th><th>Steps</th><th>Failed</th><th>Started</th><th>Completed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <React.Fragment key={r.id}>
            <tr className={`job-history__row ${expandedId === r.id ? 'job-history__row--expanded' : ''}`} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
              <td className="job-history__expand-cell">
                {expandedId === r.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </td>
              <td className="job-history__domain">{r.domain}</td>
              <td>{r.site_type ?? '—'}</td>
              <td>{r.steps_completed}/{r.total_steps}</td>
              <td>{r.steps_failed > 0 ? <span className="job-history__fail-count">{r.steps_failed}</span> : '0'}</td>
              <td>{formatDate(r.started_at)}</td>
              <td>{formatDate(r.completed_at)}</td>
            </tr>
            {expandedId === r.id && r.step_details && (
              <tr>
                <td colSpan={7} className="job-history__detail-cell">
                  <div className="job-history__detail-sections">
                    <div className="job-history__detail-section">
                      <h4 className="job-history__detail-heading">Step Details</h4>
                      <JsonViewer data={r.step_details} />
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < query.length; i++) {
    if (lower[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function filterByDomain<T extends { domain: string | null }>(items: T[], query: string): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => item.domain && fuzzyMatch(item.domain, q));
}

function filterRepos(items: GitHubRepoRecord[], query: string): GitHubRepoRecord[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(r =>
    (r.domain && fuzzyMatch(r.domain, q)) ||
    fuzzyMatch(`${r.owner}/${r.repo_name}`, q),
  );
}

const JobHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('scrapes');
  const [domainFilter, setDomainFilter] = useState('');

  const scrapes = useQuery({ queryKey: ['scrapeJobs'], queryFn: () => fetchScrapeJobs(), enabled: activeTab === 'scrapes' });
  const repos = useQuery({ queryKey: ['githubRepos'], queryFn: () => fetchGitHubRepos(), enabled: activeTab === 'repos' });
  const deploys = useQuery({ queryKey: ['deployments'], queryFn: () => fetchDeployments(), enabled: activeTab === 'deployments' });
  const workflows = useQuery({ queryKey: ['workflowSessions'], queryFn: () => fetchWorkflowSessions(), enabled: activeTab === 'workflows' });

  const activeQuery = { scrapes, repos, deployments: deploys, workflows }[activeTab];

  const handleBack = () => { window.location.href = '/'; };

  const handleRefresh = () => { activeQuery.refetch(); };

  return (
    <div className="job-history">
      <header className="job-history__header">
        <button type="button" className="job-history__back-btn" onClick={handleBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <Clock size={18} className="job-history__header-icon" />
        <h1 className="job-history__title">Job History</h1>
        <div className="job-history__controls">
          <div className="job-history__search">
            <Search size={14} className="job-history__search-icon" />
            <input
              type="text"
              className="job-history__search-input"
              placeholder="Filter by domain..."
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
            />
          </div>
          <button type="button" className="job-history__refresh-btn" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={14} className={activeQuery.isFetching ? 'job-history__spinner' : ''} />
          </button>
        </div>
      </header>

      <nav className="job-history__tabs">
        {TAB_CONFIG.map(t => (
          <button
            key={t.key}
            type="button"
            className={`job-history__tab ${activeTab === t.key ? 'job-history__tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <main className="job-history__content">
        {activeQuery.isLoading && (
          <div className="job-history__loading">
            <Loader size={20} className="job-history__spinner" />
            Loading...
          </div>
        )}
        {activeQuery.isError && (
          <div className="job-history__error">
            <AlertCircle size={16} />
            Failed to load data. Is the database connected?
          </div>
        )}
        {activeQuery.isSuccess && (
          <>
            {activeTab === 'scrapes' && <ScrapeTable data={filterByDomain(scrapes.data!, domainFilter)} />}
            {activeTab === 'repos' && <RepoTable data={filterRepos(repos.data!, domainFilter)} />}
            {activeTab === 'deployments' && <DeployTable data={filterByDomain(deploys.data!, domainFilter)} />}
            {activeTab === 'workflows' && <WorkflowTable data={filterByDomain(workflows.data!, domainFilter)} />}
          </>
        )}
      </main>
    </div>
  );
};

export default JobHistory;
