import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { QuestionnaireState, QuestionnaireMode, QuestionnaireDataSource } from '../types/QuestionnaireStateTypes'

// Context State Types
interface QuestionnaireContextState extends QuestionnaireState {
  isLoading: boolean
  error: string | null
}

// Context Actions
interface QuestionnaireContextActions {
  setActiveMode: (mode: QuestionnaireMode) => void
  setDataSource: (source: QuestionnaireDataSource) => void
  updateScrapeData: (domain: string, scraped_data?: Record<string, unknown>) => void
  updateQuestionnaireData: (data: Record<string, unknown>) => void
  updateTemplateMarkdown: (markdown: string) => void
  updateContentDocument: (content: string) => void
  resetData: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

interface QuestionnaireContextValue {
  state: QuestionnaireContextState
  actions: QuestionnaireContextActions
}

// Action Types
type QuestionnaireAction =
  | { type: 'SET_ACTIVE_MODE'; payload: QuestionnaireMode }
  | { type: 'SET_DATA_SOURCE'; payload: QuestionnaireDataSource }
  | { type: 'UPDATE_SCRAPE_DATA'; payload: { domain: string; scraped_data?: Record<string, unknown> } }
  | { type: 'UPDATE_QUESTIONNAIRE_DATA'; payload: Record<string, unknown> }
  | { type: 'UPDATE_TEMPLATE_MARKDOWN'; payload: string }
  | { type: 'UPDATE_CONTENT_DOCUMENT'; payload: string }
  | { type: 'RESET_DATA' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

// Initial State
const initialState: QuestionnaireContextState = {
  activeMode: 'scrape',
  dataSource: 'structured',
  data: {},
  isLoading: false,
  error: null
}

// Reducer
const questionnaireReducer = (
  state: QuestionnaireContextState,
  action: QuestionnaireAction
): QuestionnaireContextState => {
  switch (action.type) {
    case 'SET_ACTIVE_MODE':
      return {
        ...state,
        activeMode: action.payload,
        // Automatically switch data source based on mode
        dataSource: action.payload === 'template-markdown' || action.payload === 'content-document'
          ? 'markdown'
          : 'structured'
      }
    
    case 'SET_DATA_SOURCE':
      return {
        ...state,
        dataSource: action.payload
      }
    
    case 'UPDATE_SCRAPE_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          scrape: {
            domain: action.payload.domain,
            scraped_data: action.payload.scraped_data
          }
        }
      }
    
    case 'UPDATE_QUESTIONNAIRE_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          questionnaire: action.payload
        }
      }
    
    case 'UPDATE_TEMPLATE_MARKDOWN':
      return {
        ...state,
        data: {
          ...state.data,
          templateMarkdown: action.payload
        }
      }
    
    case 'UPDATE_CONTENT_DOCUMENT':
      return {
        ...state,
        data: {
          ...state.data,
          contentDocument: action.payload
        }
      }
    
    case 'RESET_DATA':
      return initialState
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Context
const QuestionnaireContext = createContext<QuestionnaireContextValue | undefined>(undefined)

// Provider Props
interface QuestionnaireProviderProps {
  children: ReactNode
  initialState?: Partial<QuestionnaireContextState>
}

// Provider Component
export const QuestionnaireProvider: React.FC<QuestionnaireProviderProps> = ({
  children,
  initialState: providedInitialState
}) => {
  const [state, dispatch] = useReducer(
    questionnaireReducer,
    { ...initialState, ...providedInitialState }
  )

  // Action Creators
  const setActiveMode = useCallback((mode: QuestionnaireMode) => {
    dispatch({ type: 'SET_ACTIVE_MODE', payload: mode })
  }, [])

  const setDataSource = useCallback((source: QuestionnaireDataSource) => {
    dispatch({ type: 'SET_DATA_SOURCE', payload: source })
  }, [])

  const updateScrapeData = useCallback((domain: string, scraped_data?: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_SCRAPE_DATA', payload: { domain, scraped_data } })
  }, [])

  const updateQuestionnaireData = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_QUESTIONNAIRE_DATA', payload: data })
  }, [])

  const updateTemplateMarkdown = useCallback((markdown: string) => {
    dispatch({ type: 'UPDATE_TEMPLATE_MARKDOWN', payload: markdown })
  }, [])

  const updateContentDocument = useCallback((content: string) => {
    dispatch({ type: 'UPDATE_CONTENT_DOCUMENT', payload: content })
  }, [])

  const resetData = useCallback(() => {
    dispatch({ type: 'RESET_DATA' })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const actions: QuestionnaireContextActions = {
    setActiveMode,
    setDataSource,
    updateScrapeData,
    updateQuestionnaireData,
    updateTemplateMarkdown,
    updateContentDocument,
    resetData,
    setLoading,
    setError,
    clearError
  }

  const value: QuestionnaireContextValue = {
    state,
    actions
  }

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  )
}

// Custom Hook
export const useQuestionnaire = (): QuestionnaireContextValue => {
  const context = useContext(QuestionnaireContext)
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider')
  }
  return context
}

export default QuestionnaireProvider