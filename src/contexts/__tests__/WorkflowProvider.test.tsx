import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { vi } from 'vitest'
import { WorkflowProvider, useWorkflow, ProgressStatus, GeneratedContent } from '../WorkflowProvider'

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

const createWrapper = (initialState?: any) => {
  return ({ children }: { children: ReactNode }) => (
    <WorkflowProvider initialState={initialState}>
      {children}
    </WorkflowProvider>
  )
}

const mockGeneratedContent: GeneratedContent = {
  id: 'test-1',
  type: 'sitemap',
  title: 'Test Sitemap',
  content: { pages: [] },
  created: '2023-01-01T00:00:00.000Z',
  metadata: { source: 'test' }
}

describe('WorkflowProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Access', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useWorkflow())
      }).toThrow('useWorkflow must be used within a WorkflowProvider')
    })

    it('should provide context value when used within provider', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toBeDefined()
      expect(result.current.actions).toBeDefined()
      expect(result.current.progressSections).toBeDefined()
    })
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toMatchObject({
        progressState: {
          infrastructure: {
            repoCreation: 'pending',
            awsProvisioning: 'pending',
          },
          setup: {
            questionnaire: 'pending',
            assetSync: 'pending',
          },
          content: {
            sitemapPlanning: 'pending',
            contentGeneration: 'pending',
            repositoryUpdate: 'pending',
            wordpressUpdate: 'pending',
          },
        },
        activeSection: 'infrastructure',
        generatedContent: [],
        isProcessing: false,
        error: null,
        lastSaved: null
      })
    })

    it('should accept custom initial state', () => {
      const customState = {
        activeSection: 'content' as const,
        isProcessing: true,
        generatedContent: [mockGeneratedContent]
      }

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper(customState)
      })

      expect(result.current.state.activeSection).toBe('content')
      expect(result.current.state.isProcessing).toBe(true)
      expect(result.current.state.generatedContent).toEqual([mockGeneratedContent])
    })

    it('should provide progress sections', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(result.current.progressSections).toHaveLength(3)
      expect(result.current.progressSections[0]).toMatchObject({
        id: 'infrastructure',
        title: 'Infrastructure & Assets',
        icon: '🏗️'
      })
    })
  })

  describe('Progress Management', () => {
    it('should update task status', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      expect(result.current.state.progressState.infrastructure.repoCreation).toBe('completed')
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should set active section', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setActiveSection('content')
      })

      expect(result.current.state.activeSection).toBe('content')
    })

    it('should get section status - pending', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      const status = result.current.actions.getSectionStatus('infrastructure')
      expect(status).toBe('pending')
    })

    it('should get section status - in-progress', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      const status = result.current.actions.getSectionStatus('infrastructure')
      expect(status).toBe('in-progress')
    })

    it('should get section status - completed', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.actions.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })

      const status = result.current.actions.getSectionStatus('infrastructure')
      expect(status).toBe('completed')
    })

    it('should get section status - error', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'error')
      })

      const status = result.current.actions.getSectionStatus('infrastructure')
      expect(status).toBe('error')
    })

    it('should calculate overall progress', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      // Complete 2 out of 8 tasks (25%)
      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.actions.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })

      const progress = result.current.actions.getOverallProgress()
      expect(progress).toBe(25)
    })

    it('should determine navigation capability', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      // Should allow navigation to current or previous sections
      expect(result.current.actions.canNavigateToSection('infrastructure')).toBe(true)
      
      // Should not allow navigation to future sections without completing previous
      expect(result.current.actions.canNavigateToSection('content')).toBe(false)

      // Complete infrastructure section
      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.actions.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })

      // Should now allow navigation to setup
      expect(result.current.actions.canNavigateToSection('setup')).toBe(true)
    })

    it('should reset progress', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({
          activeSection: 'content',
          generatedContent: [mockGeneratedContent]
        })
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      act(() => {
        result.current.actions.resetProgress()
      })

      expect(result.current.state.activeSection).toBe('infrastructure')
      expect(result.current.state.generatedContent).toEqual([])
      expect(result.current.state.progressState.infrastructure.repoCreation).toBe('pending')
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should get next incomplete task', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      const nextTask = result.current.actions.getNextIncompleteTask()
      expect(nextTask).toMatchObject({
        section: 'infrastructure',
        task: 'repoCreation',
        sectionTitle: 'Infrastructure & Assets',
        taskTitle: 'GitHub Repository'
      })

      // Complete first task
      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      const nextTask2 = result.current.actions.getNextIncompleteTask()
      expect(nextTask2).toMatchObject({
        section: 'infrastructure',
        task: 'awsProvisioning'
      })
    })

    it('should return null when all tasks are complete', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      // Complete all tasks
      const sections = ['infrastructure', 'setup', 'content'] as const
      const tasks = {
        infrastructure: ['repoCreation', 'awsProvisioning'],
        setup: ['questionnaire', 'assetSync'],
        content: ['sitemapPlanning', 'contentGeneration', 'repositoryUpdate', 'wordpressUpdate']
      }

      act(() => {
        sections.forEach(section => {
          tasks[section].forEach(task => {
            result.current.actions.updateTaskStatus(section, task, 'completed')
          })
        })
      })

      const nextTask = result.current.actions.getNextIncompleteTask()
      expect(nextTask).toBeNull()
    })
  })

  describe('Generated Content Management', () => {
    it('should add generated content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      const contentToAdd = {
        type: 'sitemap' as const,
        title: 'New Sitemap',
        content: { pages: ['home'] },
        metadata: { source: 'test' }
      }

      let contentId: string

      act(() => {
        contentId = result.current.actions.addGeneratedContent(contentToAdd)
      })

      expect(result.current.state.generatedContent).toHaveLength(1)
      expect(result.current.state.generatedContent[0]).toMatchObject({
        ...contentToAdd,
        id: contentId!
      })
      expect(result.current.state.generatedContent[0].created).toBeDefined()
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should update generated content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ generatedContent: [mockGeneratedContent] })
      })

      const updates = {
        title: 'Updated Sitemap',
        content: { pages: ['home', 'about'] }
      }

      act(() => {
        result.current.actions.updateGeneratedContent('test-1', updates)
      })

      expect(result.current.state.generatedContent[0]).toMatchObject({
        ...mockGeneratedContent,
        ...updates
      })
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should remove generated content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ generatedContent: [mockGeneratedContent] })
      })

      act(() => {
        result.current.actions.removeGeneratedContent('test-1')
      })

      expect(result.current.state.generatedContent).toHaveLength(0)
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should get content by type', () => {
      const mockPageContent: GeneratedContent = {
        id: 'test-2',
        type: 'page-content',
        title: 'Test Page',
        content: 'Page content',
        created: '2023-01-01T00:00:00.000Z'
      }

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ 
          generatedContent: [mockGeneratedContent, mockPageContent] 
        })
      })

      const sitemapContent = result.current.actions.getContentByType('sitemap')
      expect(sitemapContent).toHaveLength(1)
      expect(sitemapContent[0]).toEqual(mockGeneratedContent)

      const pageContent = result.current.actions.getContentByType('page-content')
      expect(pageContent).toHaveLength(1)
      expect(pageContent[0]).toEqual(mockPageContent)
    })

    it('should clear all generated content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ generatedContent: [mockGeneratedContent] })
      })

      act(() => {
        result.current.actions.clearGeneratedContent()
      })

      expect(result.current.state.generatedContent).toHaveLength(0)
      expect(result.current.state.lastSaved).toBeDefined()
    })
  })

  describe('Processing State Management', () => {
    it('should set processing state', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setProcessing(true)
      })

      expect(result.current.state.isProcessing).toBe(true)
    })

    it('should set error and clear processing', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ isProcessing: true })
      })

      act(() => {
        result.current.actions.setError('Test error')
      })

      expect(result.current.state.error).toBe('Test error')
      expect(result.current.state.isProcessing).toBe(false)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ error: 'Test error' })
      })

      act(() => {
        result.current.actions.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })
  })

  describe('LocalStorage Integration', () => {
    it('should attempt to load from localStorage on mount', () => {
      const savedProgress = {
        infrastructure: { repoCreation: 'completed', awsProvisioning: 'in-progress' },
        setup: { questionnaire: 'pending', assetSync: 'pending' },
        content: {
          sitemapPlanning: 'pending',
          contentGeneration: 'pending',
          repositoryUpdate: 'pending',
          wordpressUpdate: 'pending'
        }
      }
      const savedContent = [mockGeneratedContent]

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'template-manager-progress') return JSON.stringify(savedProgress)
        if (key === 'template-manager-generated-content') return JSON.stringify(savedContent)
        return null
      })

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('template-manager-progress')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('template-manager-generated-content')
      
      // Note: The actual loading happens in useEffect, so we need to wait for it
      setTimeout(() => {
        expect(result.current.state.progressState.infrastructure.repoCreation).toBe('completed')
        expect(result.current.state.generatedContent).toEqual(savedContent)
      }, 0)
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load workflow data from localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should save to localStorage on state changes', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'template-manager-progress',
        expect.stringContaining('completed')
      )
    })

    it('should handle localStorage save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage save error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save workflow data to localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      renderHook(() => useWorkflow(), {
        wrapper: createWrapper()
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not update non-existent content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ generatedContent: [mockGeneratedContent] })
      })

      act(() => {
        result.current.actions.updateGeneratedContent('non-existent', { title: 'Updated' })
      })

      expect(result.current.state.generatedContent[0]).toEqual(mockGeneratedContent)
    })

    it('should handle removing non-existent content', () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: createWrapper({ generatedContent: [mockGeneratedContent] })
      })

      act(() => {
        result.current.actions.removeGeneratedContent('non-existent')
      })

      expect(result.current.state.generatedContent).toEqual([mockGeneratedContent])
    })
  })
})