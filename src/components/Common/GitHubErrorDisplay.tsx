'use client';

import React from 'react';
import { parseGitHubError, GitHubError, formatGitHubErrorMessage } from '../../utils/githubErrorHandler';
import './GitHubErrorDisplay.sass';

interface GitHubErrorDisplayProps {
  error: unknown;
  repositoryOwner?: string;
  repositoryName?: string;
  onRetry?: () => void;
  className?: string;
}

const GitHubErrorDisplay: React.FC<GitHubErrorDisplayProps> = ({
  error,
  repositoryOwner,
  repositoryName,
  onRetry,
  className = ''
}) => {
  if (!error) return null;

  const gitHubError: GitHubError = parseGitHubError(error);
  const severityClass = `github-error-display--${gitHubError.severity}`;

  const handleRepoLinkClick = () => {
    if (repositoryOwner && repositoryName) {
      window.open(`https://github.com/${repositoryOwner}/${repositoryName}`, '_blank');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`github-error-display ${severityClass} ${className}`}>
      <div className="github-error-display__header">
        <span className="github-error-display__icon">
          {getSeverityIcon(gitHubError.severity)}
        </span>
        <h4 className="github-error-display__title">
          {gitHubError.message}
        </h4>
      </div>

      {gitHubError.suggestion && (
        <div className="github-error-display__suggestion">
          <span className="github-error-display__suggestion-icon">💡</span>
          <p className="github-error-display__suggestion-text">
            {gitHubError.suggestion}
          </p>
        </div>
      )}

      {gitHubError.actionRequired && (
        <div className="github-error-display__action">
          <span className="github-error-display__action-icon">🔧</span>
          <p className="github-error-display__action-text">
            <strong>Action needed:</strong> {gitHubError.actionRequired}
          </p>
        </div>
      )}

      {repositoryOwner && repositoryName && (
        <div className="github-error-display__repository">
          <span className="github-error-display__repository-label">Repository:</span>
          <button
            className="github-error-display__repository-link"
            onClick={handleRepoLinkClick}
            type="button"
            aria-label={`View repository ${repositoryOwner}/${repositoryName} on GitHub`}
          >
            {repositoryOwner}/{repositoryName}
            <span className="github-error-display__external-icon">🔗</span>
          </button>
        </div>
      )}

      <div className="github-error-display__actions">
        {onRetry && gitHubError.severity !== 'error' && (
          <button
            className="github-error-display__retry-button"
            onClick={onRetry}
            type="button"
          >
            🔄 Retry
          </button>
        )}
        
        <button
          className="github-error-display__help-button"
          onClick={() => {
            // Could open documentation or support
            console.log('GitHub error details:', formatGitHubErrorMessage(gitHubError));
          }}
          type="button"
        >
          📚 Get Help
        </button>
      </div>

      {/* Collapsible technical details */}
      <details className="github-error-display__technical">
        <summary className="github-error-display__technical-summary">
          Technical Details
        </summary>
        <div className="github-error-display__technical-content">
          <pre className="github-error-display__technical-data">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default GitHubErrorDisplay;
