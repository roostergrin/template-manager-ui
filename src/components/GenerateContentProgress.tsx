import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateContentQueryFunction } from "../services/generateContentService";
import { generateGlobalQueryFunction } from "../services/generateGlobalService";
import useUpdateGithubRepoDataFiles from "../hooks/useUpdateGithubRepoDataFiles";
import useCreateGithubRepoFromTemplate from "../hooks/useCreateGithubRepoFromTemplate";
import { GenerateContentRequest } from "../types/APIServiceTypes";
import { getEffectiveQuestionnaireData, isMarkdownData } from "../utils/questionnaireDataUtils";
import GenerateContentSection from "./GenerateContentSection";
import ContentPreviewSection from "./ContentPreviewSection";
import CreateRepoSection from "./CreateRepoSection";
import GithubUpdateSection from "./GithubUpdateSection";
import StatusSection from "./StatusSection";
import "./GenerateContentProgress.sass";
import { useGithubRepo } from "../context/GithubRepoContext";

export interface GenerateContentProgressProps {
  pages: any;
  questionnaireData: any;
  siteType: string;
}

const GenerateContentProgress: React.FC<GenerateContentProgressProps> = ({
  pages,
  questionnaireData,
  siteType,
}) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, githubStatus, updateGithub] = useUpdateGithubRepoDataFiles();
  const [createRepoData, createRepoStatus, createRepo] = useCreateGithubRepoFromTemplate();
  const [newRepoName, setNewRepoName] = useState("");
  const [templateRepoName, setTemplateRepoName] = useState("");
  const [pagesContent, setPagesContent] = useState<Record<string, unknown> | null>(null);
  const [globalContent, setGlobalContent] = useState<Record<string, unknown> | null>(null);
  const [downloadUrlPages, setDownloadUrlPages] = useState<string | null>(null);
  const [downloadUrlGlobal, setDownloadUrlGlobal] = useState<string | null>(null);
  const [useRgTemplateAssets, setUseRgTemplateAssets] = useState(true);

  // Use context for githubOwner and githubRepo
  const { state, actions } = useGithubRepo();
  const { githubOwner, githubRepo } = state;
  const { setGithubOwner, setGithubRepo } = actions;

  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);

  // Prepare request object
  const req: GenerateContentRequest = {
    sitemap_data: {
      pages,
      questionnaireData: effectiveQuestionnaireData,
    },
    site_type: siteType,
    assign_images: useRgTemplateAssets,
  };

  // Fetch global content
  const {
    data: globalData,
    status: globalStatus,
    error: globalError,
  } = useQuery({
    queryKey: ["generate-global", req],
    queryFn: generateGlobalQueryFunction,
    enabled: shouldFetch,
  });

  // Fetch pages content
  const {
    data: pagesData,
    status: pagesStatus,
    error: pagesError,
  } = useQuery({
    queryKey: ["generate-content", req],
    queryFn: generateContentQueryFunction,
    enabled: shouldFetch,
  });

  // Update state when data is ready
  useEffect(() => {
    if (globalData) {
      const extracted = (globalData as any)?.global_data ?? (globalData as unknown as Record<string, unknown>);
      setGlobalContent(extracted);
      const jsonGlobal = JSON.stringify(extracted, null, 2);
      const blobGlobal = new Blob([jsonGlobal], { type: "application/json" });
      setDownloadUrlGlobal(URL.createObjectURL(blobGlobal));
    }
    if (globalStatus === "error") {
      setGlobalContent(null);
      setDownloadUrlGlobal(null);
      setError(globalError instanceof Error ? globalError.message : "An error occurred");
    }
  }, [globalData, globalStatus, globalError]);

  useEffect(() => {
    if (pagesData) {
      setPagesContent(pagesData);
      const jsonPages = JSON.stringify(pagesData, null, 2);
      const blobPages = new Blob([jsonPages], { type: "application/json" });
      setDownloadUrlPages(URL.createObjectURL(blobPages));
    }
    if (pagesStatus === "error") {
      setPagesContent(null);
      setDownloadUrlPages(null);
      setError(pagesError instanceof Error ? pagesError.message : "An error occurred");
    }
  }, [pagesData, pagesStatus, pagesError]);

  // Handler to start both fetches
  const handleGenerateContent = useCallback(() => {
    setShouldFetch(false); // reset to allow re-fetch
    setIsStarted(true);
    setPagesContent(null);
    setGlobalContent(null);
    setDownloadUrlPages(null);
    setDownloadUrlGlobal(null);
    setError(null);
    setTimeout(() => setShouldFetch(true), 0); // allow React Query to re-trigger
  }, []);

  // Download handlers
  const handleDownloadPages = useCallback(() => {
    if (!downloadUrlPages) return;
    const link = document.createElement("a");
    link.href = downloadUrlPages;
    link.download = "pages-content.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [downloadUrlPages]);

  const handleDownloadGlobal = useCallback(() => {
    if (!downloadUrlGlobal) return;
    const link = document.createElement("a");
    link.href = downloadUrlGlobal;
    link.download = "global-content.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [downloadUrlGlobal]);

  const handleCreateRepo = useCallback(async () => {
    setError(null);
    try {
      const result = await createRepo({ new_name: newRepoName, template_repo: templateRepoName });
      setGithubOwner(result.owner);
      setGithubRepo(result.repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [newRepoName, templateRepoName, createRepo, setGithubOwner, setGithubRepo]);

  const handleUpdateGithub = useCallback(async () => {
    setError(null);
    if (!pagesContent || !globalContent) {
      setError("Generate content before updating GitHub.");
      return;
    }
    try {
      await updateGithub({
        owner: githubOwner,
        repo: githubRepo,
        pages_data: pagesContent,
        global_data: globalContent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [githubOwner, githubRepo, pagesContent, globalContent, updateGithub]);

  // Reset to idle after both queries complete
  useEffect(() => {
    if (
      isStarted &&
      (pagesStatus === "success" || pagesStatus === "error") &&
      (globalStatus === "success" || globalStatus === "error")
    ) {
      setIsStarted(false);
      setShouldFetch(false);
    }
  }, [isStarted, pagesStatus, globalStatus]);

  const handleUseRgTemplateAssetsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUseRgTemplateAssets(event.target.checked);
  }, []);

  return (
    <div className="generate-content-progress">
      <div className="generate-content-progress__card" role="region" aria-label="Generate Content Progress">
        <h4 className="generate-content-progress__title">Generate Content</h4>
        
        {/* Data Source Indicator */}
        {isMarkdownData(questionnaireData) && (
          <div className="generate-content-progress__markdown-info">
            <p className="generate-content-progress__info-text">
              <strong>📝 Using Markdown Data Source:</strong> Content generation will use the markdown content as questionnaire data.
            </p>
          </div>
        )}
        
        <div className="generate-content-progress__options">
          <div className="generate-content-progress__checkbox-wrapper">
            <input
              type="checkbox"
              id="use-rg-template-assets"
              className="generate-content-progress__checkbox"
              checked={useRgTemplateAssets}
              onChange={handleUseRgTemplateAssetsChange}
              aria-label="Use images from rg-templates-assets"
            />
            <label htmlFor="use-rg-template-assets" className="generate-content-progress__checkbox-label">
              Use images from rg-templates-assets
            </label>
          </div>
        </div>
        <GenerateContentSection
          onGenerate={handleGenerateContent}
          isStarted={isStarted}
          contentStatus={isStarted ? pagesStatus : "idle"}
          globalStatus={isStarted ? globalStatus : "idle"}
        />
        <ContentPreviewSection
          pagesContent={pagesContent}
          globalContent={globalContent}
          onDownloadPages={handleDownloadPages}
          onDownloadGlobal={handleDownloadGlobal}
          downloadUrlPages={downloadUrlPages}
          downloadUrlGlobal={downloadUrlGlobal}
        />
        <CreateRepoSection
          newRepoName={newRepoName}
          setNewRepoName={setNewRepoName}
          templateRepoName={templateRepoName}
          setTemplateRepoName={setTemplateRepoName}
          createRepoStatus={createRepoStatus}
          handleCreateRepo={handleCreateRepo}
          error={error}
          createRepoData={createRepoData}
        />
        <GithubUpdateSection
          githubStatus={githubStatus}
          handleUpdateGithub={handleUpdateGithub}
          disabled={!githubOwner || !githubRepo || githubStatus === "pending"}
        />
        <StatusSection
          error={error}
          contentStatus={pagesStatus}
          globalStatus={globalStatus}
          githubStatus={githubStatus}
          createRepoStatus={createRepoStatus}
        />
      </div>
    </div>
  );
};

export default GenerateContentProgress; 