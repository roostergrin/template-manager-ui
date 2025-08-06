import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { vi } from 'vitest'
import { SitemapProvider, useSitemap } from '../SitemapProvider'
import { SitemapSection, SitemapItem, StoredSitemap } from '../../types/SitemapTypes'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock prompt
global.prompt = vi.fn(() => 'Test Sitemap')

const createWrapper = (initialState?: any) => {
  return ({ children }: { children: ReactNode }) => (
    <SitemapProvider initialState={initialState}>
      {children}
    </SitemapProvider>
  )
}

const mockPage: SitemapSection = {
  id: '1',
  title: 'Test Page',
  items: [{ id: '1', model: 'test', query: 'test query' }],
  wordpress_id: 'wp-1'
}

const mockSitemapData = {
  pages: {
    'Test Page': {
      internal_id: '1',
      page_id: 'wp-1',
      model_query_pairs: [
        { internal_id: '1', model: 'test', query: 'test query' }
      ]
    }
  }
}

describe('SitemapProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Access', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useSitemap())
      }).toThrow('useSitemap must be used within a SitemapProvider')
    })

    it('should provide context value when used within provider', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toBeDefined()
      expect(result.current.actions).toBeDefined()
    })
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toEqual({
        pages: [],
        selectedPages: [],
        viewMode: 'grid',
        isLoading: false,
        error: null,
        lastSaved: null
      })
    })

    it('should accept custom initial state', () => {
      const customInitialState = {
        pages: [mockPage],
        viewMode: 'list' as const,
        isLoading: true
      }

      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper(customInitialState)
      })

      expect(result.current.state.pages).toEqual([mockPage])
      expect(result.current.state.viewMode).toBe('list')
      expect(result.current.state.isLoading).toBe(true)
    })
  })

  describe('Page CRUD Operations', () => {
    it('should add new page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.addPage()
      })

      expect(result.current.state.pages).toHaveLength(1)
      expect(result.current.state.pages[0]).toMatchObject({
        title: 'New Page',
        items: [],
        wordpress_id: ''
      })
      expect(result.current.state.pages[0].id).toBeDefined()
    })

    it('should remove page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: [mockPage] })
      })

      act(() => {
        result.current.actions.removePage('1')
      })

      expect(result.current.state.pages).toHaveLength(0)
    })

    it('should update page title', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: [mockPage] })
      })

      act(() => {
        result.current.actions.updatePageTitle('1', 'Updated Title')
      })

      expect(result.current.state.pages[0].title).toBe('Updated Title')
    })

    it('should update page wordpress ID', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: [mockPage] })
      })

      act(() => {
        result.current.actions.updatePageWordpressId('1', 'new-wp-id')
      })

      expect(result.current.state.pages[0].wordpress_id).toBe('new-wp-id')
    })

    it('should update page items', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: [mockPage] })
      })

      const newItems: SitemapItem[] = [
        { id: '2', model: 'new-model', query: 'new query' }
      ]

      act(() => {
        result.current.actions.updatePageItems('1', newItems)
      })

      expect(result.current.state.pages[0].items).toEqual(newItems)
    })

    it('should set pages and clear selections', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ selectedPages: ['1'] })
      })

      const newPages = [mockPage, { ...mockPage, id: '2', title: 'Page 2' }]

      act(() => {
        result.current.actions.setPages(newPages)
      })

      expect(result.current.state.pages).toEqual(newPages)
      expect(result.current.state.selectedPages).toEqual([])
      expect(result.current.state.lastSaved).toBeDefined()
    })
  })

  describe('Page Selection', () => {
    const multiplePages = [
      mockPage,
      { ...mockPage, id: '2', title: 'Page 2' },
      { ...mockPage, id: '3', title: 'Page 3' }
    ]

    it('should select page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: multiplePages })
      })

      act(() => {
        result.current.actions.selectPage('1')
      })

      expect(result.current.state.selectedPages).toContain('1')
    })

    it('should not duplicate selection', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: multiplePages, selectedPages: ['1'] })
      })

      act(() => {
        result.current.actions.selectPage('1')
      })

      expect(result.current.state.selectedPages).toEqual(['1'])
    })

    it('should deselect page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: multiplePages, selectedPages: ['1', '2'] })
      })

      act(() => {
        result.current.actions.deselectPage('1')
      })

      expect(result.current.state.selectedPages).toEqual(['2'])
    })

    it('should toggle page selection', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: multiplePages })
      })

      act(() => {
        result.current.actions.togglePageSelection('1')
      })
      expect(result.current.state.selectedPages).toContain('1')

      act(() => {
        result.current.actions.togglePageSelection('1')
      })
      expect(result.current.state.selectedPages).not.toContain('1')
    })

    it('should select all pages', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ pages: multiplePages })
      })

      act(() => {
        result.current.actions.selectAllPages()
      })

      expect(result.current.state.selectedPages).toEqual(['1', '2', '3'])
    })

    it('should deselect all pages', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ 
          pages: multiplePages, 
          selectedPages: ['1', '2', '3'] 
        })
      })

      act(() => {
        result.current.actions.deselectAllPages()
      })

      expect(result.current.state.selectedPages).toEqual([])
    })

    it('should remove page from selections when page is removed', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ 
          pages: multiplePages, 
          selectedPages: ['1', '2'] 
        })
      })

      act(() => {
        result.current.actions.removePage('1')
      })

      expect(result.current.state.selectedPages).toEqual(['2'])
    })
  })

  describe('View Controls', () => {
    it('should set view mode', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setViewMode('list')
      })

      expect(result.current.state.viewMode).toBe('list')
    })
  })

  describe('Import/Export Operations', () => {
    it('should import pages from valid JSON', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      const jsonData = JSON.stringify(mockSitemapData)

      act(() => {
        result.current.actions.importPagesFromJson(jsonData)
      })

      expect(result.current.state.pages).toHaveLength(1)
      expect(result.current.state.pages[0]).toMatchObject({
        id: '1',
        title: 'Test Page',
        wordpress_id: 'wp-1'
      })
      expect(result.current.state.lastSaved).toBeDefined()
      expect(result.current.state.error).toBeNull()
    })

    it('should handle invalid JSON', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.importPagesFromJson('invalid json')
      })

      expect(result.current.state.pages).toHaveLength(0)
      expect(result.current.state.error).toBe('Error importing JSON: Invalid format')
    })

    it('should handle generated sitemap', () => {
      mockLocalStorage.getItem.mockReturnValue('[]')

      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.handleGeneratedSitemap(mockSitemapData)
      })

      expect(result.current.state.pages).toHaveLength(1)
      expect(result.current.state.pages[0]).toMatchObject({
        id: '1',
        title: 'Test Page',
        wordpress_id: 'wp-1'
      })
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should handle invalid generated sitemap', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.handleGeneratedSitemap(null)
      })

      expect(result.current.state.pages).toHaveLength(0)
    })

    it('should handle select stored sitemap', () => {
      const storedSitemap: StoredSitemap = {
        name: 'Test Sitemap',
        created: '2023-01-01T00:00:00.000Z',
        sitemap: mockSitemapData
      }

      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.handleSelectStoredSitemap(storedSitemap)
      })

      expect(result.current.state.pages).toHaveLength(1)
      expect(result.current.state.lastSaved).toBe('2023-01-01T00:00:00.000Z')
    })
  })

  describe('Optimistic Updates', () => {
    it('should optimistically add page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      let tempId: string

      act(() => {
        tempId = result.current.actions.optimisticallyAddPage(mockPage)
      })

      expect(result.current.state.pages).toHaveLength(1)
      expect(result.current.state.pages[0].id).toBe(tempId!)
      expect(tempId!).toMatch(/^temp-\d+$/)
    })

    it('should confirm optimistic page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      let tempId: string

      act(() => {
        tempId = result.current.actions.optimisticallyAddPage(mockPage)
      })

      const confirmedPage = { ...mockPage, id: 'confirmed-1' }

      act(() => {
        result.current.actions.confirmOptimisticPage(tempId!, confirmedPage)
      })

      expect(result.current.state.pages[0].id).toBe('confirmed-1')
    })

    it('should revert optimistic page', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      let tempId: string

      act(() => {
        tempId = result.current.actions.optimisticallyAddPage(mockPage)
      })

      expect(result.current.state.pages).toHaveLength(1)

      act(() => {
        result.current.actions.revertOptimisticPage(tempId!)
      })

      expect(result.current.state.pages).toHaveLength(0)
    })

    it('should remove optimistic page from selections when reverted', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      let tempId: string

      act(() => {
        tempId = result.current.actions.optimisticallyAddPage(mockPage)
      })

      act(() => {
        result.current.actions.selectPage(tempId!)
      })

      expect(result.current.state.selectedPages).toContain(tempId!)

      act(() => {
        result.current.actions.revertOptimisticPage(tempId!)
      })

      expect(result.current.state.selectedPages).not.toContain(tempId!)
    })
  })

  describe('Loading and Error Handling', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setLoading(true)
      })

      expect(result.current.state.isLoading).toBe(true)
    })

    it('should set error and clear loading', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ isLoading: true })
      })

      act(() => {
        result.current.actions.setError('Test error')
      })

      expect(result.current.state.error).toBe('Test error')
      expect(result.current.state.isLoading).toBe(false)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper({ error: 'Test error' })
      })

      act(() => {
        result.current.actions.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty pages object in import', () => {
      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      const jsonData = JSON.stringify({ pages: {} })

      act(() => {
        result.current.actions.importPagesFromJson(jsonData)
      })

      expect(result.current.state.pages).toHaveLength(0)
    })

    it('should handle malformed localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() => useSitemap(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.handleGeneratedSitemap(mockSitemapData)
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      // Should not throw error and should still save
      expect(result.current.state.pages).toHaveLength(1)
    })
  })
})