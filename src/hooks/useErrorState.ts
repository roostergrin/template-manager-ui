import { useState, useCallback } from 'react'

const useErrorState = (initialError: string | null = null) => {
  const [error, setError] = useState<string | null>(initialError)
  const [isLoading, setIsLoading] = useState(false)

  const setErrorMessage = (errorMessage: string | null) => {
    setError(errorMessage)
    if (errorMessage) {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  // Keep useCallback for this complex function that might be passed to other components
  const handleAsyncOperation = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        setIsLoading(true)
        setError(null) // Use direct setter instead of clearError
        const result = await operation()
        setIsLoading(false)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMessage)
        setIsLoading(false)
        return null
      }
    },
    [] // No dependencies since we use setters directly
  )

  return {
    error,
    isLoading,
    setError: setErrorMessage,
    clearError,
    setLoading,
    handleAsyncOperation
  }
}

export default useErrorState