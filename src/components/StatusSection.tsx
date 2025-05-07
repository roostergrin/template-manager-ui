import React from "react";

interface StatusSectionProps {
  error: string | null;
  contentStatus: string;
  globalStatus: string;
  githubStatus: string;
  createRepoStatus: string;
}

const StatusSection: React.FC<StatusSectionProps> = ({
  error,
  contentStatus,
  globalStatus,
  githubStatus,
  createRepoStatus,
}) => (
  <div className="status-section">
    {error && <div className="status-section__error" role="alert">{error}</div>}
    {(contentStatus === "success" && globalStatus === "success" && githubStatus === "success") && (
      <div className="status-section__success" role="status">
        Content successfully generated and GitHub updated.
      </div>
    )}
    {createRepoStatus === "success" && (
      <div className="status-section__success" role="status">
        Repo created successfully.
      </div>
    )}
  </div>
);

export default StatusSection; 