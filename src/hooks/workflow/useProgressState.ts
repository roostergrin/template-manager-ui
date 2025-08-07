import { useState, useCallback } from 'react'
import { ProgressState, ProgressStatus, ProgressSection } from '../../contexts/WorkflowProvider'

const initialProgressState: ProgressState = {
  infrastructure: {
    repoCreation: 'pending',
    awsProvisioning: 'pending',
  },
  planning: {
    questionnaire: 'pending',
    assetSync: 'pending',
    sitemapPlanning: 'pending',
    contentGeneration: 'pending',
  },
  deployment: {
    repositoryUpdate: 'pending',
    wordpressUpdate: 'pending',
  },
}

const progressSections: ProgressSection[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure Setup',
    icon: '🏗️',
    tasks: [
      {
        id: 'repoCreation',
        title: 'GitHub Repository',
        description: 'Create and configure GitHub repository',
      },
      {
        id: 'awsProvisioning',
        title: 'AWS Resources',
        description: 'Provision S3, CloudFront, and CodePipeline',
      },
    ],
  },
  {
    id: 'planning',
    title: 'Planning & Content Generation',
    icon: '📋',
    tasks: [
      {
        id: 'questionnaire',
        title: 'Site Questionnaire',
        description: 'Complete site configuration questionnaire',
      },
      {
        id: 'assetSync',
        title: 'Asset Synchronization',
        description: 'Sync scraped assets and content',
      },
      {
        id: 'sitemapPlanning',
        title: 'Sitemap Planning',
        description: 'Plan and structure site pages',
      },
      {
        id: 'contentGeneration',
        title: 'Content Generation',
        description: 'Generate AI-powered content',
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment & Updates',
    icon: '🚀',
    tasks: [
      {
        id: 'repositoryUpdate',
        title: 'Repository Update',
        description: 'Update GitHub repository',
      },
      {
        id: 'wordpressUpdate',
        title: 'WordPress Update',
        description: 'Deploy to WordPress site',
      },
    ],
  },
]

const getSectionStatusHelper = (progressState: ProgressState, section: keyof ProgressState): ProgressStatus => {
  const sectionTasks = Object.values(progressState[section])
  
  if (sectionTasks.every(status => status === 'completed')) {
    return 'completed'
  }
  
  if (sectionTasks.some(status => status === 'error')) {
    return 'error'
  }
  
  if (sectionTasks.some(status => status === 'in-progress')) {
    return 'in-progress'
  }
  
  if (sectionTasks.some(status => status === 'completed')) {
    return 'in-progress'
  }
  
  return 'pending'
}

const getOverallProgressHelper = (progressState: ProgressState): number => {
  const allTasks = [
    ...Object.values(progressState.infrastructure),
    ...Object.values(progressState.planning),
    ...Object.values(progressState.deployment),
  ]
  
  const completedTasks = allTasks.filter(status => status === 'completed').length
  return Math.round((completedTasks / allTasks.length) * 100)
}

const canNavigateToSectionHelper = (
  progressState: ProgressState,
  activeSection: keyof ProgressState,
  targetSection: keyof ProgressState
): boolean => {
  const sectionOrder: (keyof ProgressState)[] = ['infrastructure', 'planning', 'deployment']
  const currentIndex = sectionOrder.indexOf(activeSection)
  const targetIndex = sectionOrder.indexOf(targetSection)
  
  if (targetIndex <= currentIndex) {
    return true
  }
  
  for (let i = 0; i < targetIndex; i++) {
    const sectionStatus = getSectionStatusHelper(progressState, sectionOrder[i])
    if (sectionStatus !== 'completed') {
      return false
    }
  }
  
  return true
}

const getNextIncompleteTaskHelper = (progressState: ProgressState) => {
  for (const section of progressSections) {
    const sectionStatus = getSectionStatusHelper(progressState, section.id)
    if (sectionStatus !== 'completed') {
      for (const task of section.tasks) {
        const taskStatus = progressState[section.id][task.id as keyof typeof progressState[typeof section.id]]
        if (taskStatus !== 'completed') {
          return {
            section: section.id,
            task: task.id,
            sectionTitle: section.title,
            taskTitle: task.title,
          }
        }
      }
    }
  }
  return null
}

const useProgressState = (initialState?: ProgressState) => {
  // Load from localStorage on initialization if no initial state provided
  const getInitialProgressState = (): ProgressState => {
    if (initialState) return initialState
    
    try {
      const saved = localStorage.getItem('template-manager-progress')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...initialProgressState, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load progress state from localStorage:', error)
    }
    
    return initialProgressState
  }

  const [progressState, setProgressState] = useState<ProgressState>(getInitialProgressState)
  const [activeSection, setActiveSectionState] = useState<keyof ProgressState>('infrastructure')

  const updateTaskStatus = useCallback((
    section: keyof ProgressState,
    task: string,
    status: ProgressStatus
  ) => {
    setProgressState(prevState => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [task]: status,
      },
    }))
  }, [])

  const setActiveSection = useCallback((section: keyof ProgressState) => {
    setActiveSectionState(section)
  }, [])

  const getSectionStatus = (section: keyof ProgressState): ProgressStatus => {
    return getSectionStatusHelper(progressState, section)
  }

  const getOverallProgress = (): number => {
    return getOverallProgressHelper(progressState)
  }

  const canNavigateToSection = (targetSection: keyof ProgressState): boolean => {
    return canNavigateToSectionHelper(progressState, activeSection, targetSection)
  }

  const resetProgress = useCallback(() => {
    setProgressState(initialProgressState)
    setActiveSectionState('infrastructure')
  }, [])

  const getNextIncompleteTask = () => {
    return getNextIncompleteTaskHelper(progressState)
  }

  return {
    progressState,
    activeSection,
    updateTaskStatus,
    setActiveSection,
    getSectionStatus,
    getOverallProgress,
    canNavigateToSection,
    resetProgress,
    getNextIncompleteTask
  }
}

export default useProgressState