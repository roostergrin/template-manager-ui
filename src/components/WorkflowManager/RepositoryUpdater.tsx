import React, { useState, useCallback } from 'react';
import { useGithubRepo } from '../../context/GithubRepoContext';
import useUpdateGithubRepoDataFiles from '../../hooks/useUpdateGithubRepoDataFiles';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import ProgressIndicator from '../Common/ProgressIndicator';
import './RepositoryUpdater.sass';

interface RepositoryUpdaterProps {
  onUpdateComplete?: () => void;
}

const RepositoryUpdater: React.FC<RepositoryUpdaterProps> = ({
  onUpdateComplete
}) => {
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;
  const [, githubStatus, updateGithub] = useUpdateGithubRepoDataFiles();
  const [error, setError] = useState<string | null>(null);
  const { state: workflowState, actions: workflowActions } = useWorkflow();

  // Get generated content from workflow context
  const latestContent = workflowState.generatedContent.find(content => content.type === 'page-content');
  const pagesContent = latestContent?.content?.pages || null;
  const globalContent = latestContent?.content?.global || null;

  const handleUpdateGithub = useCallback(async () => {
    setError(null);
    
    if (!pagesContent || !globalContent) {
      setError('Generate content before updating GitHub repository.');
      return;
    }
    
    if (!githubOwner || !githubRepo) {
      setError('Please specify GitHub owner and repository name.');
      return;
    }

    workflowActions.updateTaskStatus('deployment', 'repositoryUpdate', 'in-progress');

    try {
      await updateGithub({
        owner: githubOwner,
        repo: githubRepo,
        pages_data: pagesContent,
        global_data: globalContent,
      });
      
      workflowActions.updateTaskStatus('deployment', 'repositoryUpdate', 'completed');
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating repository');
      workflowActions.updateTaskStatus('deployment', 'repositoryUpdate', 'error');
    }
  }, [githubOwner, githubRepo, pagesContent, globalContent, updateGithub, onUpdateComplete, workflowActions]);

  const isDisabled = !githubOwner || !githubRepo || !pagesContent || !globalContent || githubStatus === 'pending';
  const hasContent = pagesContent && globalContent;

  return (
    <div className="repository-updater">
      <div className="repository-updater__header">
        <h4 className="repository-updater__title">Repository Update Status</h4>
          <ProgressIndicator 
          status={workflowState.progressState.deployment.repositoryUpdate} 
          size="small"
          showLabel={true}
        />
      </div>
      
      {/* Content Status */}
      <div className="content-status">
        <div className="status-item">
          <span className="status-label">Pages Content:</span>
          <span className={`status-indicator ${pagesContent ? 'ready' : 'missing'}`}>
            {pagesContent ? '✅ Ready' : '❌ Missing'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Global Content:</span>
          <span className={`status-indicator ${globalContent ? 'ready' : 'missing'}`}>
            {globalContent ? '✅ Ready' : '❌ Missing'}
          </span>
        </div>
      </div>

      {/* Repository Configuration */}
      <div className="repo-config">
        <div className="form-group">
          <label htmlFor="github-owner">GitHub Owner</label>
          <input
            id="github-owner"
            type="text"
            value={githubOwner}
            onChange={(e) => setGithubOwner(e.target.value)}
            placeholder="Enter GitHub owner"
            disabled={githubStatus === 'pending'}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="github-repo">GitHub Repository</label>
          <input
            id="github-repo"
            type="text"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            placeholder="Enter GitHub repository name"
            disabled={githubStatus === 'pending'}
          />
        </div>
      </div>

      {/* Update Button */}
      <button
        className="update-button"
        onClick={handleUpdateGithub}
        disabled={isDisabled}
      >
        {githubStatus === 'pending' ? 'Updating Repository...' : 'Update GitHub Repository'}
      </button>

      {/* Status Display */}
      <div className="status-display">
        <div className="status-item">
          <span className="status-label">Update Status:</span>
          <span className={`status-value status-value--${githubStatus}`}>
            {githubStatus}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Display */}
      {githubStatus === 'success' && (
        <div className="success-section">
          <h4>🎉 Repository Updated Successfully!</h4>
          <p>Your generated content has been pushed to the GitHub repository.</p>
          
          {githubOwner && githubRepo && (
            <div className="repo-links">
              <a
                href={`https://github.com/${githubOwner}/${githubRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                🔗 View Repository on GitHub
              </a>
              <a
                href={`https://github.com/${githubOwner}/${githubRepo}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                📝 View Recent Commits
              </a>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!hasContent && (
        <div className="help-text">
          <p>💡 <strong>Tip:</strong> Generate content first using the Content Generation section above, then return here to update your repository.</p>
        </div>
      )}
    </div>
  );
};

export default RepositoryUpdater; 
