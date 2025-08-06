import { useState, useCallback } from 'react'
import { GeneratedContent } from '../../contexts/WorkflowProvider'

const useGeneratedContent = (initialContent?: GeneratedContent[]) => {
  // Load from localStorage on initialization if no initial content provided
  const getInitialContent = (): GeneratedContent[] => {
    if (initialContent) return initialContent
    
    try {
      const saved = localStorage.getItem('template-manager-generated-content')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load generated content from localStorage:', error)
    }
    
    return []
  }

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(getInitialContent)

  const addGeneratedContent = useCallback((content: Omit<GeneratedContent, 'id' | 'created'>): string => {
    const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newContent: GeneratedContent = {
      ...content,
      id,
      created: new Date().toISOString()
    }
    
    setGeneratedContent(prevContent => [...prevContent, newContent])
    return id
  }, [])

  const updateGeneratedContent = useCallback((id: string, updates: Partial<GeneratedContent>) => {
    setGeneratedContent(prevContent => 
      prevContent.map(content =>
        content.id === id
          ? { ...content, ...updates }
          : content
      )
    )
  }, [])

  const removeGeneratedContent = useCallback((id: string) => {
    setGeneratedContent(prevContent => 
      prevContent.filter(content => content.id !== id)
    )
  }, [])

  const getContentByType = (type: GeneratedContent['type']): GeneratedContent[] => {
    return generatedContent.filter(content => content.type === type)
  }

  const clearGeneratedContent = useCallback(() => {
    setGeneratedContent([])
  }, [])

  return {
    generatedContent,
    addGeneratedContent,
    updateGeneratedContent,
    removeGeneratedContent,
    getContentByType,
    clearGeneratedContent
  }
}

export default useGeneratedContent