import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { CheckCircle2 } from 'lucide-react';
import useProvisionSite from "../../hooks/useProvisionSite";
import { useGithubRepo } from "../../context/GithubRepoContext";
import useProgressTracking from "../../hooks/useProgressTracking";
import "./EnhancedProvisionSection.sass";

interface EnhancedProvisionSectionProps {
  onProvisioningComplete?: (data: any) => void;
}

export interface EnhancedProvisionSectionRef {
  triggerProvision: () => Promise<void>;
}

const EnhancedProvisionSection = forwardRef<EnhancedProvisionSectionRef, EnhancedProvisionSectionProps>(({
  onProvisioningComplete
}, ref) => {
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo, pageType } = state;
  const { setGithubOwner, setGithubRepo, setPageType } = actions;
  const [bucketName, setBucketName] = useState("");
  const [githubBranch, setGithubBranch] = useState("master");
  const [enableRedirect, setEnableRedirect] = useState(true);
  const [redirectSource, setRedirectSource] = useState("");
  const [redirectTarget, setRedirectTarget] = useState("");
  const completionCalledRef = useRef(false);

  // Auto-populate bucket name based on GitHub repo name
  useEffect(() => {
    if (githubRepo) {
      setBucketName(githubRepo);
    }
  }, [githubRepo]);

  // Auto-populate redirect domains based on bucket name
  useEffect(() => {
    if (bucketName) {
      // Smart detection: redirect non-www -> www
      // If domain starts with www., redirect non-www -> www
      // Otherwise, redirect non-www -> www (add www to target)
      if (bucketName.startsWith('www.')) {
        setRedirectSource(bucketName.substring(4)); // Remove www. for source
        setRedirectTarget(bucketName); // Keep www. for target
      } else {
        setRedirectSource(bucketName); // Non-www source
        setRedirectTarget(`www.${bucketName}`); // Add www. to target
      }
    }
  }, [bucketName]);

  const [response, status, provisionSite] = useProvisionSite();
  const [error, setError] = useState<string | null>(null);
  const { updateTaskStatus } = useProgressTracking();

  // Notify parent when provisioning is complete
  useEffect(() => {
    if (status === "success" && response && onProvisioningComplete && !completionCalledRef.current) {
      completionCalledRef.current = true;
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

  const handleProvision = useCallback(async () => {
    setError(null);
    completionCalledRef.current = false; // Reset completion flag
    updateTaskStatus('infrastructure', 'awsProvisioning', 'in-progress');

    try {
      await provisionSite({
        bucket_name: bucketName,
        github_owner: githubOwner,
        github_repo: githubRepo,
        github_branch: githubBranch,
        page_type: pageType,
        enable_redirect: enableRedirect,
        redirect_source_domain: enableRedirect ? redirectSource : undefined,
        redirect_target_domain: enableRedirect ? redirectTarget : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      updateTaskStatus('infrastructure', 'awsProvisioning', 'error');
    }
  }, [bucketName, githubOwner, githubRepo, githubBranch, pageType, enableRedirect, redirectSource, redirectTarget, provisionSite, updateTaskStatus]);

  // Expose the handleProvision method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerProvision: handleProvision
  }), [handleProvision]);

  return (
    <div className="enhanced-provision-section" role="region" aria-label="Provision Site">
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

      {/* WWW Redirect Toggle */}
      <div className="form-group redirect-group">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={enableRedirect}
            onChange={(e) => setEnableRedirect(e.target.checked)}
            aria-label="Enable www redirect"
          />
          <span className="checkbox-label">Enable non-WWW → WWW Redirect (301)</span>
        </label>
        {enableRedirect && redirectSource && redirectTarget && (
          <p className="redirect-preview">
            <span className="redirect-arrow">→</span> Redirects <strong>{redirectSource}</strong> to <strong>{redirectTarget}</strong>
          </p>
        )}
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
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Provisioning Successful!</h4>
          </div>
          
          <div className="success-details">
            <div className="detail-item">
              <strong>Bucket Name:</strong> {bucketName}
            </div>
            <div className="detail-item">
              <strong>GitHub Repository:</strong> {githubOwner}/{githubRepo}
            </div>
            <div className="detail-item">
              <strong>Branch:</strong> {githubBranch}
            </div>
            <div className="detail-item">
              <strong>Page Type:</strong> {pageType}
            </div>
            {response?.cloudfront_distribution_url && (
              <div className="detail-item">
                <strong>Site URL:</strong> 
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
              <div className="detail-item">
                <strong>Assets URL:</strong> 
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

          {response?.cloudfront_distribution_url && (
            <div className="repo-links">
              <a
                href={response.cloudfront_distribution_url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                🌐 View Live Site
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedProvisionSection.displayName = 'EnhancedProvisionSection';

export default EnhancedProvisionSection; 
