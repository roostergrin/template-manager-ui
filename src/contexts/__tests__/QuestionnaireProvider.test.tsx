import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { QuestionnaireProvider, useQuestionnaire } from '../QuestionnaireProvider'

// Test wrapper
const createWrapper = (initialState?: any) => {
  return ({ children }: { children: ReactNode }) => (
    <QuestionnaireProvider initialState={initialState}>
      {children}
    </QuestionnaireProvider>
  )
}

describe('QuestionnaireProvider', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      expect(result.current.state).toEqual({
        activeMode: 'scrape',
        dataSource: 'structured',
        data: {},
        isLoading: false,
        error: null
      })
    })

    it('should initialize with provided initial state', () => {
      const initialState = {
        activeMode: 'questionnaire' as const,
        dataSource: 'markdown' as const,
        data: { test: 'data' },
        isLoading: true,
        error: 'test error'
      }
      
      const wrapper = createWrapper(initialState)
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      expect(result.current.state).toEqual(initialState)
    })

    it('should provide all required actions', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      expect(result.current.actions).toHaveProperty('setActiveMode')
      expect(result.current.actions).toHaveProperty('setDataSource')
      expect(result.current.actions).toHaveProperty('updateScrapeData')
      expect(result.current.actions).toHaveProperty('updateQuestionnaireData')
      expect(result.current.actions).toHaveProperty('updateTemplateMarkdown')
      expect(result.current.actions).toHaveProperty('updateContentDocument')
      expect(result.current.actions).toHaveProperty('resetData')
      expect(result.current.actions).toHaveProperty('setLoading')
      expect(result.current.actions).toHaveProperty('setError')
      expect(result.current.actions).toHaveProperty('clearError')
    })
  })

  describe('setActiveMode', () => {
    it('should update active mode', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setActiveMode('questionnaire')
      })
      
      expect(result.current.state.activeMode).toBe('questionnaire')
      expect(result.current.state.dataSource).toBe('structured')
    })

    it('should automatically switch to markdown data source for template-markdown mode', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setActiveMode('template-markdown')
      })
      
      expect(result.current.state.activeMode).toBe('template-markdown')
      expect(result.current.state.dataSource).toBe('markdown')
    })

    it('should automatically switch to markdown data source for content-document mode', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setActiveMode('content-document')
      })
      
      expect(result.current.state.activeMode).toBe('content-document')
      expect(result.current.state.dataSource).toBe('markdown')
    })
  })

  describe('setDataSource', () => {
    it('should update data source', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setDataSource('markdown')
      })
      
      expect(result.current.state.dataSource).toBe('markdown')
    })
  })

  describe('updateScrapeData', () => {
    it('should update scrape data with domain only', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.updateScrapeData('example.com')
      })
      
      expect(result.current.state.data.scrape).toEqual({
        domain: 'example.com',
        scraped_data: undefined
      })
    })

    it('should update scrape data with domain and scraped data', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      const scrapedData = { title: 'Example Site', description: 'A test site' }
      
      act(() => {
        result.current.actions.updateScrapeData('example.com', scrapedData)
      })
      
      expect(result.current.state.data.scrape).toEqual({
        domain: 'example.com',
        scraped_data: scrapedData
      })
    })

    it('should preserve other data when updating scrape data', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.updateQuestionnaireData({ businessName: 'Test Business' })
        result.current.actions.updateScrapeData('example.com')
      })
      
      expect(result.current.state.data).toEqual({
        questionnaire: { businessName: 'Test Business' },
        scrape: {
          domain: 'example.com',
          scraped_data: undefined
        }
      })
    })
  })

  describe('updateQuestionnaireData', () => {
    it('should update questionnaire data', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      const questionnaireData = { 
        businessName: 'Acme Corp',
        industry: 'Technology'
      }
      
      act(() => {
        result.current.actions.updateQuestionnaireData(questionnaireData)
      })
      
      expect(result.current.state.data.questionnaire).toEqual(questionnaireData)
    })
  })

  describe('updateTemplateMarkdown', () => {
    it('should update template markdown', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      const markdown = '# My Template\n\nThis is a test template.'
      
      act(() => {
        result.current.actions.updateTemplateMarkdown(markdown)
      })
      
      expect(result.current.state.data.templateMarkdown).toBe(markdown)
    })
  })

  describe('updateContentDocument', () => {
    it('should update content document', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      const content = 'This is my content document.'
      
      act(() => {
        result.current.actions.updateContentDocument(content)
      })
      
      expect(result.current.state.data.contentDocument).toBe(content)
    })
  })

  describe('resetData', () => {
    it('should reset state to initial values', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      // Modify state
      act(() => {
        result.current.actions.setActiveMode('questionnaire')
        result.current.actions.setDataSource('markdown')
        result.current.actions.updateScrapeData('example.com')
        result.current.actions.setLoading(true)
        result.current.actions.setError('test error')
      })
      
      // Verify state is modified (note: setError clears loading, so check error first)
      expect(result.current.state.activeMode).toBe('questionnaire')
      expect(result.current.state.error).toBe('test error')
      expect(result.current.state.isLoading).toBe(false) // setError clears loading
      
      // Reset
      act(() => {
        result.current.actions.resetData()
      })
      
      // Verify reset
      expect(result.current.state).toEqual({
        activeMode: 'scrape',
        dataSource: 'structured',
        data: {},
        isLoading: false,
        error: null
      })
    })
  })

  describe('loading and error management', () => {
    it('should set loading state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setLoading(true)
      })
      
      expect(result.current.state.isLoading).toBe(true)
    })

    it('should set error and clear loading', () => {
      const wrapper = createWrapper({ isLoading: true })
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.setError('Test error')
      })
      
      expect(result.current.state.error).toBe('Test error')
      expect(result.current.state.isLoading).toBe(false)
    })

    it('should clear error', () => {
      const wrapper = createWrapper({ error: 'Test error' })
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.clearError()
      })
      
      expect(result.current.state.error).toBeNull()
    })
  })

  describe('complex state interactions', () => {
    it('should handle multiple data types simultaneously', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      act(() => {
        result.current.actions.updateScrapeData('example.com', { title: 'Example' })
        result.current.actions.updateQuestionnaireData({ name: 'Business' })
        result.current.actions.updateTemplateMarkdown('# Template')
        result.current.actions.updateContentDocument('Content')
      })
      
      expect(result.current.state.data).toEqual({
        scrape: {
          domain: 'example.com',
          scraped_data: { title: 'Example' }
        },
        questionnaire: { name: 'Business' },
        templateMarkdown: '# Template',
        contentDocument: 'Content'
      })
    })

    it('should handle mode switching with existing data', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useQuestionnaire(), { wrapper })
      
      // Add data in scrape mode
      act(() => {
        result.current.actions.updateScrapeData('example.com')
      })
      
      // Switch to template-markdown mode
      act(() => {
        result.current.actions.setActiveMode('template-markdown')
      })
      
      expect(result.current.state.activeMode).toBe('template-markdown')
      expect(result.current.state.dataSource).toBe('markdown')
      expect(result.current.state.data.scrape).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useQuestionnaire())
      }).toThrow('useQuestionnaire must be used within a QuestionnaireProvider')
    })
  })
})