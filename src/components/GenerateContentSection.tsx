import React from "react";

interface GenerateContentSectionProps {
  onGenerate: () => void;
  isStarted: boolean;
  contentStatus: string;
  globalStatus: string;
  elapsedTime: number;
}

const formatElapsedTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
};

const GenerateContentSection: React.FC<GenerateContentSectionProps> = ({
  onGenerate,
  isStarted,
  contentStatus,
  globalStatus,
  elapsedTime,
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
      {elapsedTime > 0 && (
        <div className="generate-content-section__elapsed">
          <span className="generate-content-section__elapsed-label">Time:</span>
          <span className="generate-content-section__elapsed-value">{formatElapsedTime(elapsedTime)}</span>
        </div>
      )}
    </div>
  </div>
);

export default GenerateContentSection; 