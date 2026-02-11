import { useCallback, useRef, useEffect } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import { WORKFLOW_STEP_IDS, getStepById } from '../constants/workflowSteps';
import { modelGroups, getGithubTemplateRepo } from '../modelGroups';
import {
  CreateGithubRepoResult,
  ProvisionWordPressBackendResult,
  ProvisionStepResult,
  ScrapeStepResult,
  VectorStoreResult,
  SitemapStepResult,
  AllocatedSitemapResult,
  AllocationSummary,
  ContentStepResult,
  ThemeStepResult,
  ImagePickerResult,
  HotlinkProtectionResult,
  WordPressStepResult,
  SecondPassResult,
  LogoUploadResult,
  FaviconUploadResult,
  GithubJsonUploadResult,
  StepLogDetails,
  // Demo site (Cloudflare Pages) types
  CreateDemoRepoResult,
  ProvisionCloudflarePageResult,
} from '../types/UnifiedWorkflowTypes';
import apiClient from '../services/apiService';
import { createStepLogger, createTimer, StepLogger } from '../utils/workflowLogger';
import {
  parseJsonForImages,
  updateImageSlot,
  getImageKitUrl,
  getSlotsNeedingImages,
  ImageSlot,
  ImageAgentResponse,
} from '../utils/jsonImageAnalyzer';
import { buildThemeFromDesignSystem, mergeThemeWithDesignSystem } from '../utils/themeBuilder';
import { isMockModeEnabled } from '../mocks';
import { createPreserveImageMap, injectPreserveImageIntoContent } from '../utils/injectPreserveImage';
import { getStepOutputKey } from '../constants/stepInputMappings';

interface StepResult {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: StepLogDetails;
}

type StepExecutor = (logger: StepLogger) => Promise<StepResult>;

// Helper to determine if an API response was successful
// Handles cases where API returns data directly without a success field
const isResponseSuccessful = (response: Record<string, unknown>): boolean => {
  // If explicitly marked as failed, return false
  if (response.success === false || response.error) {
    return false;
  }
  // If explicitly marked as successful, return true
  if (response.success === true) {
    return true;
  }
  // Otherwise, assume success if we got any data back (no success field)
  return true;
};

export const useWorkflowStepRunner = () => {
  const { state, actions } = useUnifiedWorkflow();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track generated data in a ref so async step runners can access fresh data
  // This solves the stale closure problem where state.generatedData is captured at callback creation time
  const generatedDataRef = useRef<Record<string, unknown>>({});

  // Track edited input data in a ref for immediate access (state updates are async)
  const editedInputDataRef = useRef<Record<string, unknown>>({});

  // Sync ref from state.generatedData on mount and when state changes
  // This ensures data from previously completed steps is available in the ref
  // (e.g., when YOLO mode restarts and finds steps already marked as completed)
  useEffect(() => {
    console.log('[DEBUG] useEffect sync - state.generatedData keys:', Object.keys(state.generatedData).filter(k => state.generatedData[k as keyof typeof state.generatedData] !== undefined));
    Object.entries(state.generatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        generatedDataRef.current[key] = value;
      }
    });
    console.log('[DEBUG] useEffect sync - generatedDataRef keys after sync:', Object.keys(generatedDataRef.current));
  }, [state.generatedData]);

  // Sync edited input data ref from state
  useEffect(() => {
    Object.entries(state.editedInputData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        editedInputDataRef.current[key] = value;
      }
    });
  }, [state.editedInputData]);

  // Helper to set edited input data immediately (bypasses async state update)
  const setEditedInputDataImmediate = useCallback((stepId: string, data: unknown) => {
    editedInputDataRef.current[stepId] = data;
    // Also update state for consistency
    actions.setEditedInputData(stepId, data);
  }, [actions]);

  // Helper to get generated data (uses ref for fresh data)
  const getGeneratedData = useCallback(<T>(key: string): T | undefined => {
    return generatedDataRef.current[key] as T | undefined;
  }, []);

  // Helper to set generated data (updates both ref and state)
  const setGeneratedDataWithRef = useCallback((key: string, data: unknown) => {
    console.log('[DEBUG] setGeneratedDataWithRef - key:', key, 'data:', data);
    generatedDataRef.current[key] = data;
    console.log('[DEBUG] setGeneratedDataWithRef - ref updated, keys:', Object.keys(generatedDataRef.current));
    actions.setGeneratedData(key as keyof typeof state.generatedData, data);
  }, [actions]);

  // Session ID for grouping workflow logs (generated once per workflow run)
  const sessionIdRef = useRef<string | null>(null);

  // Helper to get or create session ID
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }
    return sessionIdRef.current;
  }, []);

  // Helper to download JSON file
  const downloadJson = useCallback((data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Helper to save step result to backend and download
  const saveAndDownloadStepResult = useCallback(async (
    stepId: string,
    stepName: string,
    result: unknown,
    durationMs: number,
    status: string
  ) => {
    // Use getSiteConfigSync() to get fresh domain from ref (avoids stale closure in batch mode)
    const domain = actions.getSiteConfigSync().domain;
    if (!domain) return;

    const sessionId = getSessionId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const domainSlug = domain.replace(/\./g, '-');

    // Auto-download the step result
    const filename = `${stepId}_${domainSlug}_${timestamp}.json`;
    downloadJson(result, filename);
    console.log(`[Workflow] Auto-downloaded: ${filename}`);

    // Skip backend save in mock mode
    if (isMockModeEnabled()) {
      console.log(`%c[MOCK] Skipping backend save for: ${filename}`, 'color: #9333EA; font-weight: bold');
      return;
    }

    // Save to backend
    try {
      // Validate required fields before sending to prevent 422 errors
      if (!stepId || !stepName) {
        console.warn('[Workflow] Skipping backend save - missing stepId or stepName');
        return;
      }

      // Ensure result is serializable with fallback for undefined/circular references
      let serializedResult: string;
      try {
        serializedResult = JSON.stringify(result ?? { error: 'No result data' });
      } catch (serializeError) {
        console.warn('[Workflow] Could not serialize result, using error placeholder');
        serializedResult = JSON.stringify({ error: 'Result serialization failed' });
      }

      const formData = new FormData();
      formData.append('domain', domain);
      formData.append('step_id', stepId);
      formData.append('step_name', stepName);
      formData.append('result', serializedResult);
      formData.append('session_id', sessionId);
      formData.append('duration_ms', String(durationMs ?? 0));
      formData.append('status', status || 'unknown');

      // Build URL properly - use same default as apiService
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/').replace(/\/$/, '');

      // Get API key from environment (same as apiService)
      const apiKey = import.meta.env.VITE_INTERNAL_API_KEY || import.meta.env.VITE_INTERNAL_API_TOKEN || '';

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['X-API-Key'] = apiKey.split(',')[0]?.trim() || '';
      }

      const response = await fetch(`${baseUrl}/workflow-logs/save-step/`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Workflow] Saved to backend: ${data.saved_to}`);
      } else {
        console.error('[Workflow] Failed to save to backend:', response.statusText);
      }
    } catch (error) {
      console.error('[Workflow] Error saving to backend:', error);
    }
  }, [actions, getSessionId, downloadJson]);

  // Helper to execute a step with proper status management and logging
  const executeStepWithStatus = useCallback(async (
    stepId: string,
    executor: StepExecutor
  ): Promise<StepResult> => {
    // Use getStepsSync() to get fresh steps from ref (avoids stale closure in batch mode)
    const step = getStepById(actions.getStepsSync(), stepId);
    if (!step) {
      return { success: false, error: `Step ${stepId} not found` };
    }

    // Create logger and timer for this step
    const logger = createStepLogger(stepId, step.name);
    const timer = createTimer();

    try {
      // Set step to in_progress
      actions.setStepStatus(stepId, 'in_progress');
      actions.setCurrentStep(stepId);

      // Log step start
      const startDetails = logger.logStart(actions.getSiteConfigSync() as Record<string, unknown>);
      actions.addProgressEvent({
        stepId,
        stepName: step.name,
        status: 'in_progress',
        message: `Starting: ${step.name}`,
        details: startDetails,
      });

      // Add session log entry for step start
      actions.addSessionLogEntry({
        stepId,
        stepName: step.name,
        event: 'started',
      });

      // Execute the step with the logger
      const result = await executor(logger);
      const totalDuration = timer.elapsed();

      if (result.success) {
        // Log completion
        const completeDetails = logger.logComplete(result.data, totalDuration);
        actions.setStepStatus(stepId, 'completed', result.data);
        actions.addProgressEvent({
          stepId,
          stepName: step.name,
          status: 'completed',
          message: `Completed: ${step.name} (${(totalDuration / 1000).toFixed(1)}s)`,
          details: completeDetails,
        });

        // Add session log entry for step completion
        actions.addSessionLogEntry({
          stepId,
          stepName: step.name,
          event: 'completed',
          durationMs: totalDuration,
          dataFileRef: getStepOutputKey(stepId),
        });

        // Auto-save to backend and download
        if (result.data) {
          saveAndDownloadStepResult(stepId, step.name, result.data, totalDuration, 'completed');
        }
      } else {
        // Ensure error is always a readable string
        const errorStr = typeof result.error === 'string'
          ? result.error
          : result.error ? JSON.stringify(result.error) : 'Step failed (no error details)';
        // Log error
        const errorDetails = logger.logError(errorStr, { data: result.data });
        actions.setStepStatus(stepId, 'error', undefined, errorStr);
        actions.addProgressEvent({
          stepId,
          stepName: step.name,
          status: 'error',
          message: `Error: ${step.name} - ${errorStr}`,
          details: errorDetails,
        });

        // Add session log entry for step error
        actions.addSessionLogEntry({
          stepId,
          stepName: step.name,
          event: 'error',
          durationMs: totalDuration,
        });

        // Save error result to backend (no download for errors)
        if (result.data || result.error) {
          saveAndDownloadStepResult(stepId, step.name, { error: result.error, data: result.data }, totalDuration, 'error');
        }
      }

      return result;
    } catch (error) {
      const totalDuration = timer.elapsed();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error
      const errorDetails = logger.logError(error, { duration: totalDuration });
      actions.setStepStatus(stepId, 'error', undefined, errorMessage);
      actions.addProgressEvent({
        stepId,
        stepName: step.name,
        status: 'error',
        message: `Error: ${step.name} - ${errorMessage}`,
        details: errorDetails,
      });

      // Add session log entry for step error
      actions.addSessionLogEntry({
        stepId,
        stepName: step.name,
        event: 'error',
        durationMs: totalDuration,
      });

      return { success: false, error: errorMessage, details: errorDetails };
    }
  }, [actions, saveAndDownloadStepResult]);

  // Step executors for each workflow step
  const runCreateGithubRepo = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    console.log('[BATCH DEBUG] runCreateGithubRepo START');
    console.log('[BATCH DEBUG] state.config.siteConfig.domain (stale?):', state.config.siteConfig.domain);
    console.log('[BATCH DEBUG] typeof actions.getSiteConfigSync:', typeof actions.getSiteConfigSync);

    // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
    const siteConfig = actions.getSiteConfigSync();
    console.log('[BATCH DEBUG] getSiteConfigSync() returned domain:', siteConfig.domain);
    console.log('[BATCH DEBUG] getSiteConfigSync() returned full config:', JSON.stringify(siteConfig));

    // Validate domain before proceeding - catches batch mode race condition
    if (!siteConfig.domain || siteConfig.domain.trim() === '') {
      console.log('[BATCH DEBUG] Domain is EMPTY! Full siteConfig:', siteConfig);
      logger.logProcessing('Domain is empty - state may not have updated yet');
      return {
        success: false,
        error: 'Domain is empty - state may not have updated. This is a batch mode timing issue.',
      };
    }

    const repoName = siteConfig.domain.replace(/\./g, '-');
    console.log('[BATCH DEBUG] repoName:', repoName);
    console.log('[BATCH DEBUG] Full payload about to send:', {
      new_name: repoName,
      template_repo: getGithubTemplateRepo(siteConfig.template, siteConfig.templateType || 'json'),
    });
    const templateType = siteConfig.templateType || 'json';
    const templateRepo = getGithubTemplateRepo(siteConfig.template, templateType);
    const endpoint = '/create-github-repo-from-template/';
    const payload = {
      new_name: repoName,
      template_repo: templateRepo, // Backend adds roostergrin/ prefix
    };

    logger.logProcessing(`Using ${templateType} template: ${templateRepo}`);

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<CreateGithubRepoResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());

      if (response.already_existed) {
        logger.logProcessing(`Repository already existed: ${response.owner}/${response.repo}`);
      } else {
        logger.logProcessing(`Repository newly created: ${response.owner}/${response.repo}`);
      }

      setGeneratedDataWithRef('githubRepoResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'GitHub repo creation failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runProvisionWordPressBackend = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const templateType = siteConfig.templateType || 'json';

    // Skip if using JSON template (ai-template-*)
    if (templateType === 'json') {
      logger.logProcessing('Skipping WordPress backend - using JSON template');
      return { success: true, data: { skipped: true, message: 'Not needed for JSON templates' } };
    }

    const targetDomain = `${siteConfig.domain.replace(/\./g, '-')}.com`;
    const endpoint = '/copy-subscription';

    // Build query params for the backend
    const params = new URLSearchParams({
      source_domain: 'stinsondental.com', // Default source template
      target_domain: targetDomain,
      server: 'sunset', // Default server for templates
      subdomain: 'api',
      copy_files: 'true',
      copy_databases: 'true',
      update_config_files: 'true',
    }).toString();

    try {
      logger.logApiRequest(endpoint, { source_domain: 'stinsondental.com', target_domain: targetDomain, server: 'sunset' });
      const apiTimer = createTimer();

      const response = await apiClient.post<ProvisionWordPressBackendResult>(`${endpoint}?${params}`);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('wordpressBackendResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'WordPress backend provisioning failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runProvisionSite = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const endpoint = '/provision/';
    const payload = {
      bucket_name: siteConfig.domain.replace(/\./g, '-'),
      github_owner: 'roostergrin',
      github_repo: siteConfig.domain.replace(/\./g, '-'),
      github_branch: 'master',
      page_type: 'template',
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ProvisionStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('provisionResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Provision failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runScrapeSite = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
    const siteConfig = actions.getSiteConfigSync();
    console.log('[BATCH DEBUG] runScrapeSite - siteConfig.scrapeDomain:', siteConfig.scrapeDomain);

    if (!siteConfig.scrapeDomain) {
      return { success: false, error: 'Scrape domain is required' };
    }

    const endpoint = '/scrape-site/';
    const payload = {
      domain: siteConfig.scrapeDomain,
      use_selenium: true,
      scroll: true,
      max_pages: siteConfig.maxScrapePages ?? 50,
      use_firecrawl: siteConfig.useFirecrawl ?? true,
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ScrapeStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      console.log('[DEBUG] runScrapeSite - storing scrapeResult:', response);
      console.log('[DEBUG] runScrapeSite - response.pages:', response?.pages ? 'present' : 'missing');

      // Check for empty scrape results (no pages found)
      const hasPages = response?.pages && Object.keys(response.pages).length > 0;
      if (!hasPages) {
        logger.logProcessing('WARNING: Scrape returned no pages');
        setGeneratedDataWithRef('scrapeResult', response);
        return {
          success: false,
          error: 'EMPTY_SCRAPE: No pages found in scrape results',
          data: response,
        };
      }

      setGeneratedDataWithRef('scrapeResult', response);
      console.log('[DEBUG] runScrapeSite - after store, generatedDataRef keys:', Object.keys(generatedDataRef.current));
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Scrape failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runCreateVectorStore = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
    const siteConfig = actions.getSiteConfigSync();
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');

    // Debug logging
    console.log('[DEBUG] runCreateVectorStore - generatedDataRef keys:', Object.keys(generatedDataRef.current));
    console.log('[DEBUG] runCreateVectorStore - scrapeResult:', scrapeResult);
    console.log('[DEBUG] runCreateVectorStore - scrapeResult?.pages:', scrapeResult?.pages ? 'present' : 'missing');

    // Check for edited input data (from "Edit" button in manual mode)
    const editedInput = editedInputDataRef.current['create-vector-store'];
    let pages = scrapeResult?.pages;
    const globalMarkdown = scrapeResult?.global_markdown;
    const styleOverview = scrapeResult?.style_overview;

    if (editedInput !== undefined) {
      logger.logProcessing('Using edited input data for vector store');
      pages = editedInput as typeof pages;
      delete editedInputDataRef.current['create-vector-store'];
      actions.clearEditedInputData();
    }

    if (!pages) {
      console.log('[DEBUG] runCreateVectorStore - FAILING: No pages in scrape result');
      return { success: false, error: 'No scraped content available for vector store' };
    }

    const endpoint = '/create-vector-store/';
    // Backend expects scraped_content with nested 'pages' key
    const payload = {
      domain: siteConfig.scrapeDomain || siteConfig.domain,
      scraped_content: {
        pages,
        global_markdown: globalMarkdown,
        style_overview: styleOverview,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      logger.logApiRequest(endpoint, { ...payload, scraped_content: '[truncated]' });
      const apiTimer = createTimer();

      const response = await apiClient.post<VectorStoreResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('vectorStoreResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Vector store creation failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runSelectTemplate = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();

    // Template selection is usually done through UI, this just validates it
    if (!siteConfig.template) {
      return { success: false, error: 'No template selected' };
    }

    logger.logProcessing('Template validated', { template: siteConfig.template });

    return {
      success: true,
      data: {
        template: siteConfig.template,
        templateName: siteConfig.template,
      },
    };
  }, [actions]);

  const runGenerateSitemap = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    const allocatedSitemap = getGeneratedData<AllocatedSitemapResult>('allocatedSitemap');

    // Generate sitemap from scraped content, including allocated content if available
    try {
      let endpoint: string;
      let payload: Record<string, unknown>;

      if (scrapeResult?.pages) {
        // Generate from scraped content with strict template mode
        // Backend expects full scrape structure with nested 'pages' key
        endpoint = '/generate-sitemap-from-scraped/';

        // Build sitemap structure from allocatedSitemap if available
        // This mirrors how MigrationWizard's Step3Standard.tsx handles it
        let sitemapToSend: Record<string, unknown> | undefined;

        if (allocatedSitemap?.pages) {
          logger.logProcessing('Including allocated sitemap in generate-sitemap request');
          const pagesObject: Record<string, unknown> = {};

          Object.entries(allocatedSitemap.pages).forEach(([pageTitle, pageData]) => {
            pagesObject[pageTitle] = {
              internal_id: pageData.page_id,
              page_id: pageData.page_id,
              title: pageData.title,
              model_query_pairs: pageData.model_query_pairs || [],
              allocated_markdown: pageData.allocated_markdown,
              source_location: pageData.source_location,
              allocation_confidence: pageData.allocation_confidence,
            };
          });

          sitemapToSend = {
            pages: pagesObject,
            siteType: siteConfig.siteType,
          };

          logger.logProcessing(`Built sitemap with ${Object.keys(pagesObject).length} pages containing allocated content`);
        }

        payload = {
          scraped_content: {
            pages: scrapeResult.pages,
            global_markdown: scrapeResult.global_markdown,
            style_overview: scrapeResult.style_overview,
          },
          site_type: siteConfig.siteType,
          strict_template_mode: true,
          ...(sitemapToSend && { sitemap: sitemapToSend }),
        };
      } else if (allocatedSitemap?.pages) {
        // No scrape data but we have allocated sitemap (e.g., user imported a vector store)
        // Pass through the allocated sitemap as the sitemap result — no API call needed
        logger.logProcessing('No scrape data available, using allocated sitemap directly as sitemap result');
        const pageCount = Object.keys(allocatedSitemap.pages).length;
        logger.logProcessing(`Passing through ${pageCount} allocated pages as sitemapResult`);

        const sitemapResult = { pages: allocatedSitemap.pages } as SitemapStepResult;
        setGeneratedDataWithRef('sitemapResult', sitemapResult);
        return { success: true, data: sitemapResult };
      } else {
        return { success: false, error: 'No scraped content or allocated sitemap available for sitemap generation' };
      }

      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<SitemapStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      const responseObj = response as Record<string, unknown>;
      const success = isResponseSuccessful(responseObj);
      if (success) {
        setGeneratedDataWithRef('sitemapResult', response);
      }
      return {
        success,
        data: response,
        ...(!success && { error: typeof responseObj.error === 'string' ? responseObj.error : (responseObj.message as string) || 'Sitemap generation returned unsuccessful response' }),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sitemap generation failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runAllocateContent = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    let vectorStoreResult = getGeneratedData<VectorStoreResult>('vectorStoreResult');

    // Check for edited input data (user can paste a vector_store_id to use an existing store)
    const editedInput = editedInputDataRef.current['allocate-content'] as Record<string, unknown> | undefined;
    if (editedInput !== undefined) {
      logger.logProcessing('Using edited vector store data');
      // Accept either the full object or just {vector_store_id: "..."}
      const editedVectorStoreId = editedInput.vector_store_id as string | undefined;
      if (editedVectorStoreId) {
        vectorStoreResult = { success: true, vector_store_id: editedVectorStoreId };
        // Also store it in generatedData so downstream steps can use it
        setGeneratedDataWithRef('vectorStoreResult', vectorStoreResult);
      }
      delete editedInputDataRef.current['allocate-content'];
      actions.clearEditedInputData();
    }

    if (!vectorStoreResult?.vector_store_id) {
      return { success: false, error: 'No vector store available for content allocation' };
    }

    // Get the default sitemap from the selected template
    // Map template name to model group key
    const templateToModelGroup: Record<string, string> = {
      'stinson': 'New Stinson',
      'haightashbury': 'Haight Ashbury',
      'bayarea': 'Bay Area Orthodontics',
      'bayareaortho': 'Bay Area Orthodontics',
      'calistoga': 'Calistoga',
      'pismo': 'Pismo Beach',
      'eureka': 'Eureka',
      'shasta': 'Shasta',
      'sonoma': 'Sonoma',
    };

    const modelGroupKey = templateToModelGroup[siteConfig.template?.toLowerCase() || 'stinson'] || 'New Stinson';
    const modelGroup = modelGroups[modelGroupKey];
    const defaultSitemap = modelGroup?.templates?.[0]?.data;

    if (!defaultSitemap?.pages) {
      return { success: false, error: `No default sitemap found for template: ${siteConfig.template}` };
    }

    logger.logProcessing('Using default sitemap from template', {
      template: siteConfig.template,
      modelGroup: modelGroupKey,
      pageCount: Object.keys(defaultSitemap.pages).length,
    });

    // Build pages object with model_query_pairs for second pass allocation
    // This matches the format used by Step3Standard's "Allocate Markdown" button
    const pagesObject: Record<string, unknown> = {};
    Object.entries(defaultSitemap.pages).forEach(([pageKey, page]: [string, unknown]) => {
      const pageData = page as Record<string, unknown>;
      const pageTitle = (pageData.title as string) || pageKey;
      pagesObject[pageTitle] = {
        page_id: pageKey,
        title: pageTitle,
        model_query_pairs: pageData.model_query_pairs || pageData.items || [],
      };
    });

    // Use second pass allocation endpoint which queries vector store
    const endpoint = '/allocate-content-second-pass/';
    const payload = {
      sitemap: { pages: pagesObject },
      vector_store_id: vectorStoreResult.vector_store_id,
      site_type: siteConfig.siteType,
    };

    try {
      logger.logApiRequest(endpoint, { ...payload, sitemap: `[${Object.keys(pagesObject).length} pages]` });
      const apiTimer = createTimer();

      const response = await apiClient.post<{
        success: boolean;
        enhanced_sitemap: AllocatedSitemapResult;
        summary: AllocationSummary;
        message?: string;
      }>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());

      // Store allocated sitemap and summary for sitemap generation
      setGeneratedDataWithRef('allocatedSitemap', response.enhanced_sitemap);
      setGeneratedDataWithRef('allocationSummary', response.summary);

      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Content allocation failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runGenerateContent = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const sitemapResult = getGeneratedData<SitemapStepResult>('sitemapResult');
    const allocatedSitemap = getGeneratedData<AllocatedSitemapResult>('allocatedSitemap');

    // Use sitemapResult as primary source (it now contains allocated content + preserve_image)
    // Note: sitemapResult has structure {sitemap_data: {pages: ...}, saved_path: ...}
    // Fall back to allocatedSitemap if generate-sitemap was skipped
    const sitemapPages = sitemapResult?.sitemap_data?.pages || sitemapResult?.pages;
    const pages = sitemapPages || allocatedSitemap?.pages;

    if (!pages) {
      return { success: false, error: 'No sitemap data available' };
    }

    // Log which source we're using
    if (sitemapPages) {
      logger.logProcessing('Using sitemapResult as primary source (contains allocated content + preserve_image)');
      // Debug: log sample page to verify preserve_image is present
      const samplePage = Object.values(pages)[0] as Record<string, unknown>;
      if (samplePage?.model_query_pairs) {
        const pairs = samplePage.model_query_pairs as Array<Record<string, unknown>>;
        logger.logProcessing(`Sample page has ${pairs.length} model_query_pairs, first preserve_image: ${pairs[0]?.preserve_image}`);
      }
    } else if (allocatedSitemap?.pages) {
      logger.logProcessing('Using allocatedSitemap as fallback (generate-sitemap may have been skipped)');
    }

    // Build questionnaire data from pages (allocated_markdown is now in pages from sitemapResult)
    const questionnaireData: Record<string, unknown> = {};
    const pagesForQuestionnaire = pages as Record<string, unknown>;
    Object.entries(pagesForQuestionnaire).forEach(([pageId, page]) => {
      const pageData = page as Record<string, unknown>;
      if (pageData.allocated_markdown) {
        questionnaireData[pageId] = {
          allocated_markdown: pageData.allocated_markdown,
          source_location: pageData.source_location,
          allocation_confidence: pageData.allocation_confidence,
        };
      }
    });

    // Build sitemap_metadata from pages (depth, slug, parent_slug)
    // This ensures the backend returns proper sitemap_metadata in the response
    const sitemap_metadata: Record<string, { depth: number; slug?: string; parent_slug?: string }> = {};
    const pagesRecord = pages as Record<string, unknown>;
    Object.entries(pagesRecord).forEach(([pageTitle, pageData], index) => {
      const pageObj = pageData as Record<string, unknown>;
      // Generate slug from page title (lowercase, replace spaces with hyphens)
      const slug = pageTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Extract depth from page data if available, otherwise use 0 for top-level
      const depth = typeof pageObj?.depth === 'number' ? pageObj.depth : 0;
      const parentSlug = typeof pageObj?.parent_slug === 'string' ? pageObj.parent_slug : undefined;

      sitemap_metadata[pageTitle] = {
        depth,
        slug: slug || `page-${index}`,
        ...(parentSlug && { parent_slug: parentSlug }),
      };
    });

    logger.logProcessing(`Built sitemap_metadata for ${Object.keys(sitemap_metadata).length} pages`);

    const contentEndpoint = '/generate-content-for-scraped/';
    const contentPayload = {
      sitemap_data: {
        pages,
        questionnaireData,
        sitemap_metadata,
      },
      site_type: siteConfig.siteType,
      assign_images: false,  // Disabled - image assignment handled by separate image-picker step
      use_site_pool: true,
    };

    const globalEndpoint = '/generate-global/';
    // Get scraped content to pass global_markdown and social_links for extraction
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    const globalPayload = {
      sitemap_data: {
        questionnaireData,
      },
      site_type: siteConfig.siteType,
      // Pass scraped content so backend can extract all social links
      scraped_content: scrapeResult ? {
        global_markdown: scrapeResult.global_markdown,
        pages: scrapeResult.pages,
        social_links: scrapeResult.social_links,
      } : undefined,
    };

    try {
      logger.logProcessing('Generating content and global data in parallel...');
      const apiTimer = createTimer();

      // Call both endpoints in parallel
      const [contentResponse, globalResponse] = await Promise.all([
        apiClient.post<ContentStepResult>(contentEndpoint, contentPayload),
        apiClient.post<Record<string, unknown>>(globalEndpoint, globalPayload),
      ]);

      logger.logApiResponse({ content: contentResponse, global: globalResponse }, apiTimer.elapsed());

      // Inject preserve_image from sitemap into generated content
      // This ensures preserve_image is applied even if the backend loses it
      const pagesForMap = Object.entries(pages).map(([title, pageData]) => {
        const data = pageData as Record<string, unknown>;
        return {
          id: (data.internal_id as string) || title,
          title: title,
          wordpress_id: data.page_id as string,
          items: ((data.model_query_pairs as Array<Record<string, unknown>>) || []).map(item => ({
            id: (item.internal_id as string) || '',
            model: item.model as string,
            query: item.query as string,
            preserve_image: item.preserve_image as boolean | undefined,
          })),
        };
      });

      const preserveImageMap = createPreserveImageMap(pagesForMap);
      logger.logProcessing(`Created preserve_image map for ${preserveImageMap.size} pages`);

      // Log which pages/items have preserve_image
      for (const [pageKey, itemMap] of preserveImageMap.entries()) {
        for (const [idx, value] of itemMap.entries()) {
          if (value) {
            logger.logProcessing(`  📸 ${pageKey} section ${idx}: preserve_image=true`);
          }
        }
      }

      // Inject into generated content
      const generatedPages = contentResponse.pages || contentResponse;
      const pagesWithPreserveImage = injectPreserveImageIntoContent(
        generatedPages as Record<string, unknown[]>,
        preserveImageMap
      );

      // Log injection results
      for (const [pageKey, components] of Object.entries(pagesWithPreserveImage)) {
        if (Array.isArray(components)) {
          components.forEach((comp: Record<string, unknown>, idx: number) => {
            if (comp.preserve_image) {
              logger.logProcessing(`  ✅ Injected preserve_image=true: ${pageKey} component ${idx}`);
            }
          });
        }
      }

      // Merge global data into content result with injected preserve_image
      const mergedResult: ContentStepResult = {
        ...contentResponse,
        pages: pagesWithPreserveImage,
        globalData: globalResponse,
      };

      setGeneratedDataWithRef('contentResult', mergedResult);
      return { success: isResponseSuccessful(contentResponse as Record<string, unknown>), data: mergedResult };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Content generation failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runDownloadTheme = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    // Backend returns design_system (snake_case), not designSystem (camelCase)
    const scrapeResultAny = scrapeResult as Record<string, unknown> | undefined;
    const designSystem = (scrapeResultAny?.design_system || scrapeResultAny?.designSystem) as {
      images?: { logo?: string; favicon?: string };
      colors?: {
        primary?: string | null;
        accent?: string | null;
        background?: string | null;
        text_primary?: string | null;
        link?: string | null;
      };
      typography?: {
        font_families?: {
          primary?: string | null;
          heading?: string | null;
        };
      };
      logo_config?: { type: 'svg' | 'url'; variant: 'dark' | 'light'; url: string | null } | null;
      logo_colors?: {
        colors: Array<{ hex: string; luminosity_percent: number; count: number }>;
        dominant_color: string;
        avg_luminosity: number;
        is_light: boolean;
      } | null;
    } | undefined;

    // Use empty design system with defaults if not available
    const effectiveDesignSystem = designSystem || {};

    try {
      // Build theme client-side from design system (same as DesignSystemViewer)
      // Debug: Log scrape result keys to help diagnose issues
      logger.logProcessing(`Scrape result keys: ${scrapeResultAny ? Object.keys(scrapeResultAny).join(', ') : 'none'}`);
      logger.logProcessing(`design_system present: ${scrapeResultAny?.design_system ? 'yes' : 'no'}`);
      logger.logProcessing(`designSystem present: ${scrapeResultAny?.designSystem ? 'yes' : 'no'}`);

      if (!designSystem) {
        logger.logProcessing('WARNING: No design system data from scrape step - using defaults');
      } else {
        logger.logProcessing('Building theme from design system data');
        logger.logProcessing(`Design system keys: ${Object.keys(designSystem).join(', ')}`);
      }
      logger.logProcessing(`Design system logo: ${effectiveDesignSystem.images?.logo || 'none'}`);
      logger.logProcessing(`Design system favicon: ${effectiveDesignSystem.images?.favicon || 'none'}`);

      const theme = buildThemeFromDesignSystem(effectiveDesignSystem);

      // Log what we built
      logger.logProcessing(`Theme logo_url: ${theme.default.logo_url || 'none'}`);
      logger.logProcessing(`Theme logo_config: ${theme.default.logo_config ? JSON.stringify(theme.default.logo_config) : 'none'}`);
      logger.logProcessing(`Theme favicon_url: ${theme.default.favicon_url || 'none'}`);
      logger.logProcessing(`Theme colors: ${theme.default.colors.length} entries`);
      logger.logProcessing(`Theme typography: ${theme.default.typography.length} entries`);

      const response: ThemeStepResult = {
        success: true,
        theme,
        themeJson: JSON.stringify(theme, null, 2),
      };

      setGeneratedDataWithRef('themeResult', response);

      // Trigger download of theme.json
      logger.logProcessing('Triggering theme.json download');
      const themeJson = JSON.stringify(theme, null, 2);
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'theme.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Theme generation failed' };
    }
  }, [getGeneratedData, setGeneratedDataWithRef]);

  const runImagePicker = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const contentResult = getGeneratedData<ContentStepResult>('contentResult');

    // Log all available generated data keys for debugging
    const allGeneratedDataKeys = Object.keys(generatedDataRef.current);
    logger.logProcessing(`All generated data keys: ${allGeneratedDataKeys.join(', ') || 'none'}`);

    // Log what we have available for debugging
    logger.logProcessing(`Content result keys: ${contentResult ? Object.keys(contentResult).join(', ') : 'undefined'}`);

    // Check if there's edited input data for this step (from manual mode editing)
    // Use ref for immediate access since state updates are async
    const editedInputData = editedInputDataRef.current['image-picker'];
    let pagesData: Record<string, unknown> | undefined;

    if (editedInputData !== undefined) {
      // Use edited input data instead of generated data
      logger.logProcessing('Using edited input data from manual mode');
      // The editor panel wraps the data as {pageData: {...}, config: {...}}
      const editedInputAny = editedInputData as Record<string, unknown>;
      if (editedInputAny.pageData) {
        // Unwrap the pageData from the editor's wrapper
        pagesData = editedInputAny.pageData as Record<string, unknown>;
        logger.logProcessing('Unwrapped pageData from editor wrapper');
      } else {
        // Use directly if not wrapped
        pagesData = editedInputData as Record<string, unknown>;
      }
      // Clear the edited data after using it (both ref and state)
      delete editedInputDataRef.current['image-picker'];
      actions.clearEditedInputData();
    } else {
      // Check for page data under different possible keys
      // The API might return data as 'pageData', 'pages', or wrapped in a 'pages' object
      const contentResultAny = contentResult as Record<string, unknown> | undefined;
      pagesData = contentResultAny?.pageData as Record<string, unknown> ||
                        contentResultAny?.pages as Record<string, unknown> ||
                        (contentResultAny?.pages as Record<string, unknown>)?.pages as Record<string, unknown>;
    }

    if (!pagesData) {
      const availableKeys = contentResult ? Object.keys(contentResult).join(', ') : 'none';
      return { success: false, error: `No content data available. Available keys: ${availableKeys}` };
    }

    const pagesDataRecord = pagesData as Record<string, unknown>;
    logger.logProcessing(`Found page data with ${Object.keys(pagesDataRecord).length} pages`);

    // Debug: Verify preserve_image is present in the content result
    logger.logProcessing('📸 [Image Picker] Verifying preserve_image in content result:');
    let totalWithPreserveImage = 0;
    for (const [pageName, pageData] of Object.entries(pagesDataRecord)) {
      if (Array.isArray(pageData)) {
        const sectionsWithFlag = pageData.filter((s: Record<string, unknown>) => s.preserve_image !== undefined).length;
        const sectionsWithTrue = pageData.filter((s: Record<string, unknown>) => s.preserve_image === true).length;
        if (sectionsWithTrue > 0) {
          logger.logProcessing(`  📸 ${pageName}: ${sectionsWithTrue}/${pageData.length} sections have preserve_image=true`);
          totalWithPreserveImage += sectionsWithTrue;
        }
      }
    }
    if (totalWithPreserveImage === 0) {
      logger.logProcessing('  ⚠️ WARNING: No sections have preserve_image=true! Images may be replaced incorrectly.');
    }

    try {
      // Debug: Log preserve_image status on incoming data
      logger.logProcessing('📸 [Image Picker] Checking preserve_image on sections:');
      for (const [pageName, pageData] of Object.entries(pagesDataRecord)) {
        if (Array.isArray(pageData)) {
          pageData.forEach((section: Record<string, unknown>, idx: number) => {
            const preserveImage = section.preserve_image;
            const layout = section.acf_fc_layout || 'unknown';
            if (preserveImage !== undefined) {
              logger.logProcessing(`  📸 ${pageName}[${idx}] (${layout}): preserve_image=${preserveImage}`);
            }
          });
        }
      }

      // Parse the JSON to find all image slots (json-analyzer approach)
      const parsedJson = parseJsonForImages(pagesDataRecord);
      logger.logProcessing(`Parsed ${parsedJson.totalImages} total images, ${parsedJson.totalImagesNeeded} need replacement`);

      // Debug: Log which slots are marked as preserved
      let preservedCount = 0;
      for (const page of parsedJson.pages) {
        for (const section of page.sections) {
          for (const slot of section.imageSlots) {
            if (slot.preserveImage) {
              logger.logProcessing(`  🔒 Preserved: ${slot.path}`);
              preservedCount++;
            }
          }
        }
      }
      logger.logProcessing(`Total preserved image slots: ${preservedCount}`);

      // Get slots that need images (excluding preserved ones)
      // Always include existing images for replacement - the per-section preserve_image flag
      // handles which specific images should be preserved (skipped in getSlotsNeedingImages)
      const includeExistingImages = true;
      logger.logProcessing(`Replacing all images except ${preservedCount} preserved slots`);
      const slotsNeedingImages = getSlotsNeedingImages(parsedJson, includeExistingImages);
      logger.logProcessing(`Processing ${slotsNeedingImages.length} image slots (includeExisting: ${includeExistingImages}, preserved skipped: ${preservedCount})`);

      if (slotsNeedingImages.length === 0) {
        logger.logProcessing('No images need replacement');
        // Return raw data structure (same as input)
        setGeneratedDataWithRef('imagePickerResult', { success: true, pageData: pagesDataRecord });
        return { success: true, data: pagesDataRecord };
      }

      // Process slots in batches to call image-agent for each
      const BATCH_SIZE = 20;
      let updatedJson = pagesDataRecord;
      const usedImageIds = new Set<number>();
      let processedCount = 0;
      let successCount = 0;

      // Helper to search for images for a single slot
      const searchForSlot = async (slot: ImageSlot): Promise<ImageAgentResponse | null> => {
        try {
          const searchTitle = slot.sectionTitle || 'Image';
          const searchCategory = slot.contextCategory || 'general';

          const layoutLower = (slot.sectionLayout || '').toLowerCase();
          let imageType = 'general';
          if (layoutLower.includes('hero')) imageType = 'hero';
          else if (layoutLower.includes('thumbnail')) imageType = 'thumbnail';
          else if (layoutLower.includes('background')) imageType = 'background';

          const searchBody = slot.sectionDescription || '';

          const requestBody = {
            title: searchTitle,
            body: searchBody,
            category: searchCategory,
            keywords: [],
            image_type: imageType,
            licensed_limit: 15,
            catalog_limit: 10,
            use_agent_reasoning: true,
            raw_section_data: slot.rawSectionData,
            exclude_ids: Array.from(usedImageIds),
          };

          const response = await apiClient.post<ImageAgentResponse>(
            '/adobe/image-agent/find-images',
            requestBody,
            { timeout: 180000 } // 3 minute timeout for agent calls
          );

          return response;
        } catch (err) {
          console.error(`Search failed for slot ${slot.id}:`, err);
          return null;
        }
      };

      // Process in batches
      for (let i = 0; i < slotsNeedingImages.length; i += BATCH_SIZE) {
        const batch = slotsNeedingImages.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(slotsNeedingImages.length / BATCH_SIZE);

        logger.logProcessing(`Batch ${batchNum}/${totalBatches}: Searching for ${batch.length} images...`);

        // Run batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(slot => searchForSlot(slot))
        );

        // Process results and auto-select images
        batchResults.forEach((result, index) => {
          const slot = batch[index];
          processedCount++;

          if (result.status === 'fulfilled' && result.value?.results) {
            const searchResults = result.value.results;

            // Find first available image (prefer licensed, then catalog)
            const allImages = [
              ...searchResults.licensed_results,
              ...searchResults.catalog_results
            ];

            const availableImage = allImages.find(img => !usedImageIds.has(img.id));

            if (availableImage) {
              // Get ImageKit URLs from the filename
              const filename = availableImage.filename ||
                availableImage.s3_url?.split('/').pop() ||
                `${availableImage.id}.jpg`;
              // Check if this is a hero component for larger image dimensions
              const isHero = slot.sectionLayout?.toLowerCase().includes('hero') ?? false;
              const { src, webp } = getImageKitUrl(filename, isHero);

              // Update the JSON
              updatedJson = updateImageSlot(updatedJson, slot.path, src, webp);

              // Track used image
              usedImageIds.add(availableImage.id);
              successCount++;
            }
          }
        });

        // Small delay between batches (reduced from 500ms for faster processing)
        if (i + BATCH_SIZE < slotsNeedingImages.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      logger.logProcessing(`Image replacement complete: ${successCount}/${processedCount} slots updated`);

      // Store wrapped result for other steps that expect it
      setGeneratedDataWithRef('imagePickerResult', { success: true, pageData: updatedJson });
      // Return raw data structure (same format as input)
      return { success: true, data: updatedJson };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Image picker failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  // Helper function to replace URLs in a JSON object recursively
  const replaceUrlsInObject = (obj: unknown, urlMap: Map<string, string>): unknown => {
    if (typeof obj === 'string') {
      // Check if this string contains any of the original URLs
      let result = obj;
      for (const [originalUrl, cloudfrontUrl] of urlMap) {
        if (result.includes(originalUrl)) {
          result = result.split(originalUrl).join(cloudfrontUrl);
        }
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => replaceUrlsInObject(item, urlMap));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceUrlsInObject(value, urlMap);
      }
      return result;
    }
    return obj;
  };

  const runPreventHotlinking = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();

    // Check for edited input data first
    const editedInput = editedInputDataRef.current['prevent-hotlinking'] as {
      pages?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      globalData?: Record<string, unknown>;
      config?: { siteIdentifier?: string; bucketName?: string; cloudFrontDomain?: string };
    } | undefined;

    let pageData: Record<string, unknown> | undefined;
    let themeData: Record<string, unknown> | undefined;
    let globalData: Record<string, unknown> | undefined;
    let bucketName: string;
    let cloudfrontDomain: string | undefined;

    if (editedInput) {
      logger.logProcessing('Using edited input data from pre-step editor');
      pageData = editedInput.pages;
      themeData = editedInput.theme;
      globalData = editedInput.globalData;
      bucketName = editedInput.config?.bucketName || editedInput.config?.siteIdentifier || siteConfig.domain.replace(/\./g, '-');
      cloudfrontDomain = editedInput.config?.cloudFrontDomain;
    } else {
      // Use original data sources
      const imagePickerResult = getGeneratedData<ImagePickerResult>('imagePickerResult');
      const contentResult = getGeneratedData<ContentStepResult>('contentResult');
      const provisionResult = getGeneratedData<ProvisionStepResult>('provisionResult');
      const themeResult = getGeneratedData<ThemeStepResult>('themeResult');

      // Get the page data (prefer image picker result which has updated images)
      pageData = imagePickerResult?.pageData || contentResult?.pageData;

      // Get globalData from content result
      globalData = contentResult?.globalData as Record<string, unknown> | undefined;

      // Extract bucket name and CloudFront domain from provision step (step 3)
      // Use provision result values if available, otherwise fall back to derived values
      bucketName = provisionResult?.bucket || siteConfig.domain.replace(/\./g, '-');

      // Use assets_cdn_domain directly if available, otherwise extract from assets_distribution_url
      cloudfrontDomain = provisionResult?.assets_cdn_domain;
      if (!cloudfrontDomain && provisionResult?.assets_distribution_url) {
        try {
          cloudfrontDomain = new URL(provisionResult.assets_distribution_url).hostname;
        } catch {
          // Invalid URL, leave undefined
        }
      }

      logger.logProcessing(`Provision result available: ${!!provisionResult}`);
      if (provisionResult) {
        logger.logProcessing(`Provision keys: ${Object.keys(provisionResult).join(', ')}`);
      }

      // Include theme data if available (logo_url, favicon_url will be synced to S3)
      themeData = themeResult?.theme as Record<string, unknown> | undefined;
    }

    if (!pageData) {
      logger.logProcessing('No page data available, skipping image sync');
      return { success: true, data: { skipped: true, message: 'No page data to sync' } };
    }

    logger.logProcessing(`Using bucket: ${bucketName}`);
    if (cloudfrontDomain) {
      logger.logProcessing(`CloudFront domain: ${cloudfrontDomain}`);
    }

    if (themeData) {
      const logoUrl = (themeData.default as Record<string, unknown>)?.logo_url || themeData.logo_url;
      const faviconUrl = (themeData.default as Record<string, unknown>)?.favicon_url || themeData.favicon_url;
      logger.logProcessing(`Theme data included - logo: ${logoUrl ? 'yes' : 'no'}, favicon: ${faviconUrl ? 'yes' : 'no'}`);
    }

    // Log what data we're sending
    logger.logProcessing(`--- Data being sent to sync ---`);
    logger.logProcessing(`Pages data keys: ${pageData ? Object.keys(pageData).join(', ') : 'none'}`);
    logger.logProcessing(`Pages count: ${pageData ? Object.keys(pageData).length : 0}`);
    logger.logProcessing(`GlobalData included: ${globalData ? 'yes' : 'no'}`);
    if (globalData) {
      logger.logProcessing(`GlobalData keys: ${Object.keys(globalData).join(', ')}`);
    }
    if (themeData) {
      const themeDefault = themeData.default as Record<string, unknown> | undefined;
      logger.logProcessing(`Theme logo_url: ${themeDefault?.logo_url || themeData.logo_url || 'none'}`);
      logger.logProcessing(`Theme favicon_url: ${themeDefault?.favicon_url || themeData.favicon_url || 'none'}`);
    } else {
      logger.logProcessing(`Theme data: none`);
    }

    const endpoint = '/sync-scraped-images/';
    const payload = {
      site_identifier: bucketName,
      bucket_name: bucketName,
      context: {
        pages: pageData,
        theme: themeData,
        globalData: globalData,
      },
      provision_result: cloudfrontDomain ? {
        assets_cdn_domain: cloudfrontDomain
      } : undefined
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<HotlinkProtectionResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());

      // Log response structure for debugging
      logger.logProcessing(`Response keys: ${Object.keys(response).join(', ')}`);
      logger.logProcessing(`Total images found: ${response.total_found ?? 'undefined'}`);
      logger.logProcessing(`Successfully synced: ${response.processed_count ?? 0}`);
      logger.logProcessing(`Failed: ${response.failed_count ?? 0}`);
      if (response.cloudfront_domain) {
        logger.logProcessing(`CloudFront domain: ${response.cloudfront_domain}`);
      }

      // Log failed images with their errors
      if (response.failed_images && response.failed_images.length > 0) {
        logger.logProcessing(`--- Failed Images ---`);
        for (const failedImg of response.failed_images) {
          logger.logProcessing(`❌ ${failedImg.original_url}`);
          logger.logProcessing(`   Error: ${failedImg.error}`);
        }
      }

      // Log successful syncs
      if (response.synced_images && response.synced_images.length > 0) {
        logger.logProcessing(`--- Successfully Synced ---`);
        for (const img of response.synced_images) {
          logger.logProcessing(`✓ ${img.original_url}`);
          logger.logProcessing(`  → ${img.cloudfront_url}`);
        }
      }

      // Build URL mapping from synced images
      const urlMap = new Map<string, string>();
      if (response.synced_images && response.synced_images.length > 0) {
        for (const img of response.synced_images) {
          if (img.success && img.original_url && img.cloudfront_url) {
            urlMap.set(img.original_url, img.cloudfront_url);
          }
        }
        logger.logProcessing(`Built URL map with ${urlMap.size} CloudFront replacements`);
      } else {
        logger.logProcessing('No images were successfully synced to S3');
      }

      // Replace URLs in pages, theme, and globalData
      let updatedPages: Record<string, unknown> | undefined;
      let updatedTheme: Record<string, unknown> | undefined;
      let updatedGlobalData: Record<string, unknown> | undefined;

      if (urlMap.size > 0) {
        // Replace URLs in page data
        if (pageData) {
          updatedPages = replaceUrlsInObject(pageData, urlMap) as Record<string, unknown>;
          logger.logProcessing('Replaced URLs in pages data with CloudFront URLs');
        }

        // Replace URLs in theme data
        if (themeData) {
          updatedTheme = replaceUrlsInObject(themeData, urlMap) as Record<string, unknown>;
          logger.logProcessing('Replaced URLs in theme data with CloudFront URLs');
        }

        // Replace URLs in globalData
        if (globalData) {
          updatedGlobalData = replaceUrlsInObject(globalData, urlMap) as Record<string, unknown>;
          logger.logProcessing('Replaced URLs in globalData with CloudFront URLs');
        }
      } else {
        logger.logProcessing('No URL replacements needed - using original data');
        // Use original data when no URLs were replaced
        updatedPages = pageData;
        updatedTheme = themeData;
        updatedGlobalData = globalData;
      }

      // Always store the pages, theme, and globalData for download
      if (updatedPages) {
        logger.logProcessing(`Storing hotlinkPagesResult with ${Object.keys(updatedPages).length} pages`);
        setGeneratedDataWithRef('hotlinkPagesResult', updatedPages);
      } else {
        logger.logProcessing('WARNING: No pages data to store');
      }

      if (updatedTheme) {
        logger.logProcessing(`Storing hotlinkThemeResult`);
        setGeneratedDataWithRef('hotlinkThemeResult', updatedTheme);
      } else {
        logger.logProcessing('No theme data to store (this may be normal)');
      }

      if (updatedGlobalData) {
        logger.logProcessing(`Storing hotlinkGlobalDataResult`);
        setGeneratedDataWithRef('hotlinkGlobalDataResult', updatedGlobalData);
      } else {
        logger.logProcessing('No globalData to store (this may be normal)');
      }

      // Store the full response with updated data
      const enrichedResponse: HotlinkProtectionResult = {
        ...response,
        updatedPages,
        updatedTheme,
        updatedGlobalData,
      };

      setGeneratedDataWithRef('hotlinkResult', enrichedResponse);

      // Generate summary message
      const totalFound = response.total_found ?? 0;
      const processed = response.processed_count ?? 0;
      const failed = response.failed_count ?? 0;

      if (totalFound === 0) {
        logger.logProcessing(`⚠️ No images found in pages or theme data`);
      } else if (processed === 0 && failed > 0) {
        logger.logProcessing(`❌ All ${failed} image(s) failed to sync`);
      } else if (failed > 0) {
        logger.logProcessing(`⚠️ Partial success: ${processed}/${totalFound} synced, ${failed} failed`);
      } else {
        logger.logProcessing(`✓ Sync complete: ${processed} image(s) synced successfully`);
      }

      // Consider it successful as long as we have pages data to return
      // Even if images fail, we still want to proceed with the original URLs
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: enrichedResponse };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Image sync failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runUploadJsonToGithub = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const templateType = siteConfig.templateType || 'json';

    // Skip if using WordPress template (rg-template-*)
    if (templateType === 'wordpress') {
      logger.logProcessing('Skipping JSON upload - using WordPress template');
      return { success: true, data: { skipped: true, message: 'Not needed for WordPress templates' } as GithubJsonUploadResult };
    }

    // Check for edited input data first
    const editedInput = editedInputDataRef.current['upload-json-to-github'] as {
      pages?: Record<string, unknown>;
      globalData?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      config?: { owner?: string; repo?: string; branch?: string };
    } | undefined;

    let owner: string;
    let repo: string;
    let branch: string;
    let pageData: Record<string, unknown> | undefined;
    let globalData: Record<string, unknown>;
    let themeToUpload: Record<string, unknown> | undefined;
    let usingEditedData = false;

    // Check deployment target to determine which repo result to use
    const deploymentTarget = siteConfig.deploymentTarget || 'demo';
    const isDemoMode = deploymentTarget === 'demo';

    if (editedInput) {
      logger.logProcessing('Using edited input data from pre-step editor');
      usingEditedData = true;

      // Get config from edited input or fall back to generated data
      const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
      const demoRepoResult = getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
      const repoResult = isDemoMode ? demoRepoResult : githubRepoResult;
      owner = editedInput.config?.owner || repoResult?.owner || (isDemoMode ? 'demo-rooster' : 'roostergrin');
      repo = editedInput.config?.repo || repoResult?.repo || '';
      branch = editedInput.config?.branch || 'master';

      pageData = editedInput.pages;
      globalData = editedInput.globalData || {};
      themeToUpload = editedInput.theme;
    } else {
      // Get GitHub repo info from appropriate step based on deployment target
      const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
      const demoRepoResult = getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
      const repoResult = isDemoMode ? demoRepoResult : githubRepoResult;

      // In demo mode, derive repo name from domain if demoRepoResult not available
      if (!repoResult?.repo) {
        if (isDemoMode) {
          // Fallback: derive repo name from domain (same logic as create-demo-repo step)
          const derivedRepoName = siteConfig.domain.replace(/\./g, '-');
          owner = 'demo-rooster';
          repo = derivedRepoName;
          branch = 'master';
          logger.logProcessing(`Using derived repo name for demo mode: ${owner}/${repo}`);

          // Check if the repo actually exists before proceeding
          logger.logProcessing(`Checking if repository ${owner}/${repo} exists...`);
          try {
            const checkResponse = await apiClient.post<{ exists: boolean; message?: string }>('/check-github-repo/', {
              owner,
              repo
            });

            if (!checkResponse.exists) {
              return {
                success: false,
                error: `Repository ${owner}/${repo} does not exist. Please run the create-demo-repo step first, or create the repo manually.`
              };
            }
            logger.logProcessing(`Repository ${owner}/${repo} exists, proceeding with upload`);
          } catch (checkError) {
            logger.logWarning(`Could not verify repo existence: ${checkError}. Proceeding anyway...`);
          }
        } else {
          return { success: false, error: 'No GitHub repository information available' };
        }
      } else {
        owner = repoResult.owner || (isDemoMode ? 'demo-rooster' : 'roostergrin');
        repo = repoResult.repo;
        branch = 'master';
      }

      // Get page data - prefer hotlink-processed pages (has CloudFront URLs), then image picker, then content
      const hotlinkPages = getGeneratedData<Record<string, unknown>>('hotlinkPagesResult');
      const imagePickerResult = getGeneratedData<ImagePickerResult>('imagePickerResult');
      const contentResult = getGeneratedData<ContentStepResult>('contentResult');

      pageData = hotlinkPages ||
        (imagePickerResult?.success && imagePickerResult?.pageData ? imagePickerResult.pageData : null) ||
        contentResult?.pageData;

      if (hotlinkPages) {
        logger.logProcessing('Using pages with CloudFront URLs from hotlink step');
      }

      // Get globalData - prefer hotlink-processed (has CloudFront URLs), then content result
      const hotlinkGlobalData = getGeneratedData<Record<string, unknown>>('hotlinkGlobalDataResult');
      globalData = hotlinkGlobalData || (contentResult?.globalData as Record<string, unknown>) || {};

      if (hotlinkGlobalData) {
        logger.logProcessing('Using globalData with CloudFront URLs from hotlink step');
      }

      // Get theme data - prefer updated theme from hotlink step (has CloudFront URLs)
      const hotlinkTheme = getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
      const themeResult = getGeneratedData<ThemeStepResult>('themeResult');
      themeToUpload = hotlinkTheme || (themeResult?.theme as Record<string, unknown> | undefined);
    }

    if (!repo) {
      return { success: false, error: 'No GitHub repository specified' };
    }

    if (!pageData) {
      return { success: false, error: 'No page data available for JSON upload' };
    }

    logger.logProcessing(`Uploading JSON to GitHub repo: ${owner}/${repo} (branch: ${branch})`);
    if (usingEditedData) {
      logger.logProcessing('Data source: edited input from pre-step editor');
    }

    try {
      // Upload pages.json
      const pagesEndpoint = '/update-github-repo-file/';
      const pagesPayload = {
        owner,
        repo,
        file_path: 'data/pages.json',
        file_content: JSON.stringify(pageData, null, 2),
        message: 'Update pages.json from workflow',
        branch,
      };

      logger.logApiRequest(pagesEndpoint, { ...pagesPayload, file_content: `[${Object.keys(pageData).length} pages]` });
      const pagesTimer = createTimer();

      const pagesResponse = await apiClient.post<{ success: boolean; content?: { html_url?: string } }>(pagesEndpoint, pagesPayload);
      logger.logApiResponse(pagesResponse, pagesTimer.elapsed());

      if (!isResponseSuccessful(pagesResponse as Record<string, unknown>)) {
        return { success: false, error: 'Failed to upload pages.json' };
      }

      // Upload globalData.json
      const globalPayload = {
        owner,
        repo,
        file_path: 'data/globalData.json',
        file_content: JSON.stringify(globalData, null, 2),
        message: 'Update globalData.json from workflow',
        branch,
      };

      logger.logApiRequest(pagesEndpoint, { ...globalPayload, file_content: `[global data object]` });
      const globalTimer = createTimer();

      const globalResponse = await apiClient.post<{ success: boolean; content?: { html_url?: string } }>(pagesEndpoint, globalPayload);
      logger.logApiResponse(globalResponse, globalTimer.elapsed());

      if (!isResponseSuccessful(globalResponse as Record<string, unknown>)) {
        return { success: false, error: 'Failed to upload globalData.json' };
      }

      // Upload theme.json (themeToUpload is already computed above from edited data or generated data)
      let themeJsonUrl: string | undefined;

      if (themeToUpload) {
        if (!usingEditedData) {
          const hotlinkTheme = getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
          if (hotlinkTheme) {
            logger.logProcessing('Using theme with CloudFront URLs from hotlink step');
          }
        }

        const themePayload = {
          owner,
          repo,
          file_path: 'data/theme.json',
          file_content: JSON.stringify(themeToUpload, null, 2),
          message: 'Update theme.json from workflow',
          branch,
        };

        logger.logApiRequest(pagesEndpoint, { ...themePayload, file_content: '[theme object]' });
        const themeTimer = createTimer();

        const themeResponse = await apiClient.post<{ success: boolean; content?: { html_url?: string } }>(pagesEndpoint, themePayload);
        logger.logApiResponse(themeResponse, themeTimer.elapsed());

        if (!isResponseSuccessful(themeResponse as Record<string, unknown>)) {
          return { success: false, error: 'Failed to upload theme.json' };
        }

        themeJsonUrl = `https://github.com/${owner}/${repo}/blob/${branch}/data/theme.json`;
      } else {
        logger.logProcessing('No theme data available, skipping theme.json upload');
      }

      const result: GithubJsonUploadResult = {
        success: true,
        pagesJsonUrl: `https://github.com/${owner}/${repo}/blob/${branch}/data/pages.json`,
        globalDataJsonUrl: `https://github.com/${owner}/${repo}/blob/${branch}/data/globalData.json`,
        themeJsonUrl,
      };

      setGeneratedDataWithRef('githubJsonResult', result);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'JSON upload to GitHub failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runExportToWordPress = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const contentResult = getGeneratedData<ContentStepResult>('contentResult');
    const imagePickerResult = getGeneratedData<ImagePickerResult>('imagePickerResult');

    // Auto-derive WordPress API URL from domain (e.g., example.com -> api-example.roostergrintemplates.com)
    const domainSlug = siteConfig.domain?.replace(/\./g, '-');
    const wordpressApiUrl = siteConfig.wordpressApiUrl ||
      (domainSlug ? `https://api-${domainSlug}.roostergrintemplates.com/wp-json` : null);

    if (!wordpressApiUrl) {
      return { success: false, error: 'WordPress API URL could not be determined - domain is required' };
    }

    const pageData = imagePickerResult?.success && imagePickerResult?.pageData
      ? imagePickerResult.pageData
      : contentResult?.pageData;

    if (!pageData) {
      return { success: false, error: 'No page data available' };
    }

    const endpoint = '/update-wordpress/';
    const payload = {
      wordpress_api_url: wordpressApiUrl,
      pages_data: pageData,
      global_data: contentResult?.globalData || {},
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<WordPressStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('wordpressResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'WordPress export failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  const runSecondPass = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();

    // Auto-derive WordPress API URL from domain (e.g., example.com -> api-example.roostergrintemplates.com)
    const domainSlug = siteConfig.domain?.replace(/\./g, '-');
    const wordpressApiUrl = siteConfig.wordpressApiUrl ||
      (domainSlug ? `https://api-${domainSlug}.roostergrintemplates.com/wp-json` : null);

    if (!wordpressApiUrl) {
      return { success: false, error: 'WordPress API URL could not be determined - domain is required' };
    }

    const endpoint = '/wordpress-second-pass/';
    const payload = {
      wordpress_api_url: wordpressApiUrl,
      fix_ids: true,
      fix_accessibility: true,
      fix_image_sizes: true,
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<SecondPassResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('secondPassResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Second pass failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runUploadLogo = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const templateType = siteConfig.templateType || 'json';

    // Get theme - prefer hotlink-updated version with CloudFront URLs
    const hotlinkTheme = getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
    const themeResult = getGeneratedData<ThemeStepResult>('themeResult');
    const theme = hotlinkTheme || themeResult?.theme;

    if (!theme) {
      return { success: false, error: 'No theme data available' };
    }

    // Get logo URL from theme
    const themeDefault = (theme as { default?: Record<string, unknown> })?.default || theme;
    const logoUrl = (themeDefault as { logo_url?: string })?.logo_url;
    const headerVariant = ((themeDefault as { logo_config?: { variant?: string } })?.logo_config?.variant) || 'dark';

    if (!logoUrl) {
      logger.logProcessing('No logo in theme, skipping');
      return { success: true, data: { skipped: true, message: 'No logo to upload' } };
    }

    // For WordPress templates, just return the URL (WordPress handles it)
    if (templateType === 'wordpress') {
      logger.logProcessing('WordPress template - logo handled by WordPress');
      return { success: true, data: { logoUrl, headerVariant } as LogoUploadResult };
    }

    // For JSON templates, upload to GitHub
    const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
    if (!githubRepoResult?.repo) {
      return { success: false, error: 'No GitHub repository information available' };
    }

    const owner = githubRepoResult.owner || 'roostergrin';
    const repo = githubRepoResult.repo;

    logger.logProcessing(`Uploading logo to GitHub: ${owner}/${repo}`);

    try {
      // Download the logo image
      const response = await fetch(logoUrl);
      if (!response.ok) {
        return { success: false, error: `Failed to download logo: ${response.statusText}` };
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Determine file extension from URL or content type
      const contentType = blob.type || 'image/png';
      const ext = contentType.includes('svg') ? 'svg' : contentType.includes('png') ? 'png' : 'png';
      const filePath = `assets/icons/logo.${ext}`;

      // Create FormData for the upload
      const formData = new FormData();
      formData.append('upload_file', new Blob([arrayBuffer], { type: contentType }), `logo.${ext}`);
      formData.append('owner', owner);
      formData.append('repo', repo);
      formData.append('file_path', filePath);
      formData.append('commit_message', 'Upload logo from workflow');
      formData.append('branch', 'master');

      const endpoint = '/update-github-repo-file-upload/';
      logger.logApiRequest(endpoint, { owner, repo, file_path: filePath });
      const uploadTimer = createTimer();

      const uploadResponse = await apiClient.postForm<{ success: boolean }>(endpoint, formData);
      logger.logApiResponse(uploadResponse, uploadTimer.elapsed());

      return {
        success: true,
        data: {
          logoUrl: `https://github.com/${owner}/${repo}/blob/master/${filePath}`,
          headerVariant,
        } as LogoUploadResult,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Logo upload failed' };
    }
  }, [actions, getGeneratedData]);

  const runUploadFavicon = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const siteConfig = actions.getSiteConfigSync();
    const templateType = siteConfig.templateType || 'json';

    // Get theme - prefer hotlink-updated version with CloudFront URLs
    const hotlinkTheme = getGeneratedData<Record<string, unknown>>('hotlinkThemeResult');
    const themeResult = getGeneratedData<ThemeStepResult>('themeResult');
    const theme = hotlinkTheme || themeResult?.theme;

    if (!theme) {
      return { success: false, error: 'No theme data available' };
    }

    // Get favicon URL from theme
    const themeDefault = (theme as { default?: Record<string, unknown> })?.default || theme;
    const faviconUrl = (themeDefault as { favicon_url?: string })?.favicon_url;

    if (!faviconUrl) {
      logger.logProcessing('No favicon in theme, skipping');
      return { success: true, data: { skipped: true, message: 'No favicon to upload' } };
    }

    // For WordPress templates, just return the URL (WordPress handles it)
    if (templateType === 'wordpress') {
      logger.logProcessing('WordPress template - favicon handled by WordPress');
      return { success: true, data: { faviconUrl } as FaviconUploadResult };
    }

    // For JSON templates, upload to GitHub
    const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
    if (!githubRepoResult?.repo) {
      return { success: false, error: 'No GitHub repository information available' };
    }

    const owner = githubRepoResult.owner || 'roostergrin';
    const repo = githubRepoResult.repo;

    logger.logProcessing(`Uploading favicon to GitHub: ${owner}/${repo}`);

    try {
      // Download the favicon image
      const response = await fetch(faviconUrl);
      if (!response.ok) {
        return { success: false, error: `Failed to download favicon: ${response.statusText}` };
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Determine file extension from URL or content type
      const contentType = blob.type || 'image/x-icon';
      const ext = faviconUrl.includes('.ico') ? 'ico' : contentType.includes('png') ? 'png' : 'ico';
      const filePath = `static/favicon.${ext}`;

      // Create FormData for the upload
      const formData = new FormData();
      formData.append('upload_file', new Blob([arrayBuffer], { type: contentType }), `favicon.${ext}`);
      formData.append('owner', owner);
      formData.append('repo', repo);
      formData.append('file_path', filePath);
      formData.append('commit_message', 'Upload favicon from workflow');
      formData.append('branch', 'master');

      const endpoint = '/update-github-repo-file-upload/';
      logger.logApiRequest(endpoint, { owner, repo, file_path: filePath });
      const uploadTimer = createTimer();

      const uploadResponse = await apiClient.postForm<{ success: boolean }>(endpoint, formData);
      logger.logApiResponse(uploadResponse, uploadTimer.elapsed());

      return {
        success: true,
        data: {
          faviconUrl: `https://github.com/${owner}/${repo}/blob/master/${filePath}`,
        } as FaviconUploadResult,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Favicon upload failed' };
    }
  }, [actions, getGeneratedData]);

  // ============================================================================
  // Demo Site (Cloudflare Pages) Step Executors
  // ============================================================================

  const runCreateDemoRepo = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    console.log('[BATCH DEBUG] runCreateDemoRepo START');

    // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
    const siteConfig = actions.getSiteConfigSync();
    console.log('[BATCH DEBUG] runCreateDemoRepo - getSiteConfigSync() returned domain:', siteConfig.domain);

    const deploymentTarget = siteConfig.deploymentTarget || 'demo';

    // Skip if not in demo mode
    if (deploymentTarget !== 'demo') {
      logger.logProcessing('Skipping demo repo - using production deployment');
      return { success: true, data: { skipped: true, message: 'Not needed for production deployment' } };
    }

    // Validate domain before proceeding - catches batch mode race condition
    if (!siteConfig.domain || siteConfig.domain.trim() === '') {
      console.log('[BATCH DEBUG] runCreateDemoRepo - Domain is EMPTY!');
      logger.logProcessing('Domain is empty - state may not have updated yet');
      return {
        success: false,
        error: 'Domain is empty - state may not have updated. This is a batch mode timing issue.',
      };
    }

    // Use the same template as production (roostergrin/ai-template-*), but create in demo-rooster org
    const repoName = siteConfig.domain.replace(/\./g, '-');
    console.log('[BATCH DEBUG] runCreateDemoRepo - repoName:', repoName);

    const templateType = siteConfig.templateType || 'json';
    const templateRepoName = getGithubTemplateRepo(siteConfig.template, templateType);
    const endpoint = '/create-demo-repo/';
    const payload = {
      repo_name: repoName,
      description: `Demo site for ${siteConfig.domain}`,
      template_repo: `roostergrin/${templateRepoName}`, // Full owner/repo format (e.g., 'roostergrin/ai-template-stinson')
      is_template: false, // Not a template, just a regular repo
    };

    logger.logProcessing(`Using template: roostergrin/${templateRepoName} -> demo-rooster/${repoName}`);

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<CreateDemoRepoResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());

      if (response.already_existed) {
        logger.logProcessing(`Demo repository already existed: ${response.owner}/${response.repo}`);
      } else {
        logger.logProcessing(`Demo repository newly created: ${response.owner}/${response.repo}`);
      }

      setGeneratedDataWithRef('demoRepoResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Demo repo creation failed' };
    }
  }, [actions, setGeneratedDataWithRef]);

  const runProvisionCloudflarePages = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    // Use getSiteConfigSync() to get current config from ref (avoids stale closure in batch mode)
    const siteConfig = actions.getSiteConfigSync();
    const deploymentTarget = siteConfig.deploymentTarget || 'demo';

    // Skip if not in demo mode
    if (deploymentTarget !== 'demo') {
      logger.logProcessing('Skipping Cloudflare Pages - using production deployment');
      return { success: true, data: { skipped: true, message: 'Not needed for production deployment' } };
    }

    // Get the demo repo result
    const demoRepoResult = getGeneratedData<CreateDemoRepoResult>('demoRepoResult');
    if (!demoRepoResult?.repo) {
      return { success: false, error: 'Demo repository must be created first' };
    }

    const endpoint = '/provision-cloudflare-pages/';
    const projectName = siteConfig.domain.replace(/\./g, '-');
    const payload = {
      project_name: projectName,
      repo_name: demoRepoResult.repo,
      repo_owner: demoRepoResult.owner || 'demo-rooster',
      build_command: 'npm run generate',
      build_output_dir: 'dist',
      node_version: '14',
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ProvisionCloudflarePageResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());

      if (response.already_existed) {
        logger.logProcessing(`Cloudflare Pages project already existed: ${projectName}`);
      } else {
        logger.logProcessing(`Cloudflare Pages project newly created: ${projectName}`);
      }

      setGeneratedDataWithRef('cloudflarePagesResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Cloudflare Pages provisioning failed' };
    }
  }, [actions, getGeneratedData, setGeneratedDataWithRef]);

  // Map step IDs to executors
  const getStepExecutor = useCallback((stepId: string): StepExecutor | null => {
    switch (stepId) {
      case WORKFLOW_STEP_IDS.CREATE_GITHUB_REPO:
        return runCreateGithubRepo;
      case WORKFLOW_STEP_IDS.PROVISION_WORDPRESS_BACKEND:
        return runProvisionWordPressBackend;
      case WORKFLOW_STEP_IDS.PROVISION_SITE:
        return runProvisionSite;
      case WORKFLOW_STEP_IDS.SCRAPE_SITE:
        return runScrapeSite;
      case WORKFLOW_STEP_IDS.CREATE_VECTOR_STORE:
        return runCreateVectorStore;
      case WORKFLOW_STEP_IDS.SELECT_TEMPLATE:
        return runSelectTemplate;
      case WORKFLOW_STEP_IDS.GENERATE_SITEMAP:
        return runGenerateSitemap;
      case WORKFLOW_STEP_IDS.ALLOCATE_CONTENT:
        return runAllocateContent;
      case WORKFLOW_STEP_IDS.GENERATE_CONTENT:
        return runGenerateContent;
      case WORKFLOW_STEP_IDS.DOWNLOAD_THEME:
        return runDownloadTheme;
      case WORKFLOW_STEP_IDS.IMAGE_PICKER:
        return runImagePicker;
      case WORKFLOW_STEP_IDS.PREVENT_HOTLINKING:
        return runPreventHotlinking;
      case WORKFLOW_STEP_IDS.UPLOAD_JSON_TO_GITHUB:
        return runUploadJsonToGithub;
      case WORKFLOW_STEP_IDS.EXPORT_TO_WORDPRESS:
        return runExportToWordPress;
      case WORKFLOW_STEP_IDS.SECOND_PASS:
        return runSecondPass;
      case WORKFLOW_STEP_IDS.UPLOAD_LOGO:
        return runUploadLogo;
      case WORKFLOW_STEP_IDS.UPLOAD_FAVICON:
        return runUploadFavicon;
      // Demo site (Cloudflare Pages) steps
      case WORKFLOW_STEP_IDS.CREATE_DEMO_REPO:
        return runCreateDemoRepo;
      case WORKFLOW_STEP_IDS.PROVISION_CLOUDFLARE_PAGES:
        return runProvisionCloudflarePages;
      default:
        return null;
    }
  }, [
    runCreateGithubRepo,
    runProvisionWordPressBackend,
    runProvisionSite,
    runScrapeSite,
    runCreateVectorStore,
    runSelectTemplate,
    runGenerateSitemap,
    runAllocateContent,
    runGenerateContent,
    runDownloadTheme,
    runImagePicker,
    runPreventHotlinking,
    runUploadJsonToGithub,
    runExportToWordPress,
    runSecondPass,
    runUploadLogo,
    runUploadFavicon,
    // Demo site steps
    runCreateDemoRepo,
    runProvisionCloudflarePages,
  ]);

  // Main execution function
  // skipDependencyCheck: set to true when called from YOLO mode (which tracks dependencies separately via completedStepsRef)
  const executeStep = useCallback(async (stepId: string, skipDependencyCheck = false): Promise<StepResult> => {
    const executor = getStepExecutor(stepId);
    if (!executor) {
      return { success: false, error: `No executor found for step ${stepId}` };
    }

    // Check if step can be run (dependencies met)
    // Skip this check when called from YOLO mode since it uses its own tracking (completedStepsRef)
    // to avoid stale closure issues with state.steps
    if (!skipDependencyCheck && !actions.canRunStep(stepId)) {
      return { success: false, error: `Dependencies not met for step ${stepId}` };
    }

    return executeStepWithStatus(stepId, executor);
  }, [getStepExecutor, actions, executeStepWithStatus]);

  // Abort current step
  const abortStep = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Reset session ID for a new workflow run
  const resetSessionId = useCallback(() => {
    sessionIdRef.current = null;
  }, []);

  return {
    executeStep,
    abortStep,
    setEditedInputDataImmediate,
    resetSessionId,
  };
};

export default useWorkflowStepRunner;
