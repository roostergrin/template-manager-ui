import {
  UnifiedWorkflowState,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowMode,
  SiteConfig,
  BatchConfig,
  WorkflowProgressEvent,
  UnifiedWorkflowConfig,
  SessionLogEntry,
} from '../types/UnifiedWorkflowTypes';
import { DEFAULT_WORKFLOW_STEPS } from '../constants/workflowSteps';

// Generate unique ID for progress events
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ─── ACTION TYPES ───

export type UnifiedWorkflowAction =
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

// ─── INITIAL STATE ───

export const defaultSiteConfig: SiteConfig = {
  domain: '',
  template: 'stinson',
  templateType: 'json', // 'json' for ai-template-*, 'wordpress' for rg-template-*
  preserveDoctorPhotos: true,
  enableImagePicker: false,
  enableHotlinking: false,
  deploymentTarget: 'demo', // 'demo' for Cloudflare Pages (default), 'production' for AWS
  maxScrapePages: 50, // Limit pages scraped
  useFirecrawl: true, // Use Firecrawl API for scraping (handles anti-bot, extracts branding)
  contentModel: 'gpt-5-mini',
  homePageOnly: false,
};

const defaultConfig: UnifiedWorkflowConfig = {
  mode: 'yolo',
  siteConfig: defaultSiteConfig,
  stopOnError: true,
};

export const createInitialState = (): UnifiedWorkflowState => ({
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

// ─── REDUCER ───

export const unifiedWorkflowReducer = (
  state: UnifiedWorkflowState,
  action: UnifiedWorkflowAction
): UnifiedWorkflowState => {
  switch (action.type) {
    // ─── SITE CONFIGURATION ───
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

    // ─── STEP MANAGEMENT ───
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

    // ─── WORKFLOW LIFECYCLE ───
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

    // ─── PROGRESS EVENTS ───
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

    // ─── GENERATED DATA ───
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

    // ─── INTERVENTION ───
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

    // ─── SESSION LOG ───
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
