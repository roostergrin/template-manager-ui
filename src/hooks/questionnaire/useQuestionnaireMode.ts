import { useState, useCallback } from 'react'
import { QuestionnaireMode, QuestionnaireDataSource } from '../../types/QuestionnaireStateTypes'

interface UseQuestionnaireModeReturn {
  activeMode: QuestionnaireMode
  dataSource: QuestionnaireDataSource
  setActiveMode: (mode: QuestionnaireMode) => void
  setDataSource: (source: QuestionnaireDataSource) => void
  isMarkdownMode: boolean
  isStructuredMode: boolean
}

const useQuestionnaireMode = (
  initialMode: QuestionnaireMode = 'scrape',
  initialDataSource: QuestionnaireDataSource = 'structured'
): UseQuestionnaireModeReturn => {
  const [activeMode, setActiveModeState] = useState<QuestionnaireMode>(initialMode)
  const [dataSource, setDataSourceState] = useState<QuestionnaireDataSource>(initialDataSource)

  const setActiveMode = useCallback((mode: QuestionnaireMode) => {
    setActiveModeState(mode)
    // Automatically switch data source based on mode
    if (mode === 'template-markdown' || mode === 'content-document') {
      setDataSourceState('markdown')
    } else {
      setDataSourceState('structured')
    }
  }, [])

  const setDataSource = useCallback((source: QuestionnaireDataSource) => {
    setDataSourceState(source)
  }, [])

  const isMarkdownMode = dataSource === 'markdown'
  const isStructuredMode = dataSource === 'structured'

  return {
    activeMode,
    dataSource,
    setActiveMode,
    setDataSource,
    isMarkdownMode,
    isStructuredMode
  }
}

export default useQuestionnaireMode