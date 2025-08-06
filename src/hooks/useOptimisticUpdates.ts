import { useState } from 'react'
import { SitemapSection } from '../types/SitemapTypes'

const useOptimisticUpdates = () => {
  const [optimisticPages, setOptimisticPages] = useState<SitemapSection[]>([])

  const optimisticallyAddPage = (tempPage: SitemapSection): string => {
    const tempId = `temp-${Date.now()}`
    const pageWithTempId = { ...tempPage, id: tempId }
    
    setOptimisticPages(prev => [...prev, pageWithTempId])
    return tempId
  }

  const confirmOptimisticPage = (tempId: string, confirmedPage: SitemapSection) => {
    setOptimisticPages(prev => prev.map(page =>
      page.id === tempId ? confirmedPage : page
    ))
  }

  const revertOptimisticPage = (tempId: string) => {
    setOptimisticPages(prev => prev.filter(page => page.id !== tempId))
  }

  const clearOptimisticPages = () => {
    setOptimisticPages([])
  }

  return {
    optimisticPages,
    optimisticallyAddPage,
    confirmOptimisticPage,
    revertOptimisticPage,
    clearOptimisticPages
  }
}

export default useOptimisticUpdates