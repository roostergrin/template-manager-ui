import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePages from '../usePages'
import { SitemapItem } from '../../types/SitemapTypes'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  value: vi.fn(),
})

describe('usePages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty pages array', () => {
    const { result } = renderHook(() => usePages())
    expect(result.current.pages).toEqual([])
  })

  it('should add a new page', () => {
    const { result } = renderHook(() => usePages())
    
    act(() => {
      result.current.addPage()
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0]).toMatchObject({
      title: 'New Page',
      items: [],
      wordpress_id: ''
    })
    expect(result.current.pages[0].id).toBeDefined()
  })

  it('should remove a page by id', () => {
    // Mock Date.now to return different values
    let mockId = 1000
    const mockDateNow = vi.spyOn(Date, 'now').mockImplementation(() => mockId++)
    
    const { result } = renderHook(() => usePages())
    
    // Add two pages in separate acts
    act(() => {
      result.current.addPage()
    })
    act(() => {
      result.current.addPage()
    })

    expect(result.current.pages).toHaveLength(2)
    const firstPageId = result.current.pages[0].id
    const secondPageId = result.current.pages[1].id
    
    // Remove first page
    act(() => {
      result.current.removePage(firstPageId)
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0].id).toBe(secondPageId)
    
    mockDateNow.mockRestore()
  })

  it('should update page title', () => {
    const { result } = renderHook(() => usePages())
    
    act(() => {
      result.current.addPage()
    })

    const pageId = result.current.pages[0].id
    const newTitle = 'Updated Title'
    
    act(() => {
      result.current.updatePageTitle(pageId, newTitle)
    })

    expect(result.current.pages[0].title).toBe(newTitle)
  })

  it('should update page WordPress ID', () => {
    const { result } = renderHook(() => usePages())
    
    act(() => {
      result.current.addPage()
    })

    const pageId = result.current.pages[0].id
    const newWordpressId = 'wp-123'
    
    act(() => {
      result.current.updatePageWordpressId(pageId, newWordpressId)
    })

    expect(result.current.pages[0].wordpress_id).toBe(newWordpressId)
  })

  it('should update page items', () => {
    const { result } = renderHook(() => usePages())
    
    act(() => {
      result.current.addPage()
    })

    const pageId = result.current.pages[0].id
    const newItems: SitemapItem[] = [
      { id: '1', model: 'test-model', query: 'test query' }
    ]
    
    act(() => {
      result.current.updatePageItems(pageId, newItems)
    })

    expect(result.current.pages[0].items).toEqual(newItems)
  })

  it('should import pages from JSON', () => {
    const { result } = renderHook(() => usePages())
    
    const jsonData = JSON.stringify({
      pages: {
        'Home': {
          internal_id: 'home-123',
          page_id: 'wp-456',
          model_query_pairs: [
            { internal_id: 'item-1', model: 'gpt-4', query: 'home content' }
          ]
        }
      }
    })
    
    act(() => {
      result.current.importPagesFromJson(jsonData)
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0]).toMatchObject({
      id: 'home-123',
      title: 'Home',
      wordpress_id: 'wp-456',
      items: [
        { id: 'item-1', model: 'gpt-4', query: 'home content' }
      ]
    })
  })

  it('should handle invalid JSON import gracefully', () => {
    const { result } = renderHook(() => usePages())
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    act(() => {
      result.current.importPagesFromJson('invalid json')
    })

    expect(result.current.pages).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Error importing JSON:', expect.any(SyntaxError))
    
    consoleSpy.mockRestore()
  })

  it('should handle generated sitemap and save to localStorage', () => {
    const { result } = renderHook(() => usePages())
    const mockPrompt = vi.mocked(window.prompt)
    const mockDate = new Date('2023-01-01T00:00:00.000Z')
    vi.setSystemTime(mockDate)
    
    mockPrompt.mockReturnValue('Test Sitemap')
    
    const sitemapData = {
      pages: {
        'About': {
          internal_id: 'about-123',
          page_id: 'wp-789',
          model_query_pairs: [
            { internal_id: 'item-2', model: 'gpt-3.5', query: 'about content' }
          ]
        }
      }
    }
    
    act(() => {
      result.current.handleGeneratedSitemap(sitemapData)
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0].title).toBe('About')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'generatedSitemaps',
      expect.stringContaining('Test Sitemap')
    )
  })

  it('should select stored sitemap', () => {
    const { result } = renderHook(() => usePages())
    
    const storedSitemap = {
      name: 'Stored Sitemap',
      created: '2023-01-01T00:00:00.000Z',
      sitemap: {
        pages: {
          'Contact': {
            internal_id: 'contact-123',
            page_id: 'wp-999',
            model_query_pairs: [
              { internal_id: 'item-3', model: 'claude', query: 'contact info' }
            ]
          }
        }
      }
    }
    
    act(() => {
      result.current.handleSelectStoredSitemap(storedSitemap)
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0].title).toBe('Contact')
  })

  it('should handle empty or invalid sitemap data', () => {
    const { result } = renderHook(() => usePages())
    
    // Test with null
    act(() => {
      result.current.handleGeneratedSitemap(null)
    })
    expect(result.current.pages).toEqual([])
    
    // Test with object without pages
    act(() => {
      result.current.handleGeneratedSitemap({ data: 'test' })
    })
    expect(result.current.pages).toEqual([])
  })

  it('should map imported pages correctly with missing fields', () => {
    const { result } = renderHook(() => usePages())
    
    const jsonData = JSON.stringify({
      pages: {
        'Incomplete Page': {
          internal_id: 'incomplete-123',
          // missing page_id
          model_query_pairs: []
        }
      }
    })
    
    act(() => {
      result.current.importPagesFromJson(jsonData)
    })

    expect(result.current.pages).toHaveLength(1)
    expect(result.current.pages[0]).toMatchObject({
      id: 'incomplete-123',
      title: 'Incomplete Page',
      wordpress_id: '', // should default to empty string
      items: []
    })
  })
})