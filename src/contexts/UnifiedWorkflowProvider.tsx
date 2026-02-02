import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode, useEffect, useState, useRef } from 'react';
import {
  UnifiedWorkflowState,
  UnifiedWorkflowActions,
  UnifiedWorkflowContextValue,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowMode,
  SiteConfig,
  BatchConfig,
  WorkflowProgressEvent,
  UnifiedWorkflowConfig,
  SessionLogEntry,
} from '../types/UnifiedWorkflowTypes';
import {
  DEFAULT_WORKFLOW_STEPS,
  areDependenciesMet,
  getStepById,
} from '../constants/workflowSteps';
import { getOrCreateSessionId, getSessionStorageKey, openNewSession } from '../utils/workflowSession';

// Generate unique ID for progress events
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Action types
type UnifiedWorkflowAction =
  | { type: 'SET_MODE'; payload: WorkflowMode }
  | { type: 'SET_SITE_CONFIG'; payload: Partial<SiteConfig> }
  | { type: 'SET_BATCH_CONFIG'; payload: BatchConfig }
  | { type: 'SET_STEP_STATUS'; payload: { stepId: string; status: WorkflowStepStatus; result?: unknown; error?: string } }
  | { type: 'SET_CURRENT_STEP'; payload: string | null }
  | { type: 'START_WORKFLOW' }
  | { type: 'PAUSE_WORKFLOW' }
  | { type: 'RESUME_WORKFLOW' }
  | { type: 'STOP_WORKFLOW' }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'ADD_PROGRESS_EVENT'; payload: Omit<WorkflowProgressEvent, 'id' | 'timestamp'> }
  | { type: 'CLEAR_PROGRESS_EVENTS' }
  | { type: 'SET_GENERATED_DATA'; payload: { key: keyof UnifiedWorkflowState['generatedData']; data: unknown } }
  | { type: 'CLEAR_GENERATED_DATA' }
  | { type: 'SKIP_STEP'; payload: string }
  | { type: 'ENABLE_STEP'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<UnifiedWorkflowState> }
  | { type: 'SET_INTERVENTION_MODE'; payload: boolean }
  | { type: 'SET_PENDING_INTERVENTION'; payload: string | null }
  | { type: 'MODIFY_STEP_RESULT'; payload: { stepId: string; data: unknown } }
  | { type: 'SET_PRE_STEP_PAUSE_ENABLED'; payload: boolean }
  | { type: 'SET_PENDING_PRE_STEP_INPUT'; payload: string | null }
  | { type: 'SET_EDITED_INPUT_DATA'; payload: { stepId: string; data: unknown } }
  | { type: 'CONFIRM_INPUT_AND_CONTINUE' }
  | { type: 'CLEAR_EDITED_INPUT_DATA' }
  | { type: 'ADD_SESSION_LOG_ENTRY'; payload: Omit<SessionLogEntry, 'timestamp'> }
  | { type: 'CLEAR_SESSION_LOG' };

// Default site config
const defaultSiteConfig: SiteConfig = {
  domain: '',
  template: 'stinson',
  templateType: 'json', // 'json' for ai-template-*, 'wordpress' for rg-template-*
  siteType: 'stinson',
  preserveDoctorPhotos: true,
  enableImagePicker: false,
  enableHotlinking: false,
  deploymentTarget: 'demo', // 'demo' for Cloudflare Pages (default), 'production' for AWS
  maxScrapePages: 100, // Limit pages scraped
  useFirecrawl: true, // Use Firecrawl API for scraping (handles anti-bot, extracts branding)
};

// Default config
const defaultConfig: UnifiedWorkflowConfig = {
  mode: 'manual',
  siteConfig: defaultSiteConfig,
  stopOnError: true,
};

// Initial state
const createInitialState = (): UnifiedWorkflowState => ({
  config: defaultConfig,
  steps: DEFAULT_WORKFLOW_STEPS.map(step => ({ ...step })),
  currentStepId: null,
  isRunning: false,
  isPaused: false,
  isCompleted: false,
  interventionMode: false,
  pendingIntervention: null,
  preStepPauseEnabled: false,
  pendingPreStepInput: null,
  editedInputData: {},
  sessionLog: [],
  progressEvents: [],
  generatedData: {},
});

// Reducer
const unifiedWorkflowReducer = (
  state: UnifiedWorkflowState,
  action: UnifiedWorkflowAction
): UnifiedWorkflowState => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        config: { ...state.config, mode: action.payload },
      };

    case 'SET_SITE_CONFIG': {
      const newSiteConfig = { ...state.config.siteConfig, ...action.payload };
      const deploymentTarget = newSiteConfig.deploymentTarget || 'production';
      const prevTarget = state.config.siteConfig.deploymentTarget || 'production';

      console.log('[DEBUG] SET_SITE_CONFIG - payload:', action.payload);
      console.log('[DEBUG] SET_SITE_CONFIG - deploymentTarget:', deploymentTarget, 'prevTarget:', prevTarget);

      // If deployment target changed, update step statuses
      let updatedSteps = state.steps;
      if (deploymentTarget !== prevTarget) {
        console.log('[DEBUG] Deployment target changed! Updating steps...');
        updatedSteps = state.steps.map(step => {
          if (deploymentTarget === 'demo') {
            // Demo mode: enable demo steps, skip production steps
            if (step.id === 'create-demo-repo' || step.id === 'provision-cloudflare-pages') {
              return { ...step, status: 'pending' as const };
            }
            if (step.id === 'create-github-repo' || step.id === 'provision-site' || step.id === 'prevent-hotlinking') {
              return { ...step, status: 'skipped' as const };
            }
          } else {
            // Production mode: enable production steps, skip demo steps
            if (step.id === 'create-github-repo' || step.id === 'provision-site' || step.id === 'prevent-hotlinking') {
              return { ...step, status: 'pending' as const };
            }
            if (step.id === 'create-demo-repo' || step.id === 'provision-cloudflare-pages') {
              return { ...step, status: 'skipped' as const };
            }
          }
          return step;
        });
      }

      return {
        ...state,
        steps: updatedSteps,
        config: {
          ...state.config,
          siteConfig: newSiteConfig,
        },
      };
    }

    case 'SET_BATCH_CONFIG':
      return {
        ...state,
        config: { ...state.config, batchConfig: action.payload },
      };

    case 'SET_STEP_STATUS': {
      const { stepId, status, result, error } = action.payload;
      const now = new Date().toISOString();

      return {
        ...state,
        steps: state.steps.map(step => {
          if (step.id !== stepId) return step;

          const updates: Partial<WorkflowStep> = { status };

          if (status === 'in_progress' && !step.startedAt) {
            updates.startedAt = now;
          }

          if (status === 'completed' || status === 'error' || status === 'skipped') {
            updates.completedAt = now;
            if (step.startedAt) {
              updates.actualDurationSeconds = Math.round(
                (new Date(now).getTime() - new Date(step.startedAt).getTime()) / 1000
              );
            }
          }

          if (result !== undefined) {
            updates.result = result;
          }

          if (error !== undefined) {
            updates.error = error;
          }

          return { ...step, ...updates };
        }),
        lastError: error || state.lastError,
      };
    }

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStepId: action.payload,
      };

    case 'START_WORKFLOW':
      return {
        ...state,
        isRunning: true,
        isPaused: false,
        isCompleted: false,
      };

    case 'PAUSE_WORKFLOW':
      return {
        ...state,
        isPaused: true,
      };

    case 'RESUME_WORKFLOW':
      return {
        ...state,
        isPaused: false,
      };

    case 'STOP_WORKFLOW':
      return {
        ...state,
        isRunning: false,
        isPaused: false,
        currentStepId: null,
      };

    case 'RESET_WORKFLOW':
      return {
        ...createInitialState(),
        config: state.config, // Preserve config
      };

    case 'ADD_PROGRESS_EVENT': {
      const event: WorkflowProgressEvent = {
        ...action.payload,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        progressEvents: [event, ...state.progressEvents].slice(0, 100), // Keep last 100 events
      };
    }

    case 'CLEAR_PROGRESS_EVENTS':
      return {
        ...state,
        progressEvents: [],
      };

    case 'SET_GENERATED_DATA':
      return {
        ...state,
        generatedData: {
          ...state.generatedData,
          [action.payload.key]: action.payload.data,
        },
      };

    case 'CLEAR_GENERATED_DATA':
      return {
        ...state,
        generatedData: {},
      };

    case 'SKIP_STEP':
      return {
        ...state,
        steps: state.steps.map(step =>
          step.id === action.payload
            ? { ...step, status: 'skipped' as WorkflowStepStatus, completedAt: new Date().toISOString() }
            : step
        ),
      };

    case 'ENABLE_STEP':
      return {
        ...state,
        steps: state.steps.map(step =>
          step.id === action.payload
            ? { ...step, status: 'pending' as WorkflowStepStatus, completedAt: undefined }
            : step
        ),
      };

    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'SET_INTERVENTION_MODE':
      return {
        ...state,
        interventionMode: action.payload,
      };

    case 'SET_PENDING_INTERVENTION':
      return {
        ...state,
        pendingIntervention: action.payload,
      };

    case 'MODIFY_STEP_RESULT': {
      const { stepId, data } = action.payload;
      return {
        ...state,
        steps: state.steps.map(step =>
          step.id === stepId
            ? { ...step, result: data }
            : step
        ),
        generatedData: {
          ...state.generatedData,
          // Update the corresponding generated data key based on step
          ...(stepId === 'provision-site' && { provisionResult: data }),
          ...(stepId === 'scrape-site' && { scrapeResult: data }),
          ...(stepId === 'generate-sitemap' && { sitemapResult: data }),
          ...(stepId === 'generate-content' && { contentResult: data }),
          ...(stepId === 'download-theme' && { themeResult: data }),
          ...(stepId === 'image-picker' && { imagePickerResult: data }),
          ...(stepId === 'export-to-wordpress' && { wordpressResult: data }),
          ...(stepId === 'second-pass' && { secondPassResult: data }),
        },
      };
    }

    case 'SET_PRE_STEP_PAUSE_ENABLED':
      return {
        ...state,
        preStepPauseEnabled: action.payload,
      };

    case 'SET_PENDING_PRE_STEP_INPUT':
      return {
        ...state,
        pendingPreStepInput: action.payload,
      };

    case 'SET_EDITED_INPUT_DATA':
      return {
        ...state,
        editedInputData: {
          ...state.editedInputData,
          [action.payload.stepId]: action.payload.data,
        },
      };

    case 'CONFIRM_INPUT_AND_CONTINUE':
      return {
        ...state,
        pendingPreStepInput: null,
      };

    case 'CLEAR_EDITED_INPUT_DATA':
      return {
        ...state,
        editedInputData: {},
      };

    case 'ADD_SESSION_LOG_ENTRY': {
      const logEntry: SessionLogEntry = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        sessionLog: [...state.sessionLog, logEntry],
      };
    }

    case 'CLEAR_SESSION_LOG':
      return {
        ...state,
        sessionLog: [],
      };

    default:
      return state;
  }
};

// Base storage key (will be combined with session ID)
const BASE_STORAGE_KEY = 'unified-workflow-state';

// Context
const UnifiedWorkflowContext = createContext<UnifiedWorkflowContextValue | undefined>(undefined);

// Provider props
interface UnifiedWorkflowProviderProps {
  children: ReactNode;
}

// Provider component
export const UnifiedWorkflowProvider: React.FC<UnifiedWorkflowProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(unifiedWorkflowReducer, null, createInitialState);
  const [sessionId] = useState(() => getOrCreateSessionId());

  // Ref for siteConfig that updates synchronously (avoids stale closure issues in batch mode)
  const siteConfigRef = useRef<SiteConfig>(defaultSiteConfig);

  // Ref for steps that updates synchronously (avoids stale closure issues in batch mode)
  const stepsRef = useRef<WorkflowStep[]>(DEFAULT_WORKFLOW_STEPS.map(step => ({ ...step })));

  // Get session-scoped storage key
  const storageKey = useMemo(
    () => getSessionStorageKey(BASE_STORAGE_KEY, sessionId),
    [sessionId]
  );

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedState = JSON.parse(saved);
        console.log('[BATCH DEBUG] Loading state from localStorage, siteConfig:', parsedState.config?.siteConfig);
        // Don't restore running state - always start stopped
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...parsedState,
            isRunning: false,
            isPaused: false,
          },
        });
        // CRITICAL: Also update the ref when loading from localStorage
        if (parsedState.config?.siteConfig) {
          console.log('[BATCH DEBUG] Syncing siteConfigRef from localStorage');
          siteConfigRef.current = { ...defaultSiteConfig, ...parsedState.config.siteConfig };
        }
      }
    } catch (error) {
      console.error('Failed to load unified workflow state:', error);
    }
  }, [storageKey]);

  // Keep siteConfigRef in sync with state.config.siteConfig
  // This catches any state updates that don't go through setSiteConfig (like LOAD_STATE)
  useEffect(() => {
    console.log('[BATCH DEBUG] siteConfig changed in state, syncing ref:', state.config.siteConfig.domain);
    siteConfigRef.current = state.config.siteConfig;
  }, [state.config.siteConfig]);

  // Keep stepsRef in sync with state.steps
  useEffect(() => {
    stepsRef.current = state.steps;
  }, [state.steps]);

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        config: state.config,
        steps: state.steps,
        generatedData: state.generatedData,
        sessionLog: state.sessionLog,
        progressEvents: state.progressEvents.slice(0, 20), // Only save recent events
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save unified workflow state:', error);
    }
  }, [storageKey, state.config, state.steps, state.generatedData, state.sessionLog, state.progressEvents]);

  // Always warn user before closing window to prevent accidental loss of work
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // All three are needed for cross-browser compatibility
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      e.returnValue = 'You have unsaved workflow progress. Are you sure you want to leave?';
      return 'You have unsaved workflow progress. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Actions
  const setMode = useCallback((mode: WorkflowMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setSiteConfig = useCallback((config: Partial<SiteConfig>) => {
    // Update ref synchronously BEFORE dispatch to avoid stale closure issues in batch mode
    const prevRef = { ...siteConfigRef.current };
    siteConfigRef.current = { ...siteConfigRef.current, ...config };
    console.log('[BATCH DEBUG] setSiteConfig called:', {
      incoming: config,
      prevRef,
      newRef: siteConfigRef.current,
      domain: siteConfigRef.current.domain,
    });
    dispatch({ type: 'SET_SITE_CONFIG', payload: config });
  }, []);

  // Getter for the current siteConfig that reads from the ref (always up-to-date)
  const getSiteConfigSync = useCallback((): SiteConfig => {
    console.log('[BATCH DEBUG] getSiteConfigSync called, returning:', {
      domain: siteConfigRef.current.domain,
      fullConfig: siteConfigRef.current,
    });
    return siteConfigRef.current;
  }, []);

  // Getter for current steps from ref (always up-to-date, avoids stale closures in batch mode)
  const getStepsSync = useCallback((): WorkflowStep[] => {
    return stepsRef.current;
  }, []);

  const setBatchConfig = useCallback((config: BatchConfig) => {
    dispatch({ type: 'SET_BATCH_CONFIG', payload: config });
  }, []);

  const setStepStatus = useCallback((
    stepId: string,
    status: WorkflowStepStatus,
    result?: unknown,
    error?: string
  ) => {
    dispatch({ type: 'SET_STEP_STATUS', payload: { stepId, status, result, error } });
  }, []);

  const setCurrentStep = useCallback((stepId: string | null) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepId });
  }, []);

  const startWorkflow = useCallback(() => {
    dispatch({ type: 'START_WORKFLOW' });
  }, []);

  const pauseWorkflow = useCallback(() => {
    dispatch({ type: 'PAUSE_WORKFLOW' });
  }, []);

  const resumeWorkflow = useCallback(() => {
    dispatch({ type: 'RESUME_WORKFLOW' });
  }, []);

  const stopWorkflow = useCallback(() => {
    dispatch({ type: 'STOP_WORKFLOW' });
  }, []);

  const resetWorkflow = useCallback(() => {
    // Update stepsRef synchronously BEFORE dispatch to avoid stale closure issues in batch mode
    stepsRef.current = DEFAULT_WORKFLOW_STEPS.map(step => ({ ...step }));
    console.log('[BATCH DEBUG] resetWorkflow - stepsRef reset to default steps:', stepsRef.current.map(s => `${s.id}:${s.status}`).join(', '));
    dispatch({ type: 'RESET_WORKFLOW' });
  }, []);

  const addProgressEvent = useCallback((event: Omit<WorkflowProgressEvent, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_PROGRESS_EVENT', payload: event });
  }, []);

  const clearProgressEvents = useCallback(() => {
    dispatch({ type: 'CLEAR_PROGRESS_EVENTS' });
  }, []);

  const setGeneratedData = useCallback((
    key: keyof UnifiedWorkflowState['generatedData'],
    data: unknown
  ) => {
    dispatch({ type: 'SET_GENERATED_DATA', payload: { key, data } });
  }, []);

  const clearGeneratedData = useCallback(() => {
    dispatch({ type: 'CLEAR_GENERATED_DATA' });
  }, []);

  const skipStep = useCallback((stepId: string) => {
    dispatch({ type: 'SKIP_STEP', payload: stepId });
    const step = getStepById(state.steps, stepId);
    if (step) {
      addProgressEvent({
        stepId,
        stepName: step.name,
        status: 'skipped',
        message: `Skipped: ${step.name}`,
      });
    }
  }, [state.steps, addProgressEvent]);

  const enableStep = useCallback((stepId: string) => {
    dispatch({ type: 'ENABLE_STEP', payload: stepId });
    const step = getStepById(state.steps, stepId);
    if (step) {
      addProgressEvent({
        stepId,
        stepName: step.name,
        status: 'pending',
        message: `Enabled: ${step.name}`,
      });
    }
  }, [state.steps, addProgressEvent]);

  // Intervention mode actions
  const setInterventionMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_INTERVENTION_MODE', payload: enabled });
  }, []);

  const setPendingIntervention = useCallback((stepId: string | null) => {
    dispatch({ type: 'SET_PENDING_INTERVENTION', payload: stepId });
  }, []);

  const confirmStepAndContinue = useCallback(() => {
    dispatch({ type: 'SET_PENDING_INTERVENTION', payload: null });
  }, []);

  const modifyStepResult = useCallback((stepId: string, data: unknown) => {
    dispatch({ type: 'MODIFY_STEP_RESULT', payload: { stepId, data } });
  }, []);

  // Pre-step input editing actions
  const setPreStepPauseEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_PRE_STEP_PAUSE_ENABLED', payload: enabled });
  }, []);

  const setPendingPreStepInput = useCallback((stepId: string | null) => {
    dispatch({ type: 'SET_PENDING_PRE_STEP_INPUT', payload: stepId });
  }, []);

  const setEditedInputData = useCallback((stepId: string, data: unknown) => {
    dispatch({ type: 'SET_EDITED_INPUT_DATA', payload: { stepId, data } });
  }, []);

  const confirmInputAndContinue = useCallback(() => {
    dispatch({ type: 'CONFIRM_INPUT_AND_CONTINUE' });
  }, []);

  const clearEditedInputData = useCallback(() => {
    dispatch({ type: 'CLEAR_EDITED_INPUT_DATA' });
  }, []);

  // Session logging actions
  const addSessionLogEntry = useCallback((entry: Omit<SessionLogEntry, 'timestamp'>) => {
    dispatch({ type: 'ADD_SESSION_LOG_ENTRY', payload: entry });
  }, []);

  const clearSessionLog = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION_LOG' });
  }, []);

  // Placeholder for runStep - will be implemented by useWorkflowStepRunner hook
  const runStep = useCallback(async (_stepId: string) => {
    console.warn('runStep should be implemented by useWorkflowStepRunner');
  }, []);

  const retryStep = useCallback(async (stepId: string) => {
    // Reset step status and run again
    setStepStatus(stepId, 'pending');
    await runStep(stepId);
  }, [setStepStatus, runStep]);

  const getNextStep = useCallback((): WorkflowStep | null => {
    // Find the first step that is pending and has all dependencies met
    for (const step of state.steps) {
      if (step.status === 'pending' && areDependenciesMet(state.steps, step.id)) {
        return step;
      }
    }
    return null;
  }, [state.steps]);

  const canRunStep = useCallback((stepId: string): boolean => {
    const step = getStepById(state.steps, stepId);
    if (!step) return false;
    if (step.status !== 'pending' && step.status !== 'error') return false;
    return areDependenciesMet(state.steps, stepId);
  }, [state.steps]);

  const getProgress = useCallback(() => {
    const total = state.steps.length;
    const completed = state.steps.filter(
      step => step.status === 'completed' || step.status === 'skipped'
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [state.steps]);

  // Check if workflow is completed
  useEffect(() => {
    const allDone = state.steps.every(
      step => step.status === 'completed' || step.status === 'skipped' || step.status === 'error'
    );
    if (allDone && state.isRunning) {
      dispatch({ type: 'STOP_WORKFLOW' });
    }
  }, [state.steps, state.isRunning]);

  // Memoize actions
  const actions: UnifiedWorkflowActions = useMemo(() => ({
    setMode,
    setSiteConfig,
    getSiteConfigSync,
    getStepsSync,
    setBatchConfig,
    setStepStatus,
    setCurrentStep,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    stopWorkflow,
    resetWorkflow,
    runStep,
    retryStep,
    skipStep,
    enableStep,
    setInterventionMode,
    setPendingIntervention,
    confirmStepAndContinue,
    modifyStepResult,
    setPreStepPauseEnabled,
    setPendingPreStepInput,
    setEditedInputData,
    confirmInputAndContinue,
    clearEditedInputData,
    addSessionLogEntry,
    clearSessionLog,
    addProgressEvent,
    clearProgressEvents,
    setGeneratedData,
    clearGeneratedData,
    getNextStep,
    canRunStep,
    getProgress,
  }), [
    setMode,
    setSiteConfig,
    getSiteConfigSync,
    getStepsSync,
    setBatchConfig,
    setStepStatus,
    setCurrentStep,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    stopWorkflow,
    resetWorkflow,
    runStep,
    retryStep,
    skipStep,
    enableStep,
    setInterventionMode,
    setPendingIntervention,
    confirmStepAndContinue,
    modifyStepResult,
    setPreStepPauseEnabled,
    setPendingPreStepInput,
    setEditedInputData,
    confirmInputAndContinue,
    clearEditedInputData,
    addSessionLogEntry,
    clearSessionLog,
    addProgressEvent,
    clearProgressEvents,
    setGeneratedData,
    clearGeneratedData,
    getNextStep,
    canRunStep,
    getProgress,
  ]);

  // Memoize context value
  const value: UnifiedWorkflowContextValue = useMemo(() => ({
    state,
    actions,
    sessionId,
    openNewSession,
  }), [state, actions, sessionId]);

  return (
    <UnifiedWorkflowContext.Provider value={value}>
      {children}
    </UnifiedWorkflowContext.Provider>
  );
};

// Custom hook
export const useUnifiedWorkflow = (): UnifiedWorkflowContextValue => {
  const context = useContext(UnifiedWorkflowContext);
  if (context === undefined) {
    throw new Error('useUnifiedWorkflow must be used within a UnifiedWorkflowProvider');
  }
  return context;
};

export default UnifiedWorkflowProvider;
