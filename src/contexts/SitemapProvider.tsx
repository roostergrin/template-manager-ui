import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { SitemapSection, SitemapItem, StoredSitemap } from '../types/SitemapTypes'

const LOCAL_STORAGE_KEY = 'generatedSitemaps'

// Context State Types
interface SitemapContextState {
  pages: SitemapSection[]
  selectedPages: string[]
  viewMode: 'grid' | 'list'
  isLoading: boolean
  error: string | null
  lastSaved: string | null
}

// Context Actions
interface SitemapContextActions {
  // Page CRUD operations
  addPage: () => void
  removePage: (pageId: string) => void
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
  
  // Import/Export operations
  importPagesFromJson: (jsonData: string) => void
  handleGeneratedSitemap: (sitemapData: unknown) => void
  handleSelectStoredSitemap: (stored: StoredSitemap) => void
  
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

// Action Types
type SitemapAction =
  | { type: 'ADD_PAGE' }
  | { type: 'REMOVE_PAGE'; payload: string }
  | { type: 'UPDATE_PAGE_TITLE'; payload: { pageId: string; title: string } }
  | { type: 'UPDATE_PAGE_WORDPRESS_ID'; payload: { pageId: string; wordpressId: string } }
  | { type: 'UPDATE_PAGE_ITEMS'; payload: { pageId: string; items: SitemapItem[] } }
  | { type: 'SET_PAGES'; payload: SitemapSection[] }
  | { type: 'SELECT_PAGE'; payload: string }
  | { type: 'DESELECT_PAGE'; payload: string }
  | { type: 'TOGGLE_PAGE_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_PAGES' }
  | { type: 'DESELECT_ALL_PAGES' }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'IMPORT_PAGES_FROM_JSON'; payload: string }
  | { type: 'HANDLE_GENERATED_SITEMAP'; payload: unknown }
  | { type: 'HANDLE_SELECT_STORED_SITEMAP'; payload: StoredSitemap }
  | { type: 'OPTIMISTICALLY_ADD_PAGE'; payload: SitemapSection }
  | { type: 'CONFIRM_OPTIMISTIC_PAGE'; payload: { tempId: string; confirmedPage: SitemapSection } }
  | { type: 'REVERT_OPTIMISTIC_PAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

// Initial State
const initialState: SitemapContextState = {
  pages: [],
  selectedPages: [],
  viewMode: 'grid',
  isLoading: false,
  error: null,
  lastSaved: null
}

// Helper function to map imported pages
const mapImportedPages = (pagesObj: Record<string, any>): SitemapSection[] => {
  if (!pagesObj || typeof pagesObj !== 'object') return []
  return Object.entries(pagesObj).map(([title, pageData]) => {
    const { internal_id, page_id, model_query_pairs } = pageData as any
    return {
      id: internal_id,
      title,
      wordpress_id: page_id || '',
      items: model_query_pairs.map((item: any) => ({
        model: item.model,
        query: item.query,
        id: item.internal_id,
      })),
    }
  })
}

// Reducer
const sitemapReducer = (
  state: SitemapContextState,
  action: SitemapAction
): SitemapContextState => {
  switch (action.type) {
    case 'ADD_PAGE':
      return {
        ...state,
        pages: [
          ...state.pages,
          { 
            id: Date.now().toString(), 
            title: 'New Page', 
            items: [], 
            wordpress_id: '' 
          },
        ],
      }
    
    case 'REMOVE_PAGE':
      return {
        ...state,
        pages: state.pages.filter(page => page.id !== action.payload),
        selectedPages: state.selectedPages.filter(id => id !== action.payload)
      }
    
    case 'UPDATE_PAGE_TITLE':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId 
            ? { ...page, title: action.payload.title } 
            : page
        )
      }
    
    case 'UPDATE_PAGE_WORDPRESS_ID':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId 
            ? { ...page, wordpress_id: action.payload.wordpressId } 
            : page
        )
      }
    
    case 'UPDATE_PAGE_ITEMS':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId 
            ? { ...page, items: action.payload.items } 
            : page
        )
      }
    
    case 'SET_PAGES':
      return {
        ...state,
        pages: action.payload,
        selectedPages: [], // Clear selections when setting new pages
        lastSaved: new Date().toISOString()
      }
    
    case 'SELECT_PAGE':
      return {
        ...state,
        selectedPages: state.selectedPages.includes(action.payload)
          ? state.selectedPages
          : [...state.selectedPages, action.payload]
      }
    
    case 'DESELECT_PAGE':
      return {
        ...state,
        selectedPages: state.selectedPages.filter(id => id !== action.payload)
      }
    
    case 'TOGGLE_PAGE_SELECTION':
      return {
        ...state,
        selectedPages: state.selectedPages.includes(action.payload)
          ? state.selectedPages.filter(id => id !== action.payload)
          : [...state.selectedPages, action.payload]
      }
    
    case 'SELECT_ALL_PAGES':
      return {
        ...state,
        selectedPages: state.pages.map(page => page.id)
      }
    
    case 'DESELECT_ALL_PAGES':
      return {
        ...state,
        selectedPages: []
      }
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload
      }
    
    case 'IMPORT_PAGES_FROM_JSON':
      try {
        const importedData = JSON.parse(action.payload)
        if (importedData.pages) {
          return {
            ...state,
            pages: mapImportedPages(importedData.pages),
            selectedPages: [],
            lastSaved: new Date().toISOString(),
            error: null
          }
        }
        return state
      } catch (error) {
        return {
          ...state,
          error: 'Error importing JSON: Invalid format'
        }
      }
    
    case 'HANDLE_GENERATED_SITEMAP':
      if (!action.payload || typeof action.payload !== 'object' || !(action.payload as any).pages) {
        return state
      }
      
      const newPages = mapImportedPages((action.payload as any).pages)
      const name = prompt('Enter a name for this sitemap:', `Sitemap ${new Date().toLocaleString()}`) 
        || `Sitemap ${new Date().toLocaleString()}`
      
      const stored: StoredSitemap = {
        name,
        created: new Date().toISOString(),
        sitemap: action.payload,
      }
      
      // Store in localStorage
      const prev = localStorage.getItem(LOCAL_STORAGE_KEY)
      let arr: StoredSitemap[] = []
      if (prev) {
        try {
          arr = JSON.parse(prev) as StoredSitemap[]
        } catch {}
      }
      arr.push(stored)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr))
      
      return {
        ...state,
        pages: newPages,
        selectedPages: [],
        lastSaved: new Date().toISOString(),
        error: null
      }
    
    case 'HANDLE_SELECT_STORED_SITEMAP':
      if (action.payload && action.payload.sitemap && (action.payload.sitemap as any).pages) {
        return {
          ...state,
          pages: mapImportedPages((action.payload.sitemap as any).pages),
          selectedPages: [],
          lastSaved: action.payload.created,
          error: null
        }
      }
      return state
    
    case 'OPTIMISTICALLY_ADD_PAGE':
      return {
        ...state,
        pages: [...state.pages, action.payload]
      }
    
    case 'CONFIRM_OPTIMISTIC_PAGE':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.tempId ? action.payload.confirmedPage : page
        )
      }
    
    case 'REVERT_OPTIMISTIC_PAGE':
      return {
        ...state,
        pages: state.pages.filter(page => page.id !== action.payload),
        selectedPages: state.selectedPages.filter(id => id !== action.payload)
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Context
const SitemapContext = createContext<SitemapContextValue | undefined>(undefined)

// Provider Props
interface SitemapProviderProps {
  children: ReactNode
  initialState?: Partial<SitemapContextState>
}

// Provider Component
export const SitemapProvider: React.FC<SitemapProviderProps> = ({
  children,
  initialState: providedInitialState
}) => {
  const [state, dispatch] = useReducer(
    sitemapReducer,
    { ...initialState, ...providedInitialState }
  )

  // Action Creators
  const addPage = useCallback(() => {
    dispatch({ type: 'ADD_PAGE' })
  }, [])

  const removePage = useCallback((pageId: string) => {
    dispatch({ type: 'REMOVE_PAGE', payload: pageId })
  }, [])

  const updatePageTitle = useCallback((pageId: string, newTitle: string) => {
    dispatch({ type: 'UPDATE_PAGE_TITLE', payload: { pageId, title: newTitle } })
  }, [])

  const updatePageWordpressId = useCallback((pageId: string, newId: string) => {
    dispatch({ type: 'UPDATE_PAGE_WORDPRESS_ID', payload: { pageId, wordpressId: newId } })
  }, [])

  const updatePageItems = useCallback((pageId: string, newItems: SitemapItem[]) => {
    dispatch({ type: 'UPDATE_PAGE_ITEMS', payload: { pageId, items: newItems } })
  }, [])

  const setPages = useCallback((pages: SitemapSection[]) => {
    dispatch({ type: 'SET_PAGES', payload: pages })
  }, [])

  const selectPage = useCallback((pageId: string) => {
    dispatch({ type: 'SELECT_PAGE', payload: pageId })
  }, [])

  const deselectPage = useCallback((pageId: string) => {
    dispatch({ type: 'DESELECT_PAGE', payload: pageId })
  }, [])

  const togglePageSelection = useCallback((pageId: string) => {
    dispatch({ type: 'TOGGLE_PAGE_SELECTION', payload: pageId })
  }, [])

  const selectAllPages = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_PAGES' })
  }, [])

  const deselectAllPages = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL_PAGES' })
  }, [])

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }, [])

  const importPagesFromJson = useCallback((jsonData: string) => {
    dispatch({ type: 'IMPORT_PAGES_FROM_JSON', payload: jsonData })
  }, [])

  const handleGeneratedSitemap = useCallback((sitemapData: unknown) => {
    dispatch({ type: 'HANDLE_GENERATED_SITEMAP', payload: sitemapData })
  }, [])

  const handleSelectStoredSitemap = useCallback((stored: StoredSitemap) => {
    dispatch({ type: 'HANDLE_SELECT_STORED_SITEMAP', payload: stored })
  }, [])

  const optimisticallyAddPage = useCallback((tempPage: SitemapSection): string => {
    const tempId = `temp-${Date.now()}`
    const pageWithTempId = { ...tempPage, id: tempId }
    dispatch({ type: 'OPTIMISTICALLY_ADD_PAGE', payload: pageWithTempId })
    return tempId
  }, [])

  const confirmOptimisticPage = useCallback((tempId: string, confirmedPage: SitemapSection) => {
    dispatch({ type: 'CONFIRM_OPTIMISTIC_PAGE', payload: { tempId, confirmedPage } })
  }, [])

  const revertOptimisticPage = useCallback((tempId: string) => {
    dispatch({ type: 'REVERT_OPTIMISTIC_PAGE', payload: tempId })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const actions: SitemapContextActions = {
    addPage,
    removePage,
    updatePageTitle,
    updatePageWordpressId,
    updatePageItems,
    setPages,
    selectPage,
    deselectPage,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    setViewMode,
    importPagesFromJson,
    handleGeneratedSitemap,
    handleSelectStoredSitemap,
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