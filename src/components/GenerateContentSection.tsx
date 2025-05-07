import React from "react";

interface GenerateContentSectionProps {
  onGenerate: () => void;
  isStarted: boolean;
  contentStatus: string;
  globalStatus: string;
}

const GenerateContentSection: React.FC<GenerateContentSectionProps> = ({
  onGenerate,
  isStarted,
  contentStatus,
  globalStatus,
}) => (
  <div className="generate-content-section">
    <button
      className="generate-content-section__button"
      onClick={onGenerate}
      aria-label="Generate content and global data"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onGenerate(); }}
      disabled={isStarted && (contentStatus === "pending" || globalStatus === "pending")}
    >
      {isStarted && (contentStatus === "pending" || globalStatus === "pending") ? "Generating..." : "Generate Content"}
    </button>
    <div className="generate-content-section__status">
      <div className="generate-content-section__step">
        <span className="generate-content-section__step-label">Content:</span>
        <span className={"generate-content-section__step-status generate-content-section__step-status--" + contentStatus}>{contentStatus}</span>
      </div>
      <div className="generate-content-section__step">
        <span className="generate-content-section__step-label">Global:</span>
        <span className={"generate-content-section__step-status generate-content-section__step-status--" + globalStatus}>{globalStatus}</span>
      </div>
    </div>
  </div>
);

export default GenerateContentSection; 