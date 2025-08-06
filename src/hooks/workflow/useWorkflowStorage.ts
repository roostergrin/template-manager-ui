import { useCallback, useRef } from 'react'
import { ProgressState, GeneratedContent } from '../../contexts/WorkflowProvider'

interface WorkflowStorageState {
  progressState?: ProgressState
  generatedContent?: GeneratedContent[]
}

const STORAGE_KEY = 'template-manager-progress'
const CONTENT_STORAGE_KEY = 'template-manager-generated-content'

const useWorkflowStorage = () => {
  const lastSavedRef = useRef<string | null>(null)

  const loadFromStorage = useCallback((): WorkflowStorageState => {
    try {
      const progressData = localStorage.getItem(STORAGE_KEY)
      const contentData = localStorage.getItem(CONTENT_STORAGE_KEY)
      
      const result: WorkflowStorageState = {}
      
      if (progressData) {
        result.progressState = JSON.parse(progressData)
      }
      
      if (contentData) {
        result.generatedContent = JSON.parse(contentData)
      }
      
      return result
    } catch (error) {
      console.warn('Failed to load workflow data from localStorage:', error)
      return {}
    }
  }, [])

  const saveToStorage = useCallback((
    progressState: ProgressState,
    generatedContent: GeneratedContent[]
  ) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState))
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(generatedContent))
      lastSavedRef.current = new Date().toISOString()
    } catch (error) {
      console.warn('Failed to save workflow data to localStorage:', error)
    }
  }, [])

  const getLastSaved = () => {
    return lastSavedRef.current
  }

  return {
    loadFromStorage,
    saveToStorage,
    getLastSaved
  }
}

export default useWorkflowStorage