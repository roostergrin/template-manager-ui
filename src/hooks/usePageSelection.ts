import { useState } from 'react'

const usePageSelection = (initialSelected: string[] = []) => {
  const [selectedPages, setSelectedPages] = useState<string[]>(initialSelected)

  const selectPage = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) ? prev : [...prev, pageId]
    )
  }

  const deselectPage = (pageId: string) => {
    setSelectedPages(prev => prev.filter(id => id !== pageId))
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    )
  }

  const selectAllPages = (allPageIds: string[]) => {
    setSelectedPages(allPageIds)
  }

  const deselectAllPages = () => {
    setSelectedPages([])
  }

  const clearSelection = () => {
    setSelectedPages([])
  }

  return {
    selectedPages,
    selectPage,
    deselectPage,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    clearSelection
  }
}

export default usePageSelection