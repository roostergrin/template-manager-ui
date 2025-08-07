import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { QuestionnaireState, QuestionnaireMode, QuestionnaireDataSource } from '../types/QuestionnaireStateTypes'

// Custom Hooks
import useQuestionnaireMode from '../hooks/questionnaire/useQuestionnaireMode'
import useFormData from '../hooks/questionnaire/useFormData'
import useDataSource from '../hooks/questionnaire/useDataSource'
import useQuestionnaireError from '../hooks/questionnaire/useQuestionnaireError'

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
  // Initialize with provided initial state values or defaults
  const initialMode = providedInitialState?.activeMode || 'content-document'
  const initialDataSourceValue = providedInitialState?.dataSource || 'structured'
  const initialData = providedInitialState?.data || {}
  const initialLoading = providedInitialState?.isLoading || false
  const initialError = providedInitialState?.error || null

  // Custom Hooks
  const {
    activeMode,
    dataSource,
    setActiveMode,
    setDataSource: setModeDataSource
  } = useQuestionnaireMode(initialMode, initialDataSourceValue)

  const {
    data,
    updateScrapeData,
    updateQuestionnaireData,
    updateTemplateMarkdown,
    updateContentDocument,
    resetData
  } = useFormData(initialData)

  const {
    dataSource: independentDataSource,
    setDataSource: setIndependentDataSource
  } = useDataSource(dataSource)

  const {
    isLoading,
    error,
    setLoading,
    setError,
    clearError
  } = useQuestionnaireError(initialLoading, initialError)

  // Use the mode-driven data source as primary, but allow independent override
  const finalDataSource = independentDataSource !== dataSource ? independentDataSource : dataSource

  const setDataSource = (source: QuestionnaireDataSource) => {
    setModeDataSource(source)
    setIndependentDataSource(source)
  }

  // Compose state and actions using useMemo for performance
  const state = useMemo((): QuestionnaireContextState => ({
    activeMode,
    dataSource: finalDataSource,
    data,
    isLoading,
    error
  }), [activeMode, finalDataSource, data, isLoading, error])

  const actions = useMemo((): QuestionnaireContextActions => ({
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
  }), [
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
  ])

  const value: QuestionnaireContextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions])

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