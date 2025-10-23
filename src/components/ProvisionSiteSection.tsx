import React, { useState } from "react";
import useProvisionSite from "../hooks/useProvisionSite";
import { useGithubRepo } from "../context/GithubRepoContext";
import "./ProvisionSiteSection.sass";

const ProvisionSiteSection: React.FC = () => {
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;
  const [bucketName, setBucketName] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [pageType, setPageType] = useState<"template" | "landing">("template");
  const [response, status, provisionSite] = useProvisionSite();
  const [error, setError] = useState<string | null>(null);

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
      <h4 className="provision-site-section__title">Provision Site (S3 + CloudFront + Pipeline)</h4>
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
          <pre className="provision-site-section__json">{JSON.stringify(response, null, 2)}</pre>
          {response?.cloudfront_distribution_url && (
            <a
              href={response.cloudfront_distribution_url}
              className="provision-site-section__cloudfront-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open CloudFront Distribution in new tab"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { window.open(response.cloudfront_distribution_url, '_blank', 'noopener,noreferrer'); } }}
            >
              Open CloudFront Distribution
            </a>
          )}
          {response?.assets_distribution_url && (
            <a
              href={response.assets_distribution_url}
              className="provision-site-section__cloudfront-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Assets Distribution in new tab"
              tabIndex={0}
              style={{ marginLeft: '1rem' }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { window.open(response.assets_distribution_url, '_blank', 'noopener,noreferrer'); } }}
            >
              Open Assets Distribution
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProvisionSiteSection; 
