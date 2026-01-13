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

  // Helper to execute a step with proper status management and logging
  const executeStepWithStatus = useCallback(async (
    stepId: string,
    executor: StepExecutor
  ): Promise<StepResult> => {
    const step = getStepById(state.steps, stepId);
    if (!step) {
      return { success: false, error: `Step ${stepId} not found` };
    }

    // Create logger and timer for this step
    const logger = createStepLogger(stepId, step.name);
    const timer = createTimer();

    // Map step IDs to generated data keys for session logging
    const stepToDataKey: Record<string, string> = {
      'create-github-repo': 'githubRepoResult',
      'provision-wordpress-backend': 'wordpressBackendResult',
      'provision-site': 'provisionResult',
      'scrape-site': 'scrapeResult',
      'create-vector-store': 'vectorStoreResult',
      'allocate-content': 'allocatedSitemap',
      'generate-sitemap': 'sitemapResult',
      'generate-content': 'contentResult',
      'download-theme': 'themeResult',
      'image-picker': 'imagePickerResult',
      'prevent-hotlinking': 'hotlinkResult',
      'upload-json-to-github': 'githubJsonResult',
      'export-to-wordpress': 'wordpressResult',
      'second-pass': 'secondPassResult',
      'upload-logo': 'logoResult',
      'upload-favicon': 'faviconResult',
    };

    try {
      // Set step to in_progress
      actions.setStepStatus(stepId, 'in_progress');
      actions.setCurrentStep(stepId);

      // Log step start
      const startDetails = logger.logStart(state.config.siteConfig as Record<string, unknown>);
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
          dataFileRef: stepToDataKey[stepId],
        });
      } else {
        // Log error
        const errorDetails = logger.logError(result.error, { data: result.data });
        actions.setStepStatus(stepId, 'error', undefined, result.error);
        actions.addProgressEvent({
          stepId,
          stepName: step.name,
          status: 'error',
          message: `Error: ${step.name} - ${result.error}`,
          details: errorDetails,
        });

        // Add session log entry for step error
        actions.addSessionLogEntry({
          stepId,
          stepName: step.name,
          event: 'error',
          durationMs: totalDuration,
        });
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
  }, [state.steps, state.config.siteConfig, actions]);

  // Step executors for each workflow step
  const runCreateGithubRepo = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const repoName = siteConfig.domain.replace(/\./g, '-');
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
      setGeneratedDataWithRef('githubRepoResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'GitHub repo creation failed' };
    }
  }, [state.config, setGeneratedDataWithRef]);

  const runProvisionWordPressBackend = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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
  }, [state.config, setGeneratedDataWithRef]);

  const runProvisionSite = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const endpoint = '/provision/';
    const payload = {
      bucket_name: siteConfig.domain.replace(/\./g, '-'),
      github_owner: 'roostergrin',
      github_repo: siteConfig.domain.replace(/\./g, '-'),
      github_branch: 'main',
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
  }, [state.config, setGeneratedDataWithRef]);

  const runScrapeSite = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;

    if (!siteConfig.scrapeDomain) {
      return { success: false, error: 'Scrape domain is required' };
    }

    const endpoint = '/scrape-site/';
    const payload = {
      domain: siteConfig.scrapeDomain,
      use_selenium: true,
      scroll: true,
      max_pages: 50,
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ScrapeStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      console.log('[DEBUG] runScrapeSite - storing scrapeResult:', response);
      console.log('[DEBUG] runScrapeSite - response.pages:', response?.pages ? 'present' : 'missing');
      setGeneratedDataWithRef('scrapeResult', response);
      console.log('[DEBUG] runScrapeSite - after store, generatedDataRef keys:', Object.keys(generatedDataRef.current));
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Scrape failed' };
    }
  }, [state.config, setGeneratedDataWithRef]);

  const runCreateVectorStore = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');

    // Debug logging
    console.log('[DEBUG] runCreateVectorStore - generatedDataRef keys:', Object.keys(generatedDataRef.current));
    console.log('[DEBUG] runCreateVectorStore - scrapeResult:', scrapeResult);
    console.log('[DEBUG] runCreateVectorStore - scrapeResult?.pages:', scrapeResult?.pages ? 'present' : 'missing');

    if (!scrapeResult?.pages) {
      console.log('[DEBUG] runCreateVectorStore - FAILING: No pages in scrape result');
      return { success: false, error: 'No scraped content available for vector store' };
    }

    const endpoint = '/create-vector-store/';
    // Backend expects scraped_content with nested 'pages' key
    const payload = {
      domain: siteConfig.scrapeDomain || siteConfig.domain,
      scraped_content: {
        pages: scrapeResult.pages,
        global_markdown: scrapeResult.global_markdown,
        style_overview: scrapeResult.style_overview,
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
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runSelectTemplate = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;

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
  }, [state.config]);

  const runGenerateSitemap = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');

    // Always generate sitemap from scraped content with strict template mode
    try {
      let response: SitemapStepResult;
      let endpoint: string;
      let payload: Record<string, unknown>;

      if (scrapeResult?.pages) {
        // Generate from scraped content with strict template mode
        // Backend expects full scrape structure with nested 'pages' key
        endpoint = '/generate-sitemap-from-scraped/';
        payload = {
          scraped_content: {
            pages: scrapeResult.pages,
            global_markdown: scrapeResult.global_markdown,
            style_overview: scrapeResult.style_overview,
          },
          site_type: siteConfig.siteType,
          strict_template_mode: true,
        };
      } else {
        // Generate from RAG/template
        endpoint = '/generate-sitemap/';
        payload = {
          site_type: siteConfig.siteType,
          domain: siteConfig.domain,
        };
      }

      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      response = await apiClient.post<SitemapStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('sitemapResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sitemap generation failed' };
    }
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runAllocateContent = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    const vectorStoreResult = getGeneratedData<VectorStoreResult>('vectorStoreResult');

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
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runGenerateContent = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
    const sitemapResult = getGeneratedData<SitemapStepResult>('sitemapResult');
    const allocatedSitemap = getGeneratedData<AllocatedSitemapResult>('allocatedSitemap');

    // Prefer allocated sitemap if available, but merge preserve_image from sitemapResult
    let pages = allocatedSitemap?.pages || sitemapResult?.pages;

    if (!pages) {
      return { success: false, error: 'No sitemap data available' };
    }

    // If we have both allocated sitemap and sitemap result, merge preserve_image from sitemapResult
    // The sitemapResult from /generate-sitemap-from-scraped/ has the correct preserve_image values
    if (allocatedSitemap?.pages && sitemapResult?.pages) {
      logger.logProcessing('Merging preserve_image from generated sitemap into allocated sitemap');
      const mergedPages: Record<string, unknown> = {};

      Object.entries(allocatedSitemap.pages).forEach(([pageKey, allocatedPage]) => {
        const sitemapPage = sitemapResult.pages[pageKey] as Record<string, unknown> | undefined;
        const allocatedPageData = allocatedPage as Record<string, unknown>;

        // Start with allocated page data
        const mergedPage: Record<string, unknown> = { ...allocatedPageData };

        // If sitemap result has model_query_pairs for this page, merge preserve_image values
        if (sitemapPage?.model_query_pairs && allocatedPageData.model_query_pairs) {
          const sitemapPairs = sitemapPage.model_query_pairs as Array<Record<string, unknown>>;
          const allocatedPairs = allocatedPageData.model_query_pairs as Array<Record<string, unknown>>;

          // Merge preserve_image from sitemap pairs into allocated pairs
          const mergedPairs = allocatedPairs.map((allocatedPair, index) => {
            const sitemapPair = sitemapPairs[index];
            if (sitemapPair && 'preserve_image' in sitemapPair) {
              return { ...allocatedPair, preserve_image: sitemapPair.preserve_image };
            }
            return allocatedPair;
          });

          mergedPage.model_query_pairs = mergedPairs;
        }

        mergedPages[pageKey] = mergedPage;
      });

      pages = mergedPages;
    }

    // Build questionnaire data from allocated content if available
    const questionnaireData: Record<string, unknown> = {};
    if (allocatedSitemap?.pages) {
      Object.entries(allocatedSitemap.pages).forEach(([pageId, page]) => {
        if (page.allocated_markdown) {
          questionnaireData[pageId] = {
            allocated_markdown: page.allocated_markdown,
            source_location: page.source_location,
            allocation_confidence: page.allocation_confidence,
          };
        }
      });
    }

    const endpoint = '/generate-content/';
    const payload = {
      sitemap_data: {
        pages,
        questionnaireData,
      },
      site_type: siteConfig.siteType,
      assign_images: true,
      use_site_pool: true,
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ContentStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('contentResult', response);
      return { success: isResponseSuccessful(response as Record<string, unknown>), data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Content generation failed' };
    }
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runDownloadTheme = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const scrapeResult = getGeneratedData<ScrapeStepResult>('scrapeResult');
    const endpoint = '/generate-theme/';
    const payload = {
      design_system: scrapeResult?.designSystem || {},
    };

    try {
      logger.logApiRequest(endpoint, payload);
      const apiTimer = createTimer();

      const response = await apiClient.post<ThemeStepResult>(endpoint, payload);

      logger.logApiResponse(response, apiTimer.elapsed());
      setGeneratedDataWithRef('themeResult', response);

      const success = isResponseSuccessful(response as Record<string, unknown>);

      // Trigger download of theme.json
      if (success && response.theme) {
        logger.logProcessing('Triggering theme.json download');
        const themeJson = JSON.stringify(response.theme, null, 2);
        const blob = new Blob([themeJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'theme.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return { success, data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Theme generation failed' };
    }
  }, [getGeneratedData, setGeneratedDataWithRef]);

  const runImagePicker = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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
      pagesData = editedInputData as Record<string, unknown>;
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

    try {
      // Parse the JSON to find all image slots (json-analyzer approach)
      const parsedJson = parseJsonForImages(pagesDataRecord);
      logger.logProcessing(`Parsed ${parsedJson.totalImages} total images, ${parsedJson.totalImagesNeeded} need replacement`);

      // Get slots that need images (excluding preserved ones)
      // When using edited input data (manual testing), process ALL images including existing ones
      const isManualTesting = editedInputData !== undefined;
      const includeExistingImages = isManualTesting || !siteConfig.preserveDoctorPhotos;
      const slotsNeedingImages = getSlotsNeedingImages(parsedJson, includeExistingImages);
      logger.logProcessing(`Processing ${slotsNeedingImages.length} image slots (includeExisting: ${includeExistingImages})`);

      if (slotsNeedingImages.length === 0) {
        logger.logProcessing('No images need replacement');
        // Return raw data structure (same as input)
        setGeneratedDataWithRef('imagePickerResult', { success: true, pageData: pagesDataRecord });
        return { success: true, data: pagesDataRecord };
      }

      // Process slots in batches to call image-agent for each
      const BATCH_SIZE = 5;
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

        // Small delay between batches
        if (i + BATCH_SIZE < slotsNeedingImages.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
  }, [state.config, state.editedInputData, actions, getGeneratedData, setGeneratedDataWithRef]);

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
    const { siteConfig } = state.config;

    // Check for edited input data first
    const editedInput = editedInputDataRef.current['prevent-hotlinking'] as {
      pages?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      config?: { siteIdentifier?: string; bucketName?: string; cloudFrontDomain?: string };
    } | undefined;

    let pageData: Record<string, unknown> | undefined;
    let themeData: Record<string, unknown> | undefined;
    let bucketName: string;
    let cloudfrontDomain: string | undefined;

    if (editedInput) {
      logger.logProcessing('Using edited input data from pre-step editor');
      pageData = editedInput.pages;
      themeData = editedInput.theme;
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

      // Replace URLs in pages and theme data
      let updatedPages: Record<string, unknown> | undefined;
      let updatedTheme: Record<string, unknown> | undefined;

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
      } else {
        logger.logProcessing('No URL replacements needed - using original data');
        // Use original data when no URLs were replaced
        updatedPages = pageData;
        updatedTheme = themeData;
      }

      // Always store the pages and theme data for download
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

      // Store the full response with updated data
      const enrichedResponse: HotlinkProtectionResult = {
        ...response,
        updatedPages,
        updatedTheme,
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
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runUploadJsonToGithub = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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

    if (editedInput) {
      logger.logProcessing('Using edited input data from pre-step editor');
      usingEditedData = true;

      // Get config from edited input or fall back to generated data
      const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
      owner = editedInput.config?.owner || githubRepoResult?.owner || 'roostergrin';
      repo = editedInput.config?.repo || githubRepoResult?.repo || '';
      branch = editedInput.config?.branch || 'master';

      pageData = editedInput.pages;
      globalData = editedInput.globalData || {};
      themeToUpload = editedInput.theme;
    } else {
      // Get GitHub repo info from create-github-repo step
      const githubRepoResult = getGeneratedData<CreateGithubRepoResult>('githubRepoResult');
      if (!githubRepoResult?.repo) {
        return { success: false, error: 'No GitHub repository information available' };
      }

      owner = githubRepoResult.owner || 'roostergrin';
      repo = githubRepoResult.repo;
      branch = 'master';

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

      globalData = (contentResult?.globalData as Record<string, unknown>) || {};

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
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runExportToWordPress = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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
  }, [state.config, getGeneratedData, setGeneratedDataWithRef]);

  const runSecondPass = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;

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
  }, [state.config, setGeneratedDataWithRef]);

  const runUploadLogo = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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
  }, [state.config, getGeneratedData]);

  const runUploadFavicon = useCallback(async (logger: StepLogger): Promise<StepResult> => {
    const { siteConfig } = state.config;
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
  }, [state.config, getGeneratedData]);

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

  return {
    executeStep,
    abortStep,
    setEditedInputDataImmediate,
  };
};

export default useWorkflowStepRunner;
