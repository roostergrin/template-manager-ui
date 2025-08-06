import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react'

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

// Action Types
type WorkflowAction =
  | { type: 'UPDATE_TASK_STATUS'; payload: { section: keyof ProgressState; task: string; status: ProgressStatus } }
  | { type: 'SET_ACTIVE_SECTION'; payload: keyof ProgressState }
  | { type: 'RESET_PROGRESS' }
  | { type: 'ADD_GENERATED_CONTENT'; payload: GeneratedContent }
  | { type: 'UPDATE_GENERATED_CONTENT'; payload: { id: string; updates: Partial<GeneratedContent> } }
  | { type: 'REMOVE_GENERATED_CONTENT'; payload: string }
  | { type: 'CLEAR_GENERATED_CONTENT' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<WorkflowContextState> }

// Constants
const STORAGE_KEY = 'template-manager-progress'
const CONTENT_STORAGE_KEY = 'template-manager-generated-content'

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

// Initial State
const initialState: WorkflowContextState = {
  progressState: initialProgressState,
  activeSection: 'infrastructure',
  generatedContent: [],
  isProcessing: false,
  error: null,
  lastSaved: null
}

// Helper Functions
const getSectionStatus = (progressState: ProgressState, section: keyof ProgressState): ProgressStatus => {
  const sectionTasks = Object.values(progressState[section])
  
  if (sectionTasks.every(status => status === 'completed')) {
    return 'completed'
  }
  
  if (sectionTasks.some(status => status === 'error')) {
    return 'error'
  }
  
  if (sectionTasks.some(status => status === 'in-progress')) {
    return 'in-progress'
  }
  
  if (sectionTasks.some(status => status === 'completed')) {
    return 'in-progress'
  }
  
  return 'pending'
}

const getOverallProgress = (progressState: ProgressState): number => {
  const allTasks = [
    ...Object.values(progressState.infrastructure),
    ...Object.values(progressState.setup),
    ...Object.values(progressState.content),
  ]
  
  const completedTasks = allTasks.filter(status => status === 'completed').length
  return Math.round((completedTasks / allTasks.length) * 100)
}

const canNavigateToSection = (
  progressState: ProgressState,
  activeSection: keyof ProgressState,
  targetSection: keyof ProgressState
): boolean => {
  const sectionOrder: (keyof ProgressState)[] = ['infrastructure', 'setup', 'content']
  const currentIndex = sectionOrder.indexOf(activeSection)
  const targetIndex = sectionOrder.indexOf(targetSection)
  
  if (targetIndex <= currentIndex) {
    return true
  }
  
  for (let i = 0; i < targetIndex; i++) {
    const sectionStatus = getSectionStatus(progressState, sectionOrder[i])
    if (sectionStatus !== 'completed') {
      return false
    }
  }
  
  return true
}

const getNextIncompleteTask = (progressState: ProgressState) => {
  for (const section of progressSections) {
    const sectionStatus = getSectionStatus(progressState, section.id)
    if (sectionStatus !== 'completed') {
      for (const task of section.tasks) {
        const taskStatus = progressState[section.id][task.id as keyof typeof progressState[typeof section.id]]
        if (taskStatus !== 'completed') {
          return {
            section: section.id,
            task: task.id,
            sectionTitle: section.title,
            taskTitle: task.title,
          }
        }
      }
    }
  }
  return null
}

// Load from localStorage
const loadFromStorage = (): Partial<WorkflowContextState> => {
  try {
    const progressData = localStorage.getItem(STORAGE_KEY)
    const contentData = localStorage.getItem(CONTENT_STORAGE_KEY)
    
    const result: Partial<WorkflowContextState> = {}
    
    if (progressData) {
      const parsed = JSON.parse(progressData)
      result.progressState = { ...initialProgressState, ...parsed }
    }
    
    if (contentData) {
      result.generatedContent = JSON.parse(contentData)
    }
    
    return result
  } catch (error) {
    console.warn('Failed to load workflow data from localStorage:', error)
    return {}
  }
}

// Save to localStorage
const saveToStorage = (state: WorkflowContextState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progressState))
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(state.generatedContent))
  } catch (error) {
    console.warn('Failed to save workflow data to localStorage:', error)
  }
}

// Reducer
const workflowReducer = (
  state: WorkflowContextState,
  action: WorkflowAction
): WorkflowContextState => {
  switch (action.type) {
    case 'UPDATE_TASK_STATUS':
      const newProgressState = {
        ...state.progressState,
        [action.payload.section]: {
          ...state.progressState[action.payload.section],
          [action.payload.task]: action.payload.status,
        },
      }
      return {
        ...state,
        progressState: newProgressState,
        lastSaved: new Date().toISOString()
      }
    
    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        activeSection: action.payload
      }
    
    case 'RESET_PROGRESS':
      return {
        ...state,
        progressState: initialProgressState,
        activeSection: 'infrastructure',
        generatedContent: [],
        lastSaved: new Date().toISOString()
      }
    
    case 'ADD_GENERATED_CONTENT':
      return {
        ...state,
        generatedContent: [...state.generatedContent, action.payload],
        lastSaved: new Date().toISOString()
      }
    
    case 'UPDATE_GENERATED_CONTENT':
      return {
        ...state,
        generatedContent: state.generatedContent.map(content =>
          content.id === action.payload.id
            ? { ...content, ...action.payload.updates }
            : content
        ),
        lastSaved: new Date().toISOString()
      }
    
    case 'REMOVE_GENERATED_CONTENT':
      return {
        ...state,
        generatedContent: state.generatedContent.filter(content => content.id !== action.payload),
        lastSaved: new Date().toISOString()
      }
    
    case 'CLEAR_GENERATED_CONTENT':
      return {
        ...state,
        generatedContent: [],
        lastSaved: new Date().toISOString()
      }
    
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        ...action.payload
      }
    
    default:
      return state
  }
}

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
  const [state, dispatch] = useReducer(
    workflowReducer,
    { ...initialState, ...providedInitialState }
  )

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = loadFromStorage()
    if (Object.keys(savedData).length > 0) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedData })
    }
  }, [])

  // Save to localStorage on state changes
  useEffect(() => {
    saveToStorage(state)
  }, [state.progressState, state.generatedContent])

  // Action Creators - Progress Management
  const updateTaskStatus = useCallback((
    section: keyof ProgressState,
    task: string,
    status: ProgressStatus
  ) => {
    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { section, task, status } })
  }, [])

  const setActiveSection = useCallback((section: keyof ProgressState) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }, [])

  const getSectionStatusCallback = useCallback((section: keyof ProgressState): ProgressStatus => {
    return getSectionStatus(state.progressState, section)
  }, [state.progressState])

  const getOverallProgressCallback = useCallback((): number => {
    return getOverallProgress(state.progressState)
  }, [state.progressState])

  const canNavigateToSectionCallback = useCallback((targetSection: keyof ProgressState): boolean => {
    return canNavigateToSection(state.progressState, state.activeSection, targetSection)
  }, [state.progressState, state.activeSection])

  const resetProgress = useCallback(() => {
    dispatch({ type: 'RESET_PROGRESS' })
  }, [])

  const getNextIncompleteTaskCallback = useCallback(() => {
    return getNextIncompleteTask(state.progressState)
  }, [state.progressState])

  // Action Creators - Generated Content Management
  const addGeneratedContent = useCallback((content: Omit<GeneratedContent, 'id' | 'created'>): string => {
    const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newContent: GeneratedContent = {
      ...content,
      id,
      created: new Date().toISOString()
    }
    dispatch({ type: 'ADD_GENERATED_CONTENT', payload: newContent })
    return id
  }, [])

  const updateGeneratedContent = useCallback((id: string, updates: Partial<GeneratedContent>) => {
    dispatch({ type: 'UPDATE_GENERATED_CONTENT', payload: { id, updates } })
  }, [])

  const removeGeneratedContent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_GENERATED_CONTENT', payload: id })
  }, [])

  const getContentByType = useCallback((type: GeneratedContent['type']): GeneratedContent[] => {
    return state.generatedContent.filter(content => content.type === type)
  }, [state.generatedContent])

  const clearGeneratedContent = useCallback(() => {
    dispatch({ type: 'CLEAR_GENERATED_CONTENT' })
  }, [])

  // Action Creators - Processing State
  const setProcessing = useCallback((processing: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: processing })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const actions: WorkflowContextActions = {
    updateTaskStatus,
    setActiveSection,
    getSectionStatus: getSectionStatusCallback,
    getOverallProgress: getOverallProgressCallback,
    canNavigateToSection: canNavigateToSectionCallback,
    resetProgress,
    getNextIncompleteTask: getNextIncompleteTaskCallback,
    addGeneratedContent,
    updateGeneratedContent,
    removeGeneratedContent,
    getContentByType,
    clearGeneratedContent,
    setProcessing,
    setError,
    clearError
  }

  const value: WorkflowContextValue = {
    state,
    actions,
    progressSections
  }

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