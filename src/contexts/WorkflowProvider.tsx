import React, { createContext, useContext, useCallback, ReactNode, useEffect, useMemo } from 'react'
import useProgressState from '../hooks/workflow/useProgressState'
import useGeneratedContent from '../hooks/workflow/useGeneratedContent'
import useWorkflowError from '../hooks/workflow/useWorkflowError'
import useWorkflowStorage from '../hooks/workflow/useWorkflowStorage'

export type ProgressStatus = 'pending' | 'in-progress' | 'completed' | 'error'

export interface ProgressState {
  infrastructure: {
    repoCreation: ProgressStatus
    awsProvisioning: ProgressStatus
  }
  setup: {
    questionnaire: ProgressStatus
    assetSync: ProgressStatus
  }
  content: {
    sitemapPlanning: ProgressStatus
    contentGeneration: ProgressStatus
    repositoryUpdate: ProgressStatus
    wordpressUpdate: ProgressStatus
  }
}

export interface ProgressSection {
  id: keyof ProgressState
  title: string
  icon: string
  tasks: Array<{
    id: string
    title: string
    description: string
  }>
}

export interface GeneratedContent {
  id: string
  type: 'sitemap' | 'page-content' | 'template'
  title: string
  content: any
  created: string
  metadata?: Record<string, any>
}

// Context State Types
interface WorkflowContextState {
  progressState: ProgressState
  activeSection: keyof ProgressState
  generatedContent: GeneratedContent[]
  isProcessing: boolean
  error: string | null
  lastSaved: string | null
}

// Context Actions
interface WorkflowContextActions {
  // Progress management
  updateTaskStatus: (section: keyof ProgressState, task: string, status: ProgressStatus) => void
  setActiveSection: (section: keyof ProgressState) => void
  getSectionStatus: (section: keyof ProgressState) => ProgressStatus
  getOverallProgress: () => number
  canNavigateToSection: (targetSection: keyof ProgressState) => boolean
  resetProgress: () => void
  getNextIncompleteTask: () => {
    section: keyof ProgressState
    task: string
    sectionTitle: string
    taskTitle: string
  } | null

  // Generated content management
  addGeneratedContent: (content: Omit<GeneratedContent, 'id' | 'created'>) => string
  updateGeneratedContent: (id: string, updates: Partial<GeneratedContent>) => void
  removeGeneratedContent: (id: string) => void
  getContentByType: (type: GeneratedContent['type']) => GeneratedContent[]
  clearGeneratedContent: () => void

  // Processing state
  setProcessing: (processing: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

interface WorkflowContextValue {
  state: WorkflowContextState
  actions: WorkflowContextActions
  progressSections: ProgressSection[]
}

const initialProgressState: ProgressState = {
  infrastructure: {
    repoCreation: 'pending',
    awsProvisioning: 'pending',
  },
  setup: {
    questionnaire: 'pending',
    assetSync: 'pending',
  },
  content: {
    sitemapPlanning: 'pending',
    contentGeneration: 'pending',
    repositoryUpdate: 'pending',
    wordpressUpdate: 'pending',
  },
}

const progressSections: ProgressSection[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure & Assets',
    icon: '🏗️',
    tasks: [
      {
        id: 'repoCreation',
        title: 'GitHub Repository',
        description: 'Create and configure GitHub repository',
      },
      {
        id: 'awsProvisioning',
        title: 'AWS Resources',
        description: 'Provision S3, CloudFront, and CodePipeline',
      },
    ],
  },
  {
    id: 'setup',
    title: 'Setup & Configuration',
    icon: '📝',
    tasks: [
      {
        id: 'questionnaire',
        title: 'Site Questionnaire',
        description: 'Complete site configuration questionnaire',
      },
      {
        id: 'assetSync',
        title: 'Asset Synchronization',
        description: 'Sync scraped assets and content',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content Planning & Generation',
    icon: '🗺️',
    tasks: [
      {
        id: 'sitemapPlanning',
        title: 'Sitemap Planning',
        description: 'Plan and structure site pages',
      },
      {
        id: 'contentGeneration',
        title: 'Content Generation',
        description: 'Generate AI-powered content',
      },
      {
        id: 'repositoryUpdate',
        title: 'Repository Update',
        description: 'Update GitHub repository',
      },
      {
        id: 'wordpressUpdate',
        title: 'WordPress Update',
        description: 'Deploy to WordPress site',
      },
    ],
  },
]


// Helper Functions (moved to hooks - keeping here for reference during migration)

// Context
const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined)

// Provider Props
interface WorkflowProviderProps {
  children: ReactNode
  initialState?: Partial<WorkflowContextState>
}

// Provider Component
export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  children,
  initialState: providedInitialState
}) => {
  // Initialize custom hooks
  const progressHook = useProgressState(providedInitialState?.progressState)
  const contentHook = useGeneratedContent(providedInitialState?.generatedContent || [])
  const errorHook = useWorkflowError()
  const storageHook = useWorkflowStorage()

  // Initialize processing and error state from providedInitialState if available
  useEffect(() => {
    if (providedInitialState?.isProcessing !== undefined) {
      errorHook.setProcessing(providedInitialState.isProcessing)
    }
    if (providedInitialState?.error !== undefined) {
      errorHook.setError(providedInitialState.error)
    }
  }, [providedInitialState?.isProcessing, providedInitialState?.error, errorHook])

  // Load from localStorage on mount - handled by individual hooks

  // Save to localStorage on state changes
  useEffect(() => {
    storageHook.saveToStorage(progressHook.progressState, contentHook.generatedContent)
  }, [progressHook.progressState, contentHook.generatedContent, storageHook])

  // Enhanced reset progress that clears both progress and content
  const resetProgress = useCallback(() => {
    progressHook.resetProgress()
    contentHook.clearGeneratedContent()
  }, [progressHook, contentHook])

  // Compose the actions interface with useMemo to prevent unnecessary re-renders
  const actions: WorkflowContextActions = useMemo(() => ({
    // Progress management
    updateTaskStatus: progressHook.updateTaskStatus,
    setActiveSection: progressHook.setActiveSection,
    getSectionStatus: progressHook.getSectionStatus,
    getOverallProgress: progressHook.getOverallProgress,
    canNavigateToSection: progressHook.canNavigateToSection,
    resetProgress,
    getNextIncompleteTask: progressHook.getNextIncompleteTask,
    
    // Generated content management
    addGeneratedContent: contentHook.addGeneratedContent,
    updateGeneratedContent: contentHook.updateGeneratedContent,
    removeGeneratedContent: contentHook.removeGeneratedContent,
    getContentByType: contentHook.getContentByType,
    clearGeneratedContent: contentHook.clearGeneratedContent,
    
    // Processing state
    setProcessing: errorHook.setProcessing,
    setError: errorHook.setError,
    clearError: errorHook.clearError
  }), [
    progressHook.updateTaskStatus,
    progressHook.setActiveSection,
    progressHook.getSectionStatus,
    progressHook.getOverallProgress,
    progressHook.canNavigateToSection,
    resetProgress,
    progressHook.getNextIncompleteTask,
    contentHook.addGeneratedContent,
    contentHook.updateGeneratedContent,
    contentHook.removeGeneratedContent,
    contentHook.getContentByType,
    contentHook.clearGeneratedContent,
    errorHook.setProcessing,
    errorHook.setError,
    errorHook.clearError
  ])

  // Compose the state interface with useMemo to prevent unnecessary re-renders
  const state: WorkflowContextState = useMemo(() => ({
    progressState: progressHook.progressState,
    activeSection: progressHook.activeSection,
    generatedContent: contentHook.generatedContent,
    isProcessing: errorHook.isProcessing,
    error: errorHook.error,
    lastSaved: storageHook.getLastSaved()
  }), [
    progressHook.progressState,
    progressHook.activeSection,
    contentHook.generatedContent,
    errorHook.isProcessing,
    errorHook.error,
    storageHook
  ])

  const value: WorkflowContextValue = useMemo(() => ({
    state,
    actions,
    progressSections
  }), [state, actions])

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  )
}

// Custom Hook
export const useWorkflow = (): WorkflowContextValue => {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider')
  }
  return context
}

export default WorkflowProvider