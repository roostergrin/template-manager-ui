import React, { useState, useContext } from "react";
import useProvisionSite from "../hooks/useProvisionSite";
import { GithubRepoContext } from "../context/GithubRepoContext";
import "./ProvisionSiteSection.sass";

const ProvisionSiteSection: React.FC = () => {
  const { githubOwner, setGithubOwner, githubRepo, setGithubRepo } = useContext(GithubRepoContext);
  const [bucketName, setBucketName] = useState("");
  const [githubBranch, setGithubBranch] = useState("master");
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
        </div>
      )}
    </div>
  );
};

export default ProvisionSiteSection; 