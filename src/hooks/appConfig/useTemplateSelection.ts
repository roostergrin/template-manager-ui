import { useState, useCallback } from 'react'

export const useTemplateSelection = (initialTemplateKey: string | null = null) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(initialTemplateKey)

  const setSelectedTemplate = (key: string | null) => {
    setSelectedTemplateKey(key)
  }

  const clearSelectedTemplate = () => {
    setSelectedTemplateKey(null)
  }

  // These depend on selectedTemplateKey and might be used in dependency arrays
  const hasSelectedTemplate = useCallback(() => {
    return selectedTemplateKey !== null
  }, [selectedTemplateKey])

  const isTemplateSelected = useCallback((templateKey: string) => {
    return selectedTemplateKey === templateKey
  }, [selectedTemplateKey])

  return {
    selectedTemplateKey,
    setSelectedTemplate,
    clearSelectedTemplate,
    hasSelectedTemplate,
    isTemplateSelected
  }
}