import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useProgressTracking, { ProgressStatus } from '../useProgressTracking'

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

describe('useProgressTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with default progress state', () => {
    const { result } = renderHook(() => useProgressTracking())
    
    expect(result.current.progressState).toEqual({
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
    })
    expect(result.current.activeSection).toBe('infrastructure')
  })

  it('should load saved progress from localStorage', () => {
    const savedProgress = {
      infrastructure: {
        repoCreation: 'completed',
        awsProvisioning: 'in-progress',
      }
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedProgress))
    
    const { result } = renderHook(() => useProgressTracking())
    
    expect(result.current.progressState.infrastructure.repoCreation).toBe('completed')
    expect(result.current.progressState.infrastructure.awsProvisioning).toBe('in-progress')
    // Other sections should remain at defaults
    expect(result.current.progressState.setup.questionnaire).toBe('pending')
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('LocalStorage error')
    })
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useProgressTracking())
    
    expect(result.current.progressState.infrastructure.repoCreation).toBe('pending')
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load progress from localStorage:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('should update task status', () => {
    const { result } = renderHook(() => useProgressTracking())
    
    act(() => {
      result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
    })
    
    expect(result.current.progressState.infrastructure.repoCreation).toBe('completed')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'template-manager-progress',
      expect.stringContaining('completed')
    )
  })

  it('should save to localStorage when progress changes', () => {
    const { result } = renderHook(() => useProgressTracking())
    
    act(() => {
      result.current.updateTaskStatus('setup', 'questionnaire', 'in-progress')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'template-manager-progress',
      expect.any(String)
    )
  })

  it('should handle localStorage save errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('LocalStorage save error')
    })
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useProgressTracking())
    
    act(() => {
      result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save progress to localStorage:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  describe('getSectionStatus', () => {
    it('should return completed when all tasks are completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })
      
      expect(result.current.getSectionStatus('infrastructure')).toBe('completed')
    })

    it('should return error when any task has error status', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'error')
      })
      
      expect(result.current.getSectionStatus('infrastructure')).toBe('error')
    })

    it('should return in-progress when any task is in-progress', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'in-progress')
      })
      
      expect(result.current.getSectionStatus('infrastructure')).toBe('in-progress')
    })

    it('should return in-progress when some tasks are completed but not all', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        // awsProvisioning remains 'pending'
      })
      
      expect(result.current.getSectionStatus('infrastructure')).toBe('in-progress')
    })

    it('should return pending when all tasks are pending', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      expect(result.current.getSectionStatus('infrastructure')).toBe('pending')
    })
  })

  describe('getOverallProgress', () => {
    it('should calculate correct percentage for no completed tasks', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      expect(result.current.getOverallProgress()).toBe(0)
    })

    it('should calculate correct percentage for some completed tasks', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Complete 2 out of 8 total tasks
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })
      
      expect(result.current.getOverallProgress()).toBe(25) // 2 out of 8 = 25%
    })

    it('should return 100% when all tasks are completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Complete all tasks
      act(() => {
        // Infrastructure
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
        // Setup
        result.current.updateTaskStatus('setup', 'questionnaire', 'completed')
        result.current.updateTaskStatus('setup', 'assetSync', 'completed')
        // Content
        result.current.updateTaskStatus('content', 'sitemapPlanning', 'completed')
        result.current.updateTaskStatus('content', 'contentGeneration', 'completed')
        result.current.updateTaskStatus('content', 'repositoryUpdate', 'completed')
        result.current.updateTaskStatus('content', 'wordpressUpdate', 'completed')
      })
      
      expect(result.current.getOverallProgress()).toBe(100)
    })
  })

  describe('canNavigateToSection', () => {
    it('should allow navigation to current and previous sections', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.setActiveSection('content')
      })
      
      expect(result.current.canNavigateToSection('infrastructure')).toBe(true)
      expect(result.current.canNavigateToSection('setup')).toBe(true)
      expect(result.current.canNavigateToSection('content')).toBe(true)
    })

    it('should allow navigation to next section if previous are completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Complete infrastructure section
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })
      
      expect(result.current.canNavigateToSection('setup')).toBe(true)
    })

    it('should not allow navigation to future sections if previous are not completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Infrastructure not completed, should not access content
      expect(result.current.canNavigateToSection('content')).toBe(false)
    })

    it('should handle navigation with partially completed sections', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Complete infrastructure, partially complete setup
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
        result.current.updateTaskStatus('setup', 'questionnaire', 'completed')
        // assetSync still pending
      })
      
      expect(result.current.canNavigateToSection('setup')).toBe(true)
      expect(result.current.canNavigateToSection('content')).toBe(false)
    })
  })

  describe('resetProgress', () => {
    it('should reset all progress to initial state', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Modify some state
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.setActiveSection('setup')
      })
      
      // Reset
      act(() => {
        result.current.resetProgress()
      })
      
      expect(result.current.progressState.infrastructure.repoCreation).toBe('pending')
      expect(result.current.activeSection).toBe('infrastructure')
    })
  })

  describe('getNextIncompleteTask', () => {
    it('should return first incomplete task from first section', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      const nextTask = result.current.getNextIncompleteTask()
      
      expect(nextTask).toEqual({
        section: 'infrastructure',
        task: 'repoCreation',
        sectionTitle: 'Infrastructure & Assets',
        taskTitle: 'GitHub Repository'
      })
    })

    it('should return next incomplete task after some are completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
      })
      
      const nextTask = result.current.getNextIncompleteTask()
      
      expect(nextTask).toEqual({
        section: 'infrastructure',
        task: 'awsProvisioning',
        sectionTitle: 'Infrastructure & Assets',
        taskTitle: 'AWS Resources'
      })
    })

    it('should return task from next section when current section is completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.updateTaskStatus('infrastructure', 'repoCreation', 'completed')
        result.current.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed')
      })
      
      const nextTask = result.current.getNextIncompleteTask()
      
      expect(nextTask).toEqual({
        section: 'setup',
        task: 'questionnaire',
        sectionTitle: 'Setup & Configuration',
        taskTitle: 'Site Questionnaire'
      })
    })

    it('should return null when all tasks are completed', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      // Complete all tasks
      act(() => {
        const sections = ['infrastructure', 'setup', 'content'] as const
        const tasks = {
          infrastructure: ['repoCreation', 'awsProvisioning'],
          setup: ['questionnaire', 'assetSync'],
          content: ['sitemapPlanning', 'contentGeneration', 'repositoryUpdate', 'wordpressUpdate']
        }
        
        sections.forEach(section => {
          tasks[section].forEach(task => {
            result.current.updateTaskStatus(section, task, 'completed')
          })
        })
      })
      
      const nextTask = result.current.getNextIncompleteTask()
      expect(nextTask).toBeNull()
    })
  })

  describe('setActiveSection', () => {
    it('should update active section', () => {
      const { result } = renderHook(() => useProgressTracking())
      
      act(() => {
        result.current.setActiveSection('setup')
      })
      
      expect(result.current.activeSection).toBe('setup')
    })
  })

  it('should provide progressSections array', () => {
    const { result } = renderHook(() => useProgressTracking())
    
    expect(result.current.progressSections).toHaveLength(3)
    expect(result.current.progressSections[0]).toMatchObject({
      id: 'infrastructure',
      title: 'Infrastructure & Assets',
      icon: '🏗️'
    })
  })
})