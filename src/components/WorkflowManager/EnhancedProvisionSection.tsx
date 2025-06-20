import React, { useState, useContext, useEffect } from "react";
import useProvisionSite from "../../hooks/useProvisionSite";
import { GithubRepoContext } from "../../context/GithubRepoContext";
import "../ProvisionSiteSection.sass";

interface EnhancedProvisionSectionProps {
  onProvisioningComplete?: (data: any) => void;
}

const EnhancedProvisionSection: React.FC<EnhancedProvisionSectionProps> = ({
  onProvisioningComplete
}) => {
  const { githubOwner, setGithubOwner, githubRepo, setGithubRepo } = useContext(GithubRepoContext);
  const [bucketName, setBucketName] = useState("");
  const [githubBranch, setGithubBranch] = useState("master");
  const [pageType, setPageType] = useState<"template" | "landing">("template");
  const [response, status, provisionSite] = useProvisionSite();
  const [error, setError] = useState<string | null>(null);

  // Notify parent when provisioning is complete
  useEffect(() => {
    if (status === "success" && response && onProvisioningComplete) {
      onProvisioningComplete({
        ...response,
        bucketName, // Include the bucket name used
        githubOwner,
        githubRepo,
        githubBranch
      });
    }
  }, [status, response, onProvisioningComplete, bucketName, githubOwner, githubRepo, githubBranch]);

  const handleProvision = async () => {
    setError(null);
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
    }
  };

  return (
    <div className="provision-site-section" role="region" aria-label="Provision Site">
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="github-owner">GitHub Owner</label>
        <input
          id="github-owner"
          className="provision-site-section__input"
          type="text"
          value={githubOwner}
          onChange={e => setGithubOwner(e.target.value)}
          placeholder="Enter GitHub owner"
          aria-label="GitHub owner"
          tabIndex={0}
        />
      </div>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="github-repo">GitHub Repo</label>
        <input
          id="github-repo"
          className="provision-site-section__input"
          type="text"
          value={githubRepo}
          onChange={e => setGithubRepo(e.target.value)}
          placeholder="Enter GitHub repo"
          aria-label="GitHub repo"
          tabIndex={0}
        />
      </div>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="github-branch">GitHub Branch</label>
        <input
          id="github-branch"
          className="provision-site-section__input"
          type="text"
          value={githubBranch}
          onChange={e => setGithubBranch(e.target.value)}
          placeholder="Enter GitHub branch"
          aria-label="GitHub branch"
          tabIndex={0}
        />
      </div>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="bucket-name">S3 Bucket Name</label>
        <input
          id="bucket-name"
          className="provision-site-section__input"
          type="text"
          value={bucketName}
          onChange={e => setBucketName(e.target.value)}
          placeholder="Enter S3 bucket name"
          aria-label="S3 bucket name"
          tabIndex={0}
        />
      </div>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label">Page Type</label>
        <div className="provision-site-section__radio-group">
          <label className="provision-site-section__radio-label">
            <input
              type="radio"
              name="page-type"
              value="template"
              checked={pageType === "template"}
              onChange={() => setPageType("template")}
              className="provision-site-section__radio"
              aria-label="Template page"
            />
            Template Page
          </label>
          <label className="provision-site-section__radio-label">
            <input
              type="radio"
              name="page-type"
              value="landing"
              checked={pageType === "landing"}
              onChange={() => setPageType("landing")}
              className="provision-site-section__radio"
              aria-label="Landing page"
            />
            Landing Page
          </label>
        </div>
      </div>
      <button
        className="provision-site-section__button"
        onClick={handleProvision}
        disabled={!bucketName || !githubOwner || !githubRepo || !githubBranch || status === "pending"}
        aria-label="Provision site with S3 and CloudFront"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleProvision(); }}
      >
        {status === "pending" ? "Provisioning..." : "Provision Site"}
      </button>
      {error && (
        <div className="provision-site-section__error" role="alert">{error}</div>
      )}
      {status === "success" && response && (
        <div className="provision-site-section__success" role="status">
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
            <pre className="provision-site-section__json">{JSON.stringify(response, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default EnhancedProvisionSection; 