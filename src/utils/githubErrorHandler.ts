// GitHub-specific error handler utility
// Provides user-friendly error messages for common GitHub repository issues

export interface GitHubError {
  message: string;
  suggestion: string;
  actionRequired?: string;
  severity: 'error' | 'warning' | 'info';
}

export const parseGitHubError = (error: unknown): GitHubError => {
  // Default error structure
  let errorMessage = 'An unexpected error occurred';
  const suggestion = 'Please try again or contact support if the issue persists.';
  const severity: 'error' | 'warning' | 'info' = 'error';
  const actionRequired = undefined;

  // Extract error details
  if (error && typeof error === 'object') {
    const err = error as any;
    
    // Handle Axios errors
    if (err.response) {
      const status = err.response.status;
      const responseData = err.response.data;
      
      switch (status) {
        case 404:
          if (responseData?.detail?.includes('Repository') && responseData?.detail?.includes('not found')) {
            return {
              message: 'Repository not found or not accessible',
              suggestion: 'Please verify the repository owner and name are correct, and that the repository exists on GitHub.',
              actionRequired: 'Check repository details in GitHub settings',
              severity: 'error'
            };
          }
          break;
          
        case 401:
          return {
            message: 'GitHub authentication failed',
            suggestion: 'The backend server needs a valid GitHub token to access repositories.',
            actionRequired: 'Contact administrator to configure GitHub authentication',
            severity: 'error'
          };
          
        case 403:
          if (responseData?.detail?.includes('rate limit') || responseData?.detail?.includes('API rate')) {
            return {
              message: 'GitHub API rate limit exceeded',
              suggestion: 'Please wait a few minutes before trying again.',
              actionRequired: 'Wait and retry',
              severity: 'warning'
            };
          } else {
            return {
              message: 'Access forbidden to repository',
              suggestion: 'The backend may not have permission to access this repository.',
              actionRequired: 'Verify repository permissions',
              severity: 'error'
            };
          }
          
        case 409:
          if (responseData?.detail?.includes('sha')) {
            return {
              message: 'File update conflict',
              suggestion: 'The file exists but no SHA was provided. This is required to update existing files.',
              actionRequired: 'File needs to be refreshed before updating',
              severity: 'warning'
            };
          }
          break;
          
        case 422:
          return {
            message: 'Invalid request data',
            suggestion: 'Please check that all required fields are filled correctly (owner, repo, file path).',
            actionRequired: 'Review form inputs',
            severity: 'error'
          };
          
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            message: 'Server error occurred',
            suggestion: 'This is likely a temporary issue. Please try again in a few moments.',
            actionRequired: 'Retry operation',
            severity: 'error'
          };
      }
      
      // Generic handling for response errors
      errorMessage = responseData?.detail || responseData?.message || `Server responded with status ${status}`;
    }
    
    // Handle network/connection errors
    else if (err.code === 'ECONNREFUSED') {
      return {
        message: 'Backend server not reachable',
        suggestion: 'The backend server appears to be offline or not responding.',
        actionRequired: 'Contact administrator',
        severity: 'error'
      };
    }
    
    else if (err.code === 'ENOTFOUND') {
      return {
        message: 'Network connection error',
        suggestion: 'Unable to connect to the backend server.',
        actionRequired: 'Check network connection',
        severity: 'error'
      };
    }
    
    else if (err.message) {
      errorMessage = err.message;
    }
  }
  
  // Handle string errors
  else if (typeof error === 'string') {
    errorMessage = error;
  }

  return {
    message: errorMessage,
    suggestion,
    actionRequired,
    severity
  };
};

export const formatGitHubErrorMessage = (error: GitHubError): string => {
  let message = `❌ ${error.message}`;
  
  if (error.suggestion) {
    message += `\n\n💡 ${error.suggestion}`;
  }
  
  if (error.actionRequired) {
    message += `\n\n🔧 Action needed: ${error.actionRequired}`;
  }
  
  return message;
};

// Utility to check if a repository name is valid
export const validateRepositoryDetails = (owner: string, repo: string): GitHubError | null => {
  if (!owner || !owner.trim()) {
    return {
      message: 'GitHub owner is required',
      suggestion: 'Please enter the GitHub username or organization name.',
      actionRequired: 'Fill in GitHub Owner field',
      severity: 'error'
    };
  }
  
  if (!repo || !repo.trim()) {
    return {
      message: 'Repository name is required',
      suggestion: 'Please enter the repository name.',
      actionRequired: 'Fill in Repository Name field',
      severity: 'error'
    };
  }
  
  // Basic validation for GitHub naming conventions
  const validNamePattern = /^[a-zA-Z0-9._-]+$/;
  
  if (!validNamePattern.test(owner.trim())) {
    return {
      message: 'Invalid GitHub owner name',
      suggestion: 'GitHub usernames can only contain alphanumeric characters, dashes, and underscores.',
      actionRequired: 'Correct GitHub Owner field',
      severity: 'error'
    };
  }
  
  if (!validNamePattern.test(repo.trim())) {
    return {
      message: 'Invalid repository name',
      suggestion: 'Repository names can only contain alphanumeric characters, dashes, underscores, and dots.',
      actionRequired: 'Correct Repository Name field',
      severity: 'error'
    };
  }
  
  return null; // No validation errors
};
