import { useState, useCallback } from 'react'

interface UseQuestionnaireErrorReturn {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  hasError: boolean
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>
  withErrorHandling: <T>(asyncFn: () => Promise<T>) => Promise<T | null>
}

const useQuestionnaireError = (
  initialLoading = false,
  initialError: string | null = null
): UseQuestionnaireErrorReturn => {
  const [isLoading, setLoadingState] = useState<boolean>(initialLoading)
  const [error, setErrorState] = useState<string | null>(initialError)

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading)
  }, [])

  const setError = useCallback((error: string | null) => {
    setErrorState(error)
    if (error) {
      setLoadingState(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      const result = await asyncFn()
      setLoading(false)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      throw err
    }
  }, [setLoading, setError])

  const withErrorHandling = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError()
      return await withLoading(asyncFn)
    } catch (err) {
      console.error('Questionnaire operation failed:', err)
      return null
    }
  }, [clearError, withLoading])

  const hasError = error !== null

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    hasError,
    withLoading,
    withErrorHandling
  }
}

export default useQuestionnaireError