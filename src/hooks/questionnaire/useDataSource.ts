import { useState, useCallback } from 'react'
import { QuestionnaireDataSource } from '../../types/QuestionnaireStateTypes'

interface UseDataSourceReturn {
  dataSource: QuestionnaireDataSource
  setDataSource: (source: QuestionnaireDataSource) => void
  isStructuredData: boolean
  isMarkdownData: boolean
  switchToStructured: () => void
  switchToMarkdown: () => void
}

const useDataSource = (initialDataSource: QuestionnaireDataSource = 'structured'): UseDataSourceReturn => {
  const [dataSource, setDataSourceState] = useState<QuestionnaireDataSource>(initialDataSource)

  const setDataSource = useCallback((source: QuestionnaireDataSource) => {
    setDataSourceState(source)
  }, [])

  const switchToStructured = useCallback(() => {
    setDataSourceState('structured')
  }, [])

  const switchToMarkdown = useCallback(() => {
    setDataSourceState('markdown')
  }, [])

  const isStructuredData = dataSource === 'structured'
  const isMarkdownData = dataSource === 'markdown'

  return {
    dataSource,
    setDataSource,
    isStructuredData,
    isMarkdownData,
    switchToStructured,
    switchToMarkdown
  }
}

export default useDataSource