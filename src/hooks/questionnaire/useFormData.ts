import { useState, useCallback } from 'react'

interface FormDataState {
  scrape?: {
    domain: string
    scraped_data?: Record<string, unknown>
  }
  questionnaire?: Record<string, unknown>
  templateMarkdown?: string
  contentDocument?: string
}

interface UseFormDataReturn {
  data: FormDataState
  updateScrapeData: (domain: string, scraped_data?: Record<string, unknown>) => void
  updateQuestionnaireData: (data: Record<string, unknown>) => void
  updateTemplateMarkdown: (markdown: string) => void
  updateContentDocument: (content: string) => void
  resetData: () => void
  hasData: boolean
  hasScrapeData: boolean
  hasQuestionnaireData: boolean
  hasTemplateMarkdown: boolean
  hasContentDocument: boolean
}

const useFormData = (initialData: FormDataState = {}): UseFormDataReturn => {
  const [data, setData] = useState<FormDataState>(initialData)

  const updateScrapeData = useCallback((domain: string, scraped_data?: Record<string, unknown>) => {
    setData(prevData => ({
      ...prevData,
      scrape: {
        domain,
        scraped_data
      }
    }))
  }, [])

  const updateQuestionnaireData = useCallback((questionnaireData: Record<string, unknown>) => {
    setData(prevData => ({
      ...prevData,
      questionnaire: questionnaireData
    }))
  }, [])

  const updateTemplateMarkdown = useCallback((markdown: string) => {
    setData(prevData => ({
      ...prevData,
      templateMarkdown: markdown
    }))
  }, [])

  const updateContentDocument = useCallback((content: string) => {
    setData(prevData => ({
      ...prevData,
      contentDocument: content
    }))
  }, [])

  const resetData = useCallback(() => {
    setData({})
  }, [])

  // Computed values for convenience
  const hasData = Object.keys(data).length > 0
  const hasScrapeData = !!data.scrape
  const hasQuestionnaireData = !!data.questionnaire && Object.keys(data.questionnaire).length > 0
  const hasTemplateMarkdown = !!data.templateMarkdown && data.templateMarkdown.length > 0
  const hasContentDocument = !!data.contentDocument && data.contentDocument.length > 0

  return {
    data,
    updateScrapeData,
    updateQuestionnaireData,
    updateTemplateMarkdown,
    updateContentDocument,
    resetData,
    hasData,
    hasScrapeData,
    hasQuestionnaireData,
    hasTemplateMarkdown,
    hasContentDocument
  }
}

export default useFormData