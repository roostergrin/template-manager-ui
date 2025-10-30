import React, { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useGithubRepo } from '../../context/GithubRepoContext';
import useCreateGithubRepoFromTemplate from '../../hooks/useCreateGithubRepoFromTemplate';
import useProgressTracking from '../../hooks/useProgressTracking';
import './GitHubRepoCreator.sass';

interface GitHubRepoCreatorProps {
  onRepoCreated?: (repoData: any) => void;
}

const GitHubRepoCreator: React.FC<GitHubRepoCreatorProps> = ({ onRepoCreated }) => {
  const { state, actions } = useGithubRepo();
  const { githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;
  const [templateRepoName, setTemplateRepoName] = useState('ai-template-stinson');
  const [createRepoData, createRepoStatus, createRepo] = useCreateGithubRepoFromTemplate();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { progressState, updateTaskStatus } = useProgressTracking();

  const handleCreateRepo = useCallback(async () => {
    setError(null);
    updateTaskStatus('infrastructure', 'repoCreation', 'in-progress');
    
    try {
      const result = await createRepo({ 
        new_name: githubRepo, 
        template_repo: templateRepoName 
      });
      setGithubOwner(result.owner);
      setGithubRepo(result.repo);
      
      updateTaskStatus('infrastructure', 'repoCreation', 'completed');
      
      if (onRepoCreated) {
        onRepoCreated(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      updateTaskStatus('infrastructure', 'repoCreation', 'error');
    }
  }, [githubRepo, templateRepoName, createRepo, setGithubOwner, setGithubRepo, onRepoCreated, updateTaskStatus]);

  const handleCopy = useCallback(() => {
    if (createRepoData) {
      navigator.clipboard.writeText(`https://github.com/${createRepoData.owner}/${createRepoData.repo}.git`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createRepoData]);

  return (
    <div className="github-repo-creator">
      
      <div className="form-group">
        <label htmlFor="new-repo-name">New Repository Name</label>
        <input
          id="new-repo-name"
          type="text"
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          placeholder="e.g., my-orthodontist-site"
          disabled={createRepoStatus === 'pending'}
        />
      </div>

      <div className="form-group">
        <label htmlFor="template-repo-name">Template Repository</label>
        <input
          id="template-repo-name"
          type="text"
          value={templateRepoName}
          onChange={(e) => setTemplateRepoName(e.target.value)}
          placeholder="e.g., ai-template-stinson"
          disabled={createRepoStatus === 'pending'}
        />
      </div>

      <button
        className="create-button"
        onClick={handleCreateRepo}
        disabled={!githubRepo || !templateRepoName || createRepoStatus === 'pending'}
      >
        {createRepoStatus === 'pending' ? 'Creating Repository...' : 'Create Repository from Template'}
      </button>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {createRepoStatus === 'success' && createRepoData && (
        <div className="success-section">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Repository Created Successfully!</h4>
          </div>
          
          <div className="repo-details">
            <div className="detail-item">
              <strong>Owner:</strong> {createRepoData.owner}
            </div>
            <div className="detail-item">
              <strong>Repository:</strong> {createRepoData.repo}
            </div>
            <div className="detail-item">
              <strong>Full Name:</strong> {createRepoData.full_name}
            </div>
          </div>

          <div className="repo-url-section">
            <label>Repository URL:</label>
            <div className="url-copy-container">
              <code className="repo-url">
                https://github.com/{createRepoData.owner}/{createRepoData.repo}.git
              </code>
              <button 
                className="copy-button"
                onClick={handleCopy}
                title="Copy repository URL"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className="repo-links">
            <a
              href={`https://github.com/${createRepoData.owner}/${createRepoData.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link"
            >
              🔗 View Repository on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubRepoCreator; 
