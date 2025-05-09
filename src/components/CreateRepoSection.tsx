import React, { useContext } from "react";
import { GithubRepoContext } from "../context/GithubRepoContext";

interface CreateRepoSectionProps {
  newRepoName: string;
  setNewRepoName: (name: string) => void;
  createRepoStatus: string;
  handleCreateRepo: () => void;
  error: string | null;
  createRepoData: any;
}

const CreateRepoSection: React.FC<CreateRepoSectionProps> = ({
  newRepoName,
  setNewRepoName,
  createRepoStatus,
  handleCreateRepo,
  error,
  createRepoData,
}) => {
  const { githubOwner, setGithubOwner } = useContext(GithubRepoContext);
  const { githubRepo, setGithubRepo } = useContext(GithubRepoContext);

  return (
    <div className="create-repo-section">
      <label className="create-repo-section__label" htmlFor="new-repo-name">New GitHub Repo Name</label>
      <input
        id="new-repo-name"
        className="create-repo-section__input"
        type="text"
        value={newRepoName}
        onChange={e => setNewRepoName(e.target.value)}
        placeholder="Enter new repo name"
        aria-label="New GitHub repo name"
        tabIndex={0}
      />
      <button
        className="create-repo-section__button"
        style={{ marginTop: '0.5rem' }}
        onClick={handleCreateRepo}
        disabled={!newRepoName || createRepoStatus === "pending"}
        aria-label="Create GitHub repo from template"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleCreateRepo(); }}
      >
        {createRepoStatus === "pending" ? "Creating Repo..." : "Create Repo from Template"}
      </button>
      {createRepoStatus === "error" && (
        <div className="create-repo-section__error" role="alert">
          {error || "Failed to create repo."}
        </div>
      )}
      {createRepoStatus === "success" && createRepoData && (
        <div className="create-repo-section__success" role="status">
          Repo created: <strong>{createRepoData.full_name}</strong><br />
          Owner: <strong>{createRepoData.owner}</strong> | Repo: <strong>{createRepoData.repo}</strong>
        </div>
      )}
    </div>
  );
};

export default CreateRepoSection; 