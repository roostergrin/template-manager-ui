"use client";
import React, { useState, useCallback } from "react";
import { SitemapSection } from "../types/SitemapTypes";
import { QuestionnaireData } from "../types/APIServiceTypes";
import { getEffectiveQuestionnaireData, isMarkdownData } from "../utils/questionnaireDataUtils";
import useGenerateContent from "../hooks/useGenerateContent";

export type ExportedSitemapContent = {
  pages: SitemapSection[];
  questionnaireData: QuestionnaireData;
  generatedContent: any;
};

interface SitemapContentExportProps {
  pages: SitemapSection[];
  questionnaireData: QuestionnaireData;
  onExport: (data: ExportedSitemapContent) => void;
}

const SitemapContentExport: React.FC<SitemapContentExportProps> = ({
  pages,
  questionnaireData,
  onExport,
}) => {
  const [, generateContentStatus, generateContentMutation] = useGenerateContent();
  const [exportedData, setExportedData] = useState<ExportedSitemapContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);

  const handleGenerate = useCallback(() => {
    setError(null);
    generateContentMutation({ sitemap_data: { pages, questionnaireData: effectiveQuestionnaireData }, site_type: 'stinson', assign_images: true })
      .then((generatedContent: any) => {
        const data: ExportedSitemapContent = { pages, questionnaireData: effectiveQuestionnaireData, generatedContent };
        setExportedData(data);
        onExport(data);
      })
      .catch(() => {
        setError("Failed to generate content. Please try again.");
      });
  }, [pages, effectiveQuestionnaireData, generateContentMutation, onExport]);

  const handleDownload = useCallback(() => {
    if (!exportedData) return;
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap-content.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportedData]);

  const handleCopy = useCallback(() => {
    if (!exportedData) return;
    navigator.clipboard.writeText(JSON.stringify(exportedData, null, 2));
  }, [exportedData]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded bg-gray-50 mt-6">
      {/* Data Source Indicator */}
      {isMarkdownData(questionnaireData) && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📝 Using Markdown Data Source:</strong> Content generation will use the markdown content as questionnaire data.
          </p>
        </div>
      )}
      
      <div className="flex gap-2 items-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={handleGenerate}
          aria-label="Generate Content JSON"
          tabIndex={0}
          disabled={generateContentStatus === "pending"}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") handleGenerate();
          }}
        >
          {generateContentStatus === "pending" ? "Generating..." : "Generate Content JSON"}
        </button>
        <button
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          onClick={handleDownload}
          aria-label="Download Content JSON"
          tabIndex={0}
          disabled={!exportedData}
          onKeyDown={e => {
            if ((e.key === "Enter" || e.key === " ") && exportedData) handleDownload();
          }}
        >
          <span aria-hidden="true">⬇️</span> Download
        </button>
        <button
          className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={handleCopy}
          aria-label="Copy Content JSON to Clipboard"
          tabIndex={0}
          disabled={!exportedData}
          onKeyDown={e => {
            if ((e.key === "Enter" || e.key === " ") && exportedData) handleCopy();
          }}
        >
          <span aria-hidden="true">📋</span> Copy
        </button>
      </div>
      {error && (
        <span className="text-red-600" role="alert" aria-live="assertive">{error}</span>
      )}
      {exportedData && (
        <textarea
          className="w-full h-48 p-2 border rounded font-mono text-xs bg-white text-gray-800"
          value={JSON.stringify(exportedData, null, 2)}
          readOnly
          aria-label="Exported Content JSON"
          tabIndex={0}
        />
      )}
      {generateContentStatus === "success" && (
        <span className="text-green-600" role="status" aria-live="polite">
          Content generated successfully!
        </span>
      )}
    </div>
  );
};

export default SitemapContentExport; 