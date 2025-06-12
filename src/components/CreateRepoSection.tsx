import React, { useContext, useState } from "react";
import { GithubRepoContext } from "../context/GithubRepoContext";

interface CreateRepoSectionProps {
  newRepoName: string;
  setNewRepoName: (name: string) => void;
  templateRepoName: string;
  setTemplateRepoName: (name: string) => void;
  createRepoStatus: string;
  handleCreateRepo: () => void;
  error: string | null;
  createRepoData: any;
}

const CreateRepoSection: React.FC<CreateRepoSectionProps> = ({
  newRepoName,
  setNewRepoName,
  templateRepoName,
  setTemplateRepoName,
  createRepoStatus,
  handleCreateRepo,
  error,
  createRepoData,
}) => {
  const { githubOwner, setGithubOwner } = useContext(GithubRepoContext);
  const { githubRepo, setGithubRepo } = useContext(GithubRepoContext);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://github.com/${createRepoData.owner}/${createRepoData.repo}.git`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

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
      <label className="create-repo-section__label" htmlFor="template-repo-name" style={{ marginTop: '0.5rem' }}>Template Repo Name</label>
      <input
        id="template-repo-name"
        className="create-repo-section__input"
        type="text"
        value={templateRepoName}
        onChange={e => setTemplateRepoName(e.target.value)}
        placeholder="e.g., ai-template-stinson"
        aria-label="Template repo name"
        tabIndex={0}
      />
      <button
        className="create-repo-section__button"
        style={{ marginTop: '0.5rem' }}
        onClick={handleCreateRepo}
        disabled={!newRepoName || !templateRepoName || createRepoStatus === "pending"}
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
          <p>Repo created successfully!</p>
          <div className="create-repo-section__repo-url" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f5f5f5', 
            padding: '8px 12px', 
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            <code style={{ 
              flex: 1, 
              overflow: 'auto', 
              whiteSpace: 'nowrap', 
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              https://github.com/{createRepoData.owner}/{createRepoData.repo}.git
            </code>
            <button 
              className="create-repo-section__copy-button"
              onClick={handleCopy}
              aria-label="Copy repository URL"
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                background: '#4d4ec1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRepoSection; 