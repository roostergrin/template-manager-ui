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
  SessionLogEntry,
} from '../types/UnifiedWorkflowTypes';
import {
  DEFAULT_WORKFLOW_STEPS,
  areDependenciesMet,
  getStepById,
} from '../constants/workflowSteps';
import { getOrCreateSessionId, getSessionStorageKey, openNewSession } from '../utils/workflowSession';
import {
  defaultSiteConfig,
  createInitialState,
  unifiedWorkflowReducer,
} from './workflowReducer';

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

  // ─── STATE PERSISTENCE ───

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

  // ─── ACTIONS ───

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
