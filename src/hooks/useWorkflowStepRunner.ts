import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import { WORKFLOW_STEP_IDS, getStepById } from '../constants/workflowSteps';
import { createStepLogger, createTimer, StepLogger } from '../utils/workflowLogger';
import { isMockModeEnabled } from '../mocks';
import { getStepOutputKey } from '../constants/stepInputMappings';
import { domainToSlug } from '../utils/domainUtils';
import {
  StepResult,
  StepExecutor,
  StepRunnerDeps,
  runCreateGithubRepo as runCreateGithubRepoImport,
  runProvisionWordPressBackend as runProvisionWordPressBackendImport,
  runProvisionSite as runProvisionSiteImport,
  runScrapeSite as runScrapeSiteImport,
  runCreateVectorStore as runCreateVectorStoreImport,
  runSelectTemplate as runSelectTemplateImport,
  runGenerateSitemap as runGenerateSitemapImport,
  runAllocateContent as runAllocateContentImport,
  runGenerateContent as runGenerateContentImport,
  runDownloadTheme as runDownloadThemeImport,
  runImagePicker as runImagePickerImport,
  runPreventHotlinking as runPreventHotlinkingImport,
  runUploadJsonToGithub as runUploadJsonToGithubImport,
  runExportToWordPress as runExportToWordPressImport,
  runSecondPass as runSecondPassImport,
  runUploadLogo as runUploadLogoImport,
  runUploadFavicon as runUploadFaviconImport,
  runCreateDemoRepo as runCreateDemoRepoImport,
  runProvisionCloudflarePages as runProvisionCloudflarePagesImport,
} from './workflow/stepRunners';

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
    const domainSlug = domainToSlug(domain);

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
      formData.append('duration_ms', String(Number.isFinite(durationMs) ? Math.round(durationMs) : 0));
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
        const errorBody = await response.text().catch(() => '(no body)');
        console.error(`[Workflow] Failed to save to backend (${response.status}):`, errorBody);
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

  // Build deps object for step runners (memoized to avoid unnecessary re-creation)
  const deps: StepRunnerDeps = useMemo(() => ({
    actions,
    getGeneratedData,
    setGeneratedDataWithRef,
    editedInputDataRef,
    abortControllerRef,
  }), [actions, getGeneratedData, setGeneratedDataWithRef]);

  // Step executor wrappers - each delegates to a modular runner function
  const runCreateGithubRepo = useCallback(
    (logger: StepLogger) => runCreateGithubRepoImport(deps, logger),
    [deps]
  );

  const runProvisionWordPressBackend = useCallback(
    (logger: StepLogger) => runProvisionWordPressBackendImport(deps, logger),
    [deps]
  );

  const runProvisionSite = useCallback(
    (logger: StepLogger) => runProvisionSiteImport(deps, logger),
    [deps]
  );

  const runScrapeSite = useCallback(
    (logger: StepLogger) => runScrapeSiteImport(deps, logger),
    [deps]
  );

  const runCreateVectorStore = useCallback(
    (logger: StepLogger) => runCreateVectorStoreImport(deps, logger),
    [deps]
  );

  const runSelectTemplate = useCallback(
    (logger: StepLogger) => runSelectTemplateImport(deps, logger),
    [deps]
  );

  const runGenerateSitemap = useCallback(
    (logger: StepLogger) => runGenerateSitemapImport(deps, logger),
    [deps]
  );

  const runAllocateContent = useCallback(
    (logger: StepLogger) => runAllocateContentImport(deps, logger),
    [deps]
  );

  const runGenerateContent = useCallback(
    (logger: StepLogger) => runGenerateContentImport(deps, logger),
    [deps]
  );

  const runDownloadTheme = useCallback(
    (logger: StepLogger) => runDownloadThemeImport(deps, logger),
    [deps]
  );

  const runImagePicker = useCallback(
    (logger: StepLogger) => runImagePickerImport(deps, logger),
    [deps]
  );

  const runPreventHotlinking = useCallback(
    (logger: StepLogger) => runPreventHotlinkingImport(deps, logger),
    [deps]
  );

  const runUploadJsonToGithub = useCallback(
    (logger: StepLogger) => runUploadJsonToGithubImport(deps, logger),
    [deps]
  );

  const runExportToWordPress = useCallback(
    (logger: StepLogger) => runExportToWordPressImport(deps, logger),
    [deps]
  );

  const runSecondPass = useCallback(
    (logger: StepLogger) => runSecondPassImport(deps, logger),
    [deps]
  );

  const runUploadLogo = useCallback(
    (logger: StepLogger) => runUploadLogoImport(deps, logger),
    [deps]
  );

  const runUploadFavicon = useCallback(
    (logger: StepLogger) => runUploadFaviconImport(deps, logger),
    [deps]
  );

  const runCreateDemoRepo = useCallback(
    (logger: StepLogger) => runCreateDemoRepoImport(deps, logger),
    [deps]
  );

  const runProvisionCloudflarePages = useCallback(
    (logger: StepLogger) => runProvisionCloudflarePagesImport(deps, logger),
    [deps]
  );

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

  // Helper to set generated data immediately (bypasses async state update).
  // Use this when saving step data from the Edit panel so the ref is up-to-date
  // before the next step runs.
  const setGeneratedDataImmediate = useCallback((key: string, data: unknown) => {
    generatedDataRef.current[key] = data;
    actions.setGeneratedData(key as keyof typeof state.generatedData, data);
  }, [actions]);

  return {
    executeStep,
    abortStep,
    setEditedInputDataImmediate,
    setGeneratedDataImmediate,
    resetSessionId,
  };
};

export default useWorkflowStepRunner;
