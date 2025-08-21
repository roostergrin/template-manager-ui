import React, { useState, useCallback } from 'react';
import useUpdateGithubRepoFile from '../../hooks/useUpdateGithubRepoFile';
import { UpdateGithubRepoFileRequest } from '../../types/APIServiceTypes';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import './GithubFileUpdater.sass';

interface GithubFileUpdaterProps {
  onUpdateComplete?: (response: any) => void;
}

const GithubFileUpdater: React.FC<GithubFileUpdaterProps> = ({
  onUpdateComplete
}) => {
  const { actions: workflowActions } = useWorkflow();
  const [formData, setFormData] = useState<UpdateGithubRepoFileRequest>({
    owner: '',
    repo: '',
    path: '',
    content: '',
    message: '',
    branch: 'main',
    sha: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [response, status, updateFile] = useUpdateGithubRepoFile();

  const handleInputChange = useCallback((field: keyof UpdateGithubRepoFileRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  }, [error]);

  const handleUpdateFile = useCallback(async () => {
    setError(null);
    
    // Validation
    if (!formData.owner.trim()) {
      setError('GitHub owner is required');
      return;
    }
    if (!formData.repo.trim()) {
      setError('Repository name is required');
      return;
    }
    if (!formData.path.trim()) {
      setError('File path is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('File content is required');
      return;
    }

    // Update progress to in-progress
    workflowActions.updateTaskStatus('deployment', 'frontendUpdate', 'in-progress');

    try {
      const result = await updateFile({
        ...formData,
        message: formData.message || `Update ${formData.path}`,
        sha: formData.sha || undefined // Don't send empty string
      });
      
      // Update progress to completed
      workflowActions.updateTaskStatus('deployment', 'frontendUpdate', 'completed');
      
      if (onUpdateComplete) {
        onUpdateComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the file');
      // Update progress to error
      workflowActions.updateTaskStatus('deployment', 'frontendUpdate', 'error');
    }
  }, [formData, updateFile, onUpdateComplete, workflowActions]);

  const isDisabled = status === 'pending';
  const isSuccess = status === 'success';

  return (
    <div className="github-file-updater">
      <div className="github-file-updater__header">
        <h4 className="github-file-updater__title">GitHub File Updater</h4>
      </div>

      {/* Repository Information */}
      <div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="owner">GitHub Owner *</label>
            <input
              id="owner"
              type="text"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="e.g., octocat"
              disabled={isDisabled}
              aria-label="GitHub repository owner"
              tabIndex={0}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="repo">Repository Name *</label>
            <input
              id="repo"
              type="text"
              value={formData.repo}
              onChange={(e) => handleInputChange('repo', e.target.value)}
              placeholder="e.g., my-website"
              disabled={isDisabled}
              aria-label="GitHub repository name"
              tabIndex={0}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <input
              id="branch"
              type="text"
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              placeholder="main"
              disabled={isDisabled}
              aria-label="Git branch name"
              tabIndex={0}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="sha">File SHA (for updates)</label>
            <input
              id="sha"
              type="text"
              value={formData.sha}
              onChange={(e) => handleInputChange('sha', e.target.value)}
              placeholder="Leave empty for new files"
              disabled={isDisabled}
              aria-label="File SHA for existing file updates"
              tabIndex={0}
            />
          </div>
        </div>
      </div>

      {/* File Information */}
      <div>
        
        <div className="form-group">
          <label htmlFor="path">File Path *</label>
          <input
            id="path"
            type="text"
            value={formData.path}
            onChange={(e) => handleInputChange('path', e.target.value)}
            placeholder="e.g., src/components/Header.tsx"
            disabled={isDisabled}
            aria-label="File path in repository"
            tabIndex={0}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Commit Message</label>
          <input
            id="message"
            type="text"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={`Update ${formData.path || 'file'}`}
            disabled={isDisabled}
            aria-label="Git commit message"
            tabIndex={0}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">File Content *</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Enter the file content here..."
            disabled={isDisabled}
            rows={12}
            aria-label="File content to update"
            tabIndex={0}
          />
        </div>
      </div>

      {/* Update Button */}
      <button
        className="update-button"
        onClick={handleUpdateFile}
        disabled={isDisabled}
        aria-label="Update file in GitHub repository"
        tabIndex={0}
        onKeyDown={(e) => { 
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleUpdateFile();
          }
        }}
      >
        {status === 'pending' ? 'Updating File...' : 'Update File'}
      </button>

      {/* Status Display */}
      <div className="status-display">
        <div className="status-item">
          <span className="status-label">Update Status:</span>
          <span className={`status-value status-value--${status}`}>
            {status}
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
      {isSuccess && response && (
        <div className="success-section">
          <div className="success-header">
            <h4>🎉 File Updated Successfully!</h4>
          </div>
          
          {response.commit && (
            <div className="commit-info">
              <div className="detail-item">
                <strong>Commit SHA:</strong> <code>{response.commit.sha}</code>
              </div>
              {response.commit.url && (
                <a
                  href={response.commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  🔗 View Commit on GitHub
                </a>
              )}
            </div>
          )}

          {formData.owner && formData.repo && formData.path && (
            <div className="file-links">
              <a
                href={`https://github.com/${formData.owner}/${formData.repo}/blob/${formData.branch || 'main'}/${formData.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                📄 View File on GitHub
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GithubFileUpdater;
