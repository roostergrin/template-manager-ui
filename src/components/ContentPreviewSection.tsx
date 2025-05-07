import React from "react";

interface ContentPreviewSectionProps {
  pagesContent: object | null;
  globalContent: object | null;
  onDownloadPages: () => void;
  onDownloadGlobal: () => void;
  downloadUrlPages: string | null;
  downloadUrlGlobal: string | null;
}

const getPreview = (data: object | null) => {
  if (!data) return null;
  const json = JSON.stringify(data, null, 2);
  const lines = json.split("\n").slice(0, 5);
  return (
    <pre className="content-preview-section__preview" aria-label="Content preview">
      {lines.join("\n")}
      {json.split("\n").length > 5 ? "\n..." : ""}
    </pre>
  );
};

const ContentPreviewSection: React.FC<ContentPreviewSectionProps> = ({
  pagesContent,
  globalContent,
  onDownloadPages,
  onDownloadGlobal,
  downloadUrlPages,
  downloadUrlGlobal,
}) => (
  <div className="content-preview-section">
    <div className="content-preview-section__block">
      <h5 className="content-preview-section__title">Pages Content</h5>
      {getPreview(pagesContent)}
      <button
        className="content-preview-section__download"
        onClick={onDownloadPages}
        aria-label="Download pages content JSON"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onDownloadPages(); }}
        disabled={!downloadUrlPages}
      >
        Download Pages JSON
      </button>
    </div>
    <div className="content-preview-section__block">
      <h5 className="content-preview-section__title">Global Content</h5>
      {getPreview(globalContent)}
      <button
        className="content-preview-section__download"
        onClick={onDownloadGlobal}
        aria-label="Download global content JSON"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onDownloadGlobal(); }}
        disabled={!downloadUrlGlobal}
      >
        Download Global JSON
      </button>
    </div>
  </div>
);

export default ContentPreviewSection; 