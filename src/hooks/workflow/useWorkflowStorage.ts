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
      // Always save progress state (small)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState))

      // Check content size before attempting to save
      const contentJson = JSON.stringify(generatedContent)
      const contentSizeKB = new Blob([contentJson]).size / 1024

      // Skip saving if content exceeds reasonable threshold (2MB)
      if (contentSizeKB > 2048) {
        console.warn(`Generated content too large for localStorage (${Math.round(contentSizeKB)}KB). Skipping content persistence.`)
        // Clear existing content storage to free space
        localStorage.removeItem(CONTENT_STORAGE_KEY)
        lastSavedRef.current = new Date().toISOString()
        return
      }

      localStorage.setItem(CONTENT_STORAGE_KEY, contentJson)
      lastSavedRef.current = new Date().toISOString()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing content storage.')
        localStorage.removeItem(CONTENT_STORAGE_KEY)
      } else {
        console.warn('Failed to save workflow data to localStorage:', error)
      }
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