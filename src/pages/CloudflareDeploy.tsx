import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Cloud, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import {
  testCloudflareConnection,
  fetchGitHubRepos,
  deployToCloudflarePages,
  CloudflareDeployParams,
  CloudflareDeployResult,
  GitHubRepoRecord,
} from '../services/cloudflareDeployService';
import './CloudflareDeploy.sass';

type RepoMode = 'select' | 'manual';
type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

const CloudflareDeploy: React.FC = () => {
  const [repoMode, setRepoMode] = useState<RepoMode>('select');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [manualOwner, setManualOwner] = useState('demo-rooster');
  const [manualRepo, setManualRepo] = useState('');
  const [projectName, setProjectName] = useState('');
  const [buildCommand, setBuildCommand] = useState('npm run generate');
  const [buildOutputDir, setBuildOutputDir] = useState('dist');
  const [nodeVersion, setNodeVersion] = useState('14');

  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployError, setDeployError] = useState('');
  const [deployResult, setDeployResult] = useState<CloudflareDeployResult | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const connectionQuery = useQuery({
    queryKey: ['cloudflareConnection'],
    queryFn: testCloudflareConnection,
    retry: false,
  });

  const reposQuery = useQuery({
    queryKey: ['githubRepos'],
    queryFn: () => fetchGitHubRepos(),
  });

  const repos: GitHubRepoRecord[] = reposQuery.data ?? [];

  // Auto-derive project name from selected/manual repo
  useEffect(() => {
    if (repoMode === 'select' && selectedRepoId) {
      const repo = repos.find((r) => String(r.id) === selectedRepoId);
      if (repo) setProjectName(repo.repo_name);
    } else if (repoMode === 'manual' && manualRepo) {
      setProjectName(manualRepo);
    }
  }, [repoMode, selectedRepoId, manualRepo, repos]);

  const getDeployParams = (): CloudflareDeployParams | null => {
    if (repoMode === 'select') {
      const repo = repos.find((r) => String(r.id) === selectedRepoId);
      if (!repo) return null;
      return {
        project_name: projectName,
        repo_name: repo.repo_name,
        repo_owner: repo.owner,
        build_command: buildCommand,
        build_output_dir: buildOutputDir,
        node_version: nodeVersion,
      };
    }
    if (!manualRepo) return null;
    return {
      project_name: projectName,
      repo_name: manualRepo,
      repo_owner: manualOwner || undefined,
      build_command: buildCommand,
      build_output_dir: buildOutputDir,
      node_version: nodeVersion,
    };
  };

  const canDeploy = !!getDeployParams() && !!projectName && deployStatus !== 'deploying';

  const handleDeploy = async () => {
    const params = getDeployParams();
    if (!params) return;

    setDeployStatus('deploying');
    setDeployError('');
    setDeployResult(null);
    setElapsedSec(0);

    try {
      const result = await deployToCloudflarePages(params, {
        pollIntervalMs: 5000,
        onProgress: (sec) => setElapsedSec(sec),
      });
      setDeployResult(result);
      setDeployStatus(result.build_status === 'failure' ? 'error' : 'success');
      if (result.build_status === 'failure') {
        setDeployError(result.message || 'Cloudflare build failed');
      }
    } catch (err: unknown) {
      setDeployError(err instanceof Error ? err.message : String(err));
      setDeployStatus('error');
    }
  };

  const pagesUrl = deployResult?.pages_url
    || (deployResult?.project_name ? `https://${deployResult.project_name}.pages.dev` : null);

  return (
    <div className="cf-deploy">
      <div className="cf-deploy__header">
        <button
          className="cf-deploy__back-btn"
          onClick={() => { window.location.href = '/'; }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <Cloud size={20} className="cf-deploy__header-icon" />
        <h1 className="cf-deploy__title">Deploy to Cloudflare Pages</h1>
      </div>

      <div className="cf-deploy__body">
        {/* Connection status */}
        <div className="cf-deploy__section">
          <h2 className="cf-deploy__section-title">Cloudflare Connection</h2>
          {connectionQuery.isLoading && (
            <span className="cf-deploy__status cf-deploy__status--running">
              <Loader size={14} className="cf-deploy__spinner" /> Checking...
            </span>
          )}
          {connectionQuery.isError && (
            <span className="cf-deploy__status cf-deploy__status--error">
              <AlertCircle size={14} /> Not connected
            </span>
          )}
          {connectionQuery.data && (
            connectionQuery.data.success ? (
              <span className="cf-deploy__status cf-deploy__status--ok">
                <CheckCircle size={14} /> {connectionQuery.data.message || 'Connected'}
              </span>
            ) : (
              <span className="cf-deploy__status cf-deploy__status--error">
                <AlertCircle size={14} /> {connectionQuery.data.message || 'Not connected'}
              </span>
            )
          )}
        </div>

        {/* Repo selection */}
        <div className="cf-deploy__section">
          <h2 className="cf-deploy__section-title">GitHub Repository</h2>
          <div className="cf-deploy__mode-toggle">
            <button
              className={`cf-deploy__mode-btn ${repoMode === 'select' ? 'cf-deploy__mode-btn--active' : ''}`}
              onClick={() => setRepoMode('select')}
            >
              Select from DB
            </button>
            <button
              className={`cf-deploy__mode-btn ${repoMode === 'manual' ? 'cf-deploy__mode-btn--active' : ''}`}
              onClick={() => setRepoMode('manual')}
            >
              Manual Entry
            </button>
          </div>

          {repoMode === 'select' ? (
            <div className="cf-deploy__field">
              <label className="cf-deploy__label" htmlFor="repo-select">Repository</label>
              <select
                id="repo-select"
                className="cf-deploy__select"
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
              >
                <option value="">— Choose a repo —</option>
                {repos.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.owner}/{r.repo_name}
                  </option>
                ))}
              </select>
              {reposQuery.isLoading && <span className="cf-deploy__hint">Loading repos...</span>}
            </div>
          ) : (
            <div className="cf-deploy__field-row">
              <div className="cf-deploy__field">
                <label className="cf-deploy__label" htmlFor="manual-owner">Owner</label>
                <input
                  id="manual-owner"
                  className="cf-deploy__input"
                  value={manualOwner}
                  onChange={(e) => setManualOwner(e.target.value)}
                  placeholder="demo-rooster"
                />
              </div>
              <div className="cf-deploy__field">
                <label className="cf-deploy__label" htmlFor="manual-repo">Repo Name</label>
                <input
                  id="manual-repo"
                  className="cf-deploy__input"
                  value={manualRepo}
                  onChange={(e) => setManualRepo(e.target.value)}
                  placeholder="my-site"
                />
              </div>
            </div>
          )}
        </div>

        {/* Build config */}
        <div className="cf-deploy__section">
          <h2 className="cf-deploy__section-title">Build Configuration</h2>
          <div className="cf-deploy__field">
            <label className="cf-deploy__label" htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              className="cf-deploy__input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-site"
            />
          </div>
          <div className="cf-deploy__field-row">
            <div className="cf-deploy__field">
              <label className="cf-deploy__label" htmlFor="build-cmd">Build Command</label>
              <input
                id="build-cmd"
                className="cf-deploy__input"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
              />
            </div>
            <div className="cf-deploy__field">
              <label className="cf-deploy__label" htmlFor="build-output">Output Directory</label>
              <input
                id="build-output"
                className="cf-deploy__input"
                value={buildOutputDir}
                onChange={(e) => setBuildOutputDir(e.target.value)}
              />
            </div>
            <div className="cf-deploy__field">
              <label className="cf-deploy__label" htmlFor="node-ver">Node Version</label>
              <input
                id="node-ver"
                className="cf-deploy__input"
                value={nodeVersion}
                onChange={(e) => setNodeVersion(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Deploy button */}
        <div className="cf-deploy__actions">
          <button
            className="cf-deploy__deploy-btn"
            onClick={handleDeploy}
            disabled={!canDeploy}
          >
            {deployStatus === 'deploying' ? (
              <><Loader size={16} className="cf-deploy__spinner" /> Deploying... ({elapsedSec}s)</>
            ) : (
              <><Cloud size={16} /> Deploy to Cloudflare Pages</>
            )}
          </button>
        </div>

        {/* Result */}
        {deployStatus === 'success' && (
          <div className="cf-deploy__result cf-deploy__result--ok">
            <CheckCircle size={18} />
            <div>
              <strong>Build succeeded — site is live!</strong>
              {pagesUrl && (
                <a
                  href={pagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cf-deploy__result-link"
                >
                  {pagesUrl} <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {deployStatus === 'error' && (
          <div className="cf-deploy__result cf-deploy__result--error">
            <AlertCircle size={18} />
            <div>
              <strong>Deployment failed</strong>
              <p className="cf-deploy__result-error">{deployError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudflareDeploy;
