import React, { createContext, useContext, ReactNode } from 'react'
import { SitemapSection, SitemapItem, StoredSitemap } from '../types/SitemapTypes'
import usePages from '../hooks/usePages'
import usePageSelection from '../hooks/usePageSelection'
import useViewControls from '../hooks/useViewControls'
import useOptimisticUpdates from '../hooks/useOptimisticUpdates'
import useErrorState from '../hooks/useErrorState'
import useSitemapImport from '../hooks/useSitemapImport'

// Context State Types (now simplified with hooks)
interface SitemapContextState {
  pages: SitemapSection[]
  selectedPages: string[]
  viewMode: 'grid' | 'list'
  layoutType: 'standard' | 'toc'
  isLoading: boolean
  error: string | null
  lastSaved: string | null
  sitemapSource: 'loaded' | 'generated' | null
  sitemapName: string | null
  // View controls
  showSelect: boolean
  showTextarea: boolean
  showDeleteButtons: boolean
  showItemNumbers: boolean
  showPageIds: boolean
  showItems: boolean
  usePageJson: boolean
  // Layout controls
  useGridLayout: boolean
  gridColumnWidth: number
  // Optimistic updates
  optimisticPages: SitemapSection[]
}

// Context Actions
interface SitemapContextActions {
  // Page CRUD operations
  addPage: () => void
  removePage: (pageId: string) => void
  duplicatePage: (pageId: string) => void
  updatePageTitle: (pageId: string, newTitle: string) => void
  updatePageWordpressId: (pageId: string, newId: string) => void
  updatePageItems: (pageId: string, newItems: SitemapItem[]) => void
  setPages: (pages: SitemapSection[]) => void

  // Page selection
  selectPage: (pageId: string) => void
  deselectPage: (pageId: string) => void
  togglePageSelection: (pageId: string) => void
  selectAllPages: () => void
  deselectAllPages: () => void
  
  // View controls
  setViewMode: (mode: 'grid' | 'list') => void
  setLayoutType: (type: 'standard' | 'toc') => void
  toggleLayoutType: () => void
  toggleShowSelect: () => void
  toggleShowTextarea: () => void
  toggleShowDeleteButtons: () => void
  toggleShowItemNumbers: () => void
  toggleShowPageIds: () => void
  setShowItems: (show: boolean) => void
  toggleUsePageJson: () => void

  // Layout controls
  toggleUseGridLayout: () => void
  setGridColumnWidth: (width: number) => void
  
  // Import/Export operations
  importPagesFromJson: (jsonData: string) => void
  handleGeneratedSitemap: (sitemapData: unknown, siteType?: string) => void
  handleSelectStoredSitemap: (stored: StoredSitemap) => void
  resetToDefaultSitemap: () => void
  
  // Optimistic updates
  optimisticallyAddPage: (tempPage: SitemapSection) => string
  confirmOptimisticPage: (tempId: string, confirmedPage: SitemapSection) => void
  revertOptimisticPage: (tempId: string) => void
  
  // Loading and error handling
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

interface SitemapContextValue {
  state: SitemapContextState
  actions: SitemapContextActions
}

// Context
const SitemapContext = createContext<SitemapContextValue | undefined>(undefined)

// Provider Props
interface SitemapProviderProps {
  children: ReactNode
  initialState?: Partial<SitemapContextState>
}

// Provider Component - Now using custom hooks instead of reducer!
export const SitemapProvider: React.FC<SitemapProviderProps> = ({
  children,
  initialState = {}
}) => {
  // Initialize all the custom hooks
  const { pages, addPage, removePage, updatePageTitle, updatePageWordpressId, updatePageItems, setPages, duplicatePage } = usePages(initialState.pages || [])
  
  const { 
    selectedPages, 
    selectPage, 
    deselectPage, 
    togglePageSelection, 
    selectAllPages: selectAllPagesHook, 
    deselectAllPages,
    clearSelection
  } = usePageSelection(initialState.selectedPages || [])
  
  const {
    viewMode,
    layoutType,
    showSelect,
    showTextarea,
    showDeleteButtons,
    showItemNumbers,
    showPageIds,
    usePageJson,
    showItems,
    useGridLayout,
    gridColumnWidth,
    setViewMode,
    setLayoutType,
    toggleLayoutType,
    toggleShowSelect,
    toggleShowTextarea,
    toggleShowDeleteButtons,
    toggleShowItemNumbers,
    toggleShowPageIds,
     setShowItems,
    toggleUsePageJson,
    toggleUseGridLayout,
    setGridColumnWidth
  } = useViewControls({
    ...(initialState.viewMode !== undefined && { viewMode: initialState.viewMode }),
    ...(initialState.showSelect !== undefined && { showSelect: initialState.showSelect }),
    ...(initialState.showTextarea !== undefined && { showTextarea: initialState.showTextarea }),
    ...(initialState.showDeleteButtons !== undefined && { showDeleteButtons: initialState.showDeleteButtons }),
    ...(initialState.showItemNumbers !== undefined && { showItemNumbers: initialState.showItemNumbers }),
    ...(initialState.showPageIds !== undefined && { showPageIds: initialState.showPageIds }),
    ...(initialState.usePageJson !== undefined && { usePageJson: initialState.usePageJson }),
    ...(initialState.useGridLayout !== undefined && { useGridLayout: initialState.useGridLayout }),
    ...(initialState.gridColumnWidth !== undefined && { gridColumnWidth: initialState.gridColumnWidth })
  })
  
  const { optimisticPages, optimisticallyAddPage, confirmOptimisticPage, revertOptimisticPage } = useOptimisticUpdates()
  
  const { error, isLoading, setError, clearError, setLoading } = useErrorState(initialState.error || null)
  
  const { lastSaved, sitemapSource, sitemapName, importPagesFromJson, handleGeneratedSitemap, handleSelectStoredSitemap, resetToDefault } = useSitemapImport()

  // Enhanced functions that coordinate between hooks
  const selectAllPages = () => {
    selectAllPagesHook(pages.map(page => page.id))
  }

  const handleSetPages = (newPages: SitemapSection[]) => {
    setPages(newPages)
    clearSelection() // Clear selections when setting new pages
  }

  const handleRemovePage = (pageId: string) => {
    removePage(pageId)
    deselectPage(pageId) // Remove from selection too
  }

  const handleImportPagesFromJson = (jsonData: string) => {
    try {
      const importedPages = importPagesFromJson(jsonData)
      if (importedPages) {
        setPages(importedPages)
        clearSelection()
        clearError()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleGeneratedSitemapWrapper = (sitemapData: unknown, siteType?: string) => {
    try {
      const newPages = handleGeneratedSitemap(sitemapData, siteType)
      if (newPages) {
        setPages(newPages)
        clearSelection()
        clearError()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle generated sitemap')
    }
  }

  const handleSelectStoredSitemapWrapper = (stored: StoredSitemap) => {
    try {
      const storedPages = handleSelectStoredSitemap(stored)
      if (storedPages) {
        setPages(storedPages)
        clearSelection()
        clearError()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stored sitemap')
    }
  }

  // Combine all pages (regular + optimistic)
  const allPages = [...pages, ...optimisticPages]

  const state: SitemapContextState = {
    pages: allPages,
    selectedPages,
    viewMode,
    layoutType,
    isLoading,
    error,
    lastSaved,
    sitemapSource,
    sitemapName,
    showSelect,
    showTextarea,
    showDeleteButtons,
    showItemNumbers,
    showPageIds,
    usePageJson,
    useGridLayout,
    gridColumnWidth,
      showItems,
    optimisticPages
  }

  const actions: SitemapContextActions = {
    addPage,
    removePage: handleRemovePage,
    duplicatePage,
    updatePageTitle,
    updatePageWordpressId,
    updatePageItems,
    setPages: handleSetPages,
    selectPage,
    deselectPage,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    setViewMode,
    setLayoutType,
    toggleLayoutType,
    toggleShowSelect,
    toggleShowTextarea,
    toggleShowDeleteButtons,
    toggleShowItemNumbers,
    toggleShowPageIds,
    setShowItems,
    toggleUsePageJson,
    toggleUseGridLayout,
    setGridColumnWidth,
    importPagesFromJson: handleImportPagesFromJson,
    handleGeneratedSitemap: handleGeneratedSitemapWrapper,
    handleSelectStoredSitemap: handleSelectStoredSitemapWrapper,
    resetToDefaultSitemap: resetToDefault,
    optimisticallyAddPage,
    confirmOptimisticPage,
    revertOptimisticPage,
    setLoading,
    setError,
    clearError
  }

  const value: SitemapContextValue = {
    state,
    actions
  }

  return (
    <SitemapContext.Provider value={value}>
      {children}
    </SitemapContext.Provider>
  )
}

// Custom Hook
export const useSitemap = (): SitemapContextValue => {
  const context = useContext(SitemapContext)
  if (context === undefined) {
    throw new Error('useSitemap must be used within a SitemapProvider')
  }
  return context
}

export default SitemapProvider
