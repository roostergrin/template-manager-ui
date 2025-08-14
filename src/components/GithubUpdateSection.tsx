import React from "react";
import { useGithubRepo } from "../context/GithubRepoContext";

interface GithubUpdateSectionProps {
  githubStatus: string;
  handleUpdateGithub: () => void;
  disabled: boolean;
}

const GithubUpdateSection: React.FC<GithubUpdateSectionProps> = ({
  githubStatus,
  handleUpdateGithub,
  disabled,
}) => {
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;

  return (
    <div className="github-update-section">
      <div className="github-update-section__input-group">
        <label className="github-update-section__label" htmlFor="github-owner">GitHub Owner</label>
        <input
          id="github-owner"
          className="github-update-section__input"
          type="text"
          value={githubOwner}
          onChange={e => setGithubOwner(e.target.value)}
          placeholder="Enter GitHub owner"
          aria-label="GitHub owner"
          tabIndex={0}
        />
      </div>
      <div className="github-update-section__input-group">
        <label className="github-update-section__label" htmlFor="github-repo">GitHub Repo</label>
        <input
          id="github-repo"
          className="github-update-section__input"
          type="text"
          value={githubRepo}
          onChange={e => setGithubRepo(e.target.value)}
          placeholder="Enter GitHub repo"
          aria-label="GitHub repo"
          tabIndex={0}
        />
      </div>
      <button
        className="github-update-section__button"
        onClick={handleUpdateGithub}
        disabled={disabled}
        aria-label="Update GitHub with generated content"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleUpdateGithub(); }}
      >
        {githubStatus === "pending" ? "Updating GitHub..." : "Update GitHub"}
      </button>
      <div className="github-update-section__status">
        <span className={"github-update-section__step-status github-update-section__step-status--" + githubStatus}>{githubStatus}</span>
      </div>
    </div>
  );
};

export default GithubUpdateSection; 