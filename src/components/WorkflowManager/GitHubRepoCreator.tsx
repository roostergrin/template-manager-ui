import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useGithubRepo } from '../../context/GithubRepoContext';
import useCreateGithubRepoFromTemplate from '../../hooks/useCreateGithubRepoFromTemplate';
import useProgressTracking from '../../hooks/useProgressTracking';
import useUpdateGithubRepoFile from '../../hooks/useUpdateGithubRepoFile';
import { UpdateGithubRepoFileRequest } from '../../types/APIServiceTypes';
import './GitHubRepoCreator.sass';

interface GitHubRepoCreatorProps {
  onRepoCreated?: (repoData: any) => void;
  initialTemplateRepo?: string;
  apiUrl?: string;
  siteUrl?: string;
}

export interface GitHubRepoCreatorRef {
  triggerCreateRepo: () => Promise<void>;
}

const GitHubRepoCreator = forwardRef<GitHubRepoCreatorRef, GitHubRepoCreatorProps>(({ onRepoCreated, initialTemplateRepo, apiUrl, siteUrl }, ref) => {
  const { state, actions } = useGithubRepo();
  const { githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;
  const [templateRepoName, setTemplateRepoName] = useState(initialTemplateRepo || 'ai-template-stinson');
  const [createRepoData, createRepoStatus, createRepo] = useCreateGithubRepoFromTemplate();
  const [, , updateApiFile] = useUpdateGithubRepoFile();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { updateTaskStatus } = useProgressTracking();

  // Update template repo name when prop changes
  useEffect(() => {
    if (initialTemplateRepo) {
      setTemplateRepoName(initialTemplateRepo);
    }
  }, [initialTemplateRepo]);

  const handleCreateRepo = useCallback(async () => {
    setError(null);
    updateTaskStatus('infrastructure', 'repoCreation', 'in-progress');

    try {
      // Step 1: Create the repository
      console.log('🚀 Creating GitHub repository...');
      const result = await createRepo({
        new_name: githubRepo,
        template_repo: templateRepoName
      });
      setGithubOwner(result.owner);
      setGithubRepo(result.repo);
      console.log('✅ Repository created successfully:', result);

      // Step 2: Update api.js if apiUrl and siteUrl are provided
      if (apiUrl && siteUrl) {
        console.log('🚀 Updating api.js file...');
        try {
          const apiFileContent = `// Update the api to the api address of your project, i.e. https://api.arbitmanortho.com or https://api-oaktonbraces.roostertest2.com
// Update the url variable to the address where your project will be launched, i.e. https://www.arbitmanortho.com or https://hollevoetorthodontics.com

export const api = 'https://${apiUrl}/wp-json'
// Make sure the url contains the trailing "/"
export const url = 'https://www.${siteUrl}/'
`;

          const apiFileRequest: UpdateGithubRepoFileRequest = {
            owner: result.owner,
            repo: result.repo,
            path: 'resources/api.js',
            content: apiFileContent,
            message: 'Update API configuration',
            branch: 'master'
          };

          await updateApiFile(apiFileRequest);
          console.log('✅ api.js updated successfully');
        } catch (apiError) {
          console.error('⚠️ Failed to update api.js (repo created successfully):', apiError);
          // Don't fail the entire operation if api.js update fails
        }
      } else {
        console.log('ℹ️ Skipping api.js update (no apiUrl or siteUrl provided)');
      }

      updateTaskStatus('infrastructure', 'repoCreation', 'completed');

      if (onRepoCreated) {
        onRepoCreated({
          ...result,
          apiJsUpdated: !!(apiUrl && siteUrl),
          apiUrl: apiUrl,
          siteUrl: siteUrl
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      updateTaskStatus('infrastructure', 'repoCreation', 'error');
    }
  }, [githubRepo, templateRepoName, createRepo, setGithubOwner, setGithubRepo, apiUrl, siteUrl, updateApiFile, onRepoCreated, updateTaskStatus]);

  const handleCopy = useCallback(() => {
    if (createRepoData) {
      navigator.clipboard.writeText(`https://github.com/${createRepoData.owner}/${createRepoData.repo}.git`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createRepoData]);

  // Expose the handleCreateRepo method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerCreateRepo: handleCreateRepo
  }), [handleCreateRepo]);

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
});

GitHubRepoCreator.displayName = 'GitHubRepoCreator';

export default GitHubRepoCreator; 
