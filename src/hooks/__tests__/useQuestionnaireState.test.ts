import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useQuestionnaireState from '../useQuestionnaireState'
import { QuestionnaireMode, QuestionnaireDataSource } from '../../types/QuestionnaireStateTypes'

describe('useQuestionnaireState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQuestionnaireState())
    const [state] = result.current
    
    expect(state).toEqual({
      activeMode: 'scrape',
      dataSource: 'structured',
      data: {}
    })
  })

  it('should provide actions object', () => {
    const { result } = renderHook(() => useQuestionnaireState())
    const [, actions] = result.current
    
    expect(actions).toHaveProperty('setActiveMode')
    expect(actions).toHaveProperty('setDataSource')
    expect(actions).toHaveProperty('updateScrapeData')
    expect(actions).toHaveProperty('updateQuestionnaireData')
    expect(actions).toHaveProperty('updateTemplateMarkdown')
    expect(actions).toHaveProperty('updateContentDocument')
    expect(actions).toHaveProperty('resetData')
  })

  describe('setActiveMode', () => {
    it('should update active mode', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.setActiveMode('questionnaire')
      })
      
      const [state] = result.current
      expect(state.activeMode).toBe('questionnaire')
      expect(state.dataSource).toBe('structured') // should remain structured for questionnaire mode
    })

    it('should automatically switch to markdown data source for template-markdown mode', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.setActiveMode('template-markdown')
      })
      
      const [state] = result.current
      expect(state.activeMode).toBe('template-markdown')
      expect(state.dataSource).toBe('markdown')
    })

    it('should automatically switch to markdown data source for content-document mode', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.setActiveMode('content-document')
      })
      
      const [state] = result.current
      expect(state.activeMode).toBe('content-document')
      expect(state.dataSource).toBe('markdown')
    })

    it('should maintain structured data source for other modes', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      const modesWithStructured: QuestionnaireMode[] = ['scrape', 'questionnaire']
      
      modesWithStructured.forEach(mode => {
        act(() => {
          const [, actions] = result.current
          actions.setActiveMode(mode)
        })
        
        const [state] = result.current
        expect(state.dataSource).toBe('structured')
      })
    })
  })

  describe('setDataSource', () => {
    it('should update data source', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.setDataSource('markdown')
      })
      
      const [state] = result.current
      expect(state.dataSource).toBe('markdown')
    })

    it('should allow switching back to structured', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      // First switch to markdown
      act(() => {
        const [, actions] = result.current
        actions.setDataSource('markdown')
      })
      
      // Then back to structured
      act(() => {
        const [, actions] = result.current
        actions.setDataSource('structured')
      })
      
      const [state] = result.current
      expect(state.dataSource).toBe('structured')
    })
  })

  describe('updateScrapeData', () => {
    it('should update scrape data with domain only', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com')
      })
      
      const [state] = result.current
      expect(state.data.scrape).toEqual({
        domain: 'example.com',
        scraped_data: undefined
      })
    })

    it('should update scrape data with domain and scraped data', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      const scrapedData = { title: 'Example Site', description: 'A test site' }
      
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com', scrapedData)
      })
      
      const [state] = result.current
      expect(state.data.scrape).toEqual({
        domain: 'example.com',
        scraped_data: scrapedData
      })
    })

    it('should preserve other data when updating scrape data', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      // First add questionnaire data
      act(() => {
        const [, actions] = result.current
        actions.updateQuestionnaireData({ businessName: 'Test Business' })
      })
      
      // Then add scrape data
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com')
      })
      
      const [state] = result.current
      expect(state.data).toEqual({
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
      const { result } = renderHook(() => useQuestionnaireState())
      const questionnaireData = { 
        businessName: 'Acme Corp',
        industry: 'Technology',
        target_audience: 'Developers'
      }
      
      act(() => {
        const [, actions] = result.current
        actions.updateQuestionnaireData(questionnaireData)
      })
      
      const [state] = result.current
      expect(state.data.questionnaire).toEqual(questionnaireData)
    })

    it('should preserve other data when updating questionnaire data', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      // First add scrape data
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com')
      })
      
      // Then add questionnaire data
      act(() => {
        const [, actions] = result.current
        actions.updateQuestionnaireData({ businessName: 'Test Business' })
      })
      
      const [state] = result.current
      expect(state.data).toEqual({
        scrape: {
          domain: 'example.com',
          scraped_data: undefined
        },
        questionnaire: { businessName: 'Test Business' }
      })
    })
  })

  describe('updateTemplateMarkdown', () => {
    it('should update template markdown', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      const markdown = '# My Template\n\nThis is a test template.'
      
      act(() => {
        const [, actions] = result.current
        actions.updateTemplateMarkdown(markdown)
      })
      
      const [state] = result.current
      expect(state.data.templateMarkdown).toBe(markdown)
    })
  })

  describe('updateContentDocument', () => {
    it('should update content document', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      const content = 'This is my content document with detailed information.'
      
      act(() => {
        const [, actions] = result.current
        actions.updateContentDocument(content)
      })
      
      const [state] = result.current
      expect(state.data.contentDocument).toBe(content)
    })
  })

  describe('resetData', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      // Modify state
      act(() => {
        const [, actions] = result.current
        actions.setActiveMode('questionnaire')
        actions.setDataSource('markdown')
        actions.updateScrapeData('example.com')
        actions.updateQuestionnaireData({ businessName: 'Test' })
        actions.updateTemplateMarkdown('# Test')
        actions.updateContentDocument('Test content')
      })
      
      // Verify state is modified
      let [state] = result.current
      expect(state.activeMode).toBe('questionnaire')
      expect(state.dataSource).toBe('markdown')
      expect(Object.keys(state.data)).toHaveLength(4)
      
      // Reset
      act(() => {
        const [, actions] = result.current
        actions.resetData()
      })
      
      // Verify reset
      const [resetState] = result.current
      expect(resetState).toEqual({
        activeMode: 'scrape',
        dataSource: 'structured',
        data: {}
      })
    })
  })

  describe('complex state interactions', () => {
    it('should handle multiple data types simultaneously', () => {
      const { result } = renderHook(() => useQuestionnaireState())
      
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com', { title: 'Example' })
        actions.updateQuestionnaireData({ name: 'Business' })
        actions.updateTemplateMarkdown('# Template')
        actions.updateContentDocument('Content')
      })
      
      const [state] = result.current
      expect(state.data).toEqual({
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
      const { result } = renderHook(() => useQuestionnaireState())
      
      // Add data in scrape mode
      act(() => {
        const [, actions] = result.current
        actions.updateScrapeData('example.com')
      })
      
      // Switch to template-markdown mode
      act(() => {
        const [, actions] = result.current
        actions.setActiveMode('template-markdown')
      })
      
      const [state] = result.current
      expect(state.activeMode).toBe('template-markdown')
      expect(state.dataSource).toBe('markdown')
      expect(state.data.scrape).toBeDefined() // existing data should be preserved
    })
  })
})