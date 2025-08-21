import React, { useState, useEffect } from "react";
import useProvisionSite from "../../hooks/useProvisionSite";
import { useGithubRepo } from "../../context/GithubRepoContext";
import useProgressTracking from "../../hooks/useProgressTracking";
import ProgressIndicator from "../Common/ProgressIndicator";
import "../ProvisionSiteSection.sass";

interface EnhancedProvisionSectionProps {
  onProvisioningComplete?: (data: any) => void;
}

const EnhancedProvisionSection: React.FC<EnhancedProvisionSectionProps> = ({
  onProvisioningComplete
}) => {
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;
  const [bucketName, setBucketName] = useState("");
  const [githubBranch, setGithubBranch] = useState("master");
  const [pageType, setPageType] = useState<"template" | "landing">("template");
  const [response, status, provisionSite] = useProvisionSite();
  const [error, setError] = useState<string | null>(null);
  const { progressState, updateTaskStatus } = useProgressTracking();

  // Notify parent when provisioning is complete
  useEffect(() => {
    if (status === "success" && response && onProvisioningComplete) {
      updateTaskStatus('infrastructure', 'awsProvisioning', 'completed');
      onProvisioningComplete({
        ...response,
        bucketName, // Include the bucket name used
        githubOwner,
        githubRepo,
        githubBranch
      });
    } else if (status === "error") {
      updateTaskStatus('infrastructure', 'awsProvisioning', 'error');
    }
  }, [status, response, onProvisioningComplete, bucketName, githubOwner, githubRepo, githubBranch, updateTaskStatus]);

  const handleProvision = async () => {
    setError(null);
    updateTaskStatus('infrastructure', 'awsProvisioning', 'in-progress');
    
    try {
      await provisionSite({
        bucket_name: bucketName,
        github_owner: githubOwner,
        github_repo: githubRepo,
        github_branch: githubBranch,
        page_type: pageType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      updateTaskStatus('infrastructure', 'awsProvisioning', 'error');
    }
  };

  return (
    <div role="region" aria-label="Provision Site">
      <div className="provision-site-section__header">
        <h4 className="provision-site-section__title">AWS Infrastructure Provisioning</h4>
        <ProgressIndicator 
          status={progressState.infrastructure.awsProvisioning} 
          size="medium"
          showLabel={true}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="github-owner">GitHub Owner</label>
        <input
          id="github-owner"
          type="text"
          value={githubOwner}
          onChange={e => setGithubOwner(e.target.value)}
          placeholder="Enter GitHub owner"
          aria-label="GitHub owner"
          tabIndex={0}
        />
      </div>
      <div className="form-group">
        <label htmlFor="github-repo">GitHub Repo</label>
        <input
          id="github-repo"
          type="text"
          value={githubRepo}
          onChange={e => setGithubRepo(e.target.value)}
          placeholder="Enter GitHub repo"
          aria-label="GitHub repo"
          tabIndex={0}
        />
      </div>
      <div className="form-group">
        <label htmlFor="github-branch">GitHub Branch</label>
        <input
          id="github-branch"
          type="text"
          value={githubBranch}
          onChange={e => setGithubBranch(e.target.value)}
          placeholder="Enter GitHub branch"
          aria-label="GitHub branch"
          tabIndex={0}
        />
      </div>
      <div className="form-group">
        <label htmlFor="bucket-name">S3 Bucket Name</label>
        <input
          id="bucket-name"
          type="text"
          value={bucketName}
          onChange={e => setBucketName(e.target.value)}
          placeholder="Enter S3 bucket name"
          aria-label="S3 bucket name"
          tabIndex={0}
        />
      </div>
      <div className="form-group">
        <label>Page Type</label>
        <div className="radio-group">
          <div className="radio-option">
            <input
              type="radio"
              name="page-type"
              value="template"
              checked={pageType === "template"}
              onChange={() => setPageType("template")}
              aria-label="Template page"
            />
            <span>Template Page</span>
          </div>
          <div className="radio-option">
            <input
              type="radio"
              name="page-type"
              value="landing"
              checked={pageType === "landing"}
              onChange={() => setPageType("landing")}
              aria-label="Landing page"
            />
            <span>Landing Page</span>
          </div>
        </div>
      </div>
      <button
        className="primary-button"
        onClick={handleProvision}
        disabled={!bucketName || !githubOwner || !githubRepo || !githubBranch || status === "pending"}
        aria-label="Provision site with S3 and CloudFront"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleProvision(); }}
      >
        {status === "pending" ? "Provisioning..." : "Provision Site"}
      </button>
      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}
      {status === "success" && response && (
        <div className="success-section" role="status">
          <div className="success-summary">
            <h4>🎉 Provisioning Successful!</h4>
            <div className="success-details">
              <div><strong>Bucket:</strong> {bucketName}</div>
              {response?.cloudfront_distribution_url && (
                <div><strong>Site URL:</strong> 
                  <a
                    href={response.cloudfront_distribution_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '8px' }}
                  >
                    {response.cloudfront_distribution_url}
                  </a>
                </div>
              )}
              {response?.assets_distribution_url && (
                <div><strong>Assets URL:</strong> 
                  <a
                    href={response.assets_distribution_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '8px' }}
                  >
                    {response.assets_distribution_url}
                  </a>
                </div>
              )}
            </div>
          </div>
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Full Response</summary>
            <pre className="json-display">{JSON.stringify(response, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default EnhancedProvisionSection; 
