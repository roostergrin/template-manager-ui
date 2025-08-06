import { useState, useCallback } from 'react'

const useWorkflowError = () => {
  const [isProcessing, setIsProcessingState] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)

  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessingState(processing)
  }, [])

  const setError = useCallback((error: string | null) => {
    setErrorState(error)
    if (error) {
      setIsProcessingState(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  return {
    isProcessing,
    error,
    setProcessing,
    setError,
    clearError
  }
}

export default useWorkflowError