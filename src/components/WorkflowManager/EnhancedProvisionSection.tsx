import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { CheckCircle2 } from 'lucide-react';
import useProvisionSite from "../../hooks/useProvisionSite";
import useCreateS3Bucket from "../../hooks/useCreateS3Bucket";
import useCreateDistribution from "../../hooks/useCreateDistribution";
import useCreateCodePipeline from "../../hooks/useCreateCodePipeline";
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

  // Individual resource hooks
  const [s3Response, s3Status, createS3] = useCreateS3Bucket();
  const [distResponse, distStatus, createDist] = useCreateDistribution();
  const [assetsDistResponse, assetsDistStatus, createAssetsDist] = useCreateDistribution();
  const [pipelineResponse, pipelineStatus, createPipeline] = useCreateCodePipeline();

  // Provision all hook
  const [response, status, provisionSite] = useProvisionSite();
  const [error, setError] = useState<string | null>(null);
  const { updateTaskStatus } = useProgressTracking();

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
      if (bucketName.startsWith('www.')) {
        setRedirectSource(bucketName.substring(4)); // Remove www. for source
        setRedirectTarget(bucketName); // Keep www. for target
      } else {
        setRedirectSource(bucketName); // Non-www source
        setRedirectTarget(`www.${bucketName}`); // Add www. to target
      }
    }
  }, [bucketName]);

  // Notify parent when provisioning is complete
  useEffect(() => {
    if (status === "success" && response && onProvisioningComplete && !completionCalledRef.current) {
      completionCalledRef.current = true;
      onProvisioningComplete({
        ...response,
        bucketName,
        githubOwner,
        githubRepo,
        githubBranch
      });
    } else if (status === "error") {
      updateTaskStatus('infrastructure', 'awsProvisioning', 'error');
    }
  }, [status, response, onProvisioningComplete, bucketName, githubOwner, githubRepo, githubBranch, updateTaskStatus]);

  // Individual resource handlers
  const handleCreateS3Bucket = useCallback(async () => {
    setError(null);
    try {
      await createS3({
        bucket_name: bucketName,
        site_id: bucketName
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create S3 bucket");
    }
  }, [bucketName, createS3]);

  const handleCreateDistribution = useCallback(async () => {
    setError(null);
    try {
      await createDist({
        s3_bucket_name: bucketName,
        distribution_type: pageType === "landing" ? "/landing" : "/dist",
        comment: `CloudFront distribution for ${bucketName}`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create distribution");
    }
  }, [bucketName, pageType, createDist]);

  const handleCreateAssetsDistribution = useCallback(async () => {
    setError(null);
    try {
      await createAssetsDist({
        s3_bucket_name: bucketName,
        distribution_type: "/assets",
        comment: `Assets distribution for ${bucketName}`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assets distribution");
    }
  }, [bucketName, createAssetsDist]);

  const handleCreatePipeline = useCallback(async () => {
    setError(null);
    try {
      await createPipeline({
        pipeline_name: bucketName,
        bucket_name: bucketName,
        github_owner: githubOwner,
        github_repo: githubRepo,
        github_branch: githubBranch,
        distribution_type: pageType === "landing" ? "/landing" : "/dist"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline");
    }
  }, [bucketName, githubOwner, githubRepo, githubBranch, pageType, createPipeline]);

  // Provision all handler
  const handleProvision = useCallback(async () => {
    setError(null);
    completionCalledRef.current = false;
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

      {/* Individual Resource Buttons */}
      <div className="form-section">
        <h4>Individual Resources</h4>
        <div className="button-grid">
          <button
            className="secondary-button"
            onClick={handleCreateS3Bucket}
            disabled={!bucketName || s3Status === "pending"}
            aria-label="Create S3 bucket"
            tabIndex={0}
          >
            {s3Status === "pending" ? "Creating..." : "1. Create S3 Bucket"}
          </button>

          <button
            className="secondary-button"
            onClick={handleCreateDistribution}
            disabled={!bucketName || distStatus === "pending"}
            aria-label="Create CloudFront distribution"
            tabIndex={0}
          >
            {distStatus === "pending" ? "Creating..." : "2. Create Distribution"}
          </button>

          <button
            className="secondary-button"
            onClick={handleCreateAssetsDistribution}
            disabled={!bucketName || assetsDistStatus === "pending"}
            aria-label="Create assets distribution"
            tabIndex={0}
          >
            {assetsDistStatus === "pending" ? "Creating..." : "3. Create Assets Distribution"}
          </button>

          <button
            className="secondary-button"
            onClick={handleCreatePipeline}
            disabled={!bucketName || !githubOwner || !githubRepo || !githubBranch || pipelineStatus === "pending"}
            aria-label="Create CodePipeline"
            tabIndex={0}
          >
            {pipelineStatus === "pending" ? "Creating..." : "4. Create Pipeline"}
          </button>
        </div>
      </div>

      {/* Provision All Button */}
      <div className="form-section">
        <h4>Or Provision Everything</h4>
        <button
          className="primary-button"
          onClick={handleProvision}
          disabled={!bucketName || !githubOwner || !githubRepo || !githubBranch || status === "pending"}
          aria-label="Provision site with S3 and CloudFront"
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleProvision(); }}
        >
          {status === "pending" ? "Provisioning..." : "Provision All Resources"}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}

      {/* Individual Success Messages */}
      {s3Status === "success" && s3Response && (
        <div className="success-section" role="status">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>S3 Bucket Created!</h4>
          </div>
          <div className="success-details">
            <div className="detail-item">
              <strong>Bucket:</strong> {s3Response.bucket_name}
            </div>
            <div className="detail-item">
              <strong>Region:</strong> {s3Response.region}
            </div>
            <div className="detail-item">
              <strong>Status:</strong> {s3Response.already_existed ? "Already existed" : "Newly created"}
            </div>
          </div>
        </div>
      )}

      {distStatus === "success" && distResponse && (
        <div className="success-section" role="status">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Distribution Created!</h4>
          </div>
          <div className="success-details">
            <div className="detail-item">
              <strong>Distribution ID:</strong> {distResponse.distribution_id}
            </div>
            <div className="detail-item">
              <strong>URL:</strong>
              <a
                href={distResponse.distribution_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '8px' }}
              >
                {distResponse.distribution_url}
              </a>
            </div>
          </div>
        </div>
      )}

      {assetsDistStatus === "success" && assetsDistResponse && (
        <div className="success-section" role="status">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Assets Distribution Created!</h4>
          </div>
          <div className="success-details">
            <div className="detail-item">
              <strong>Distribution ID:</strong> {assetsDistResponse.distribution_id}
            </div>
            <div className="detail-item">
              <strong>URL:</strong>
              <a
                href={assetsDistResponse.distribution_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '8px' }}
              >
                {assetsDistResponse.distribution_url}
              </a>
            </div>
          </div>
        </div>
      )}

      {pipelineStatus === "success" && pipelineResponse && (
        <div className="success-section" role="status">
          <div className="success-header">
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Pipeline Created!</h4>
          </div>
          <div className="success-details">
            <div className="detail-item">
              <strong>Pipeline:</strong> {pipelineResponse.pipeline_name}
            </div>
            <div className="detail-item">
              <strong>Status:</strong> {pipelineResponse.already_existed ? "Already existed" : "Newly created"}
            </div>
          </div>
        </div>
      )}

      {/* Provision All Success Message */}
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
