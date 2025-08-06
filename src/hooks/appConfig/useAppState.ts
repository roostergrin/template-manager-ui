import { useState } from 'react'

export const useAppState = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const setErrorState = (errorMessage: string | null) => {
    setError(errorMessage)
    if (errorMessage) {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const updateLastSaved = () => {
    setLastSaved(new Date().toISOString())
  }

  const resetState = () => {
    setIsLoading(false)
    setError(null)
    setLastSaved(null)
  }

  return {
    isLoading,
    error,
    lastSaved,
    setLoading,
    setError: setErrorState,
    clearError,
    updateLastSaved,
    resetState
  }
}