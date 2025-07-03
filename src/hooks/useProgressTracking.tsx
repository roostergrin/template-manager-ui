import { useState, useEffect, useCallback } from 'react';

export type ProgressStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface ProgressState {
  infrastructure: {
    repoCreation: ProgressStatus;
    awsProvisioning: ProgressStatus;
  };
  setup: {
    questionnaire: ProgressStatus;
    assetSync: ProgressStatus;
  };
  content: {
    sitemapPlanning: ProgressStatus;
    contentGeneration: ProgressStatus;
    deployment: ProgressStatus;
  };
}

export interface ProgressSection {
  id: keyof ProgressState;
  title: string;
  icon: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

const initialProgressState: ProgressState = {
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
};

const progressSections: ProgressSection[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure & Assets',
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
    id: 'setup',
    title: 'Setup & Configuration',
    icon: '📝',
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
    ],
  },
  {
    id: 'content',
    title: 'Content Planning & Generation',
    icon: '🗺️',
    tasks: [
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
];

const STORAGE_KEY = 'template-manager-progress';

const useProgressTracking = () => {
  const [progressState, setProgressState] = useState<ProgressState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialProgressState, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error);
    }
    return initialProgressState;
  });

  const [activeSection, setActiveSection] = useState<keyof ProgressState>('infrastructure');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error);
    }
  }, [progressState]);

  const updateTaskStatus = useCallback((
    section: keyof ProgressState,
    task: string,
    status: ProgressStatus
  ) => {
    setProgressState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [task]: status,
      },
    }));
  }, []);

  const getSectionStatus = useCallback((section: keyof ProgressState): ProgressStatus => {
    const sectionTasks = Object.values(progressState[section]);
    
    if (sectionTasks.every(status => status === 'completed')) {
      return 'completed';
    }
    
    if (sectionTasks.some(status => status === 'error')) {
      return 'error';
    }
    
    if (sectionTasks.some(status => status === 'in-progress')) {
      return 'in-progress';
    }
    
    if (sectionTasks.some(status => status === 'completed')) {
      return 'in-progress';
    }
    
    return 'pending';
  }, [progressState]);

  const getOverallProgress = useCallback((): number => {
    const allTasks = [
      ...Object.values(progressState.infrastructure),
      ...Object.values(progressState.setup),
      ...Object.values(progressState.content),
    ];
    
    const completedTasks = allTasks.filter(status => status === 'completed').length;
    return Math.round((completedTasks / allTasks.length) * 100);
  }, [progressState]);

  const canNavigateToSection = useCallback((targetSection: keyof ProgressState): boolean => {
    const sectionOrder: (keyof ProgressState)[] = ['infrastructure', 'setup', 'content'];
    const currentIndex = sectionOrder.indexOf(activeSection);
    const targetIndex = sectionOrder.indexOf(targetSection);
    
    if (targetIndex <= currentIndex) {
      return true;
    }
    
    for (let i = 0; i < targetIndex; i++) {
      const sectionStatus = getSectionStatus(sectionOrder[i]);
      if (sectionStatus !== 'completed') {
        return false;
      }
    }
    
    return true;
  }, [activeSection, getSectionStatus]);

  const resetProgress = useCallback(() => {
    setProgressState(initialProgressState);
    setActiveSection('infrastructure');
  }, []);

  const getNextIncompleteTask = useCallback(() => {
    for (const section of progressSections) {
      const sectionStatus = getSectionStatus(section.id);
      if (sectionStatus !== 'completed') {
        for (const task of section.tasks) {
          const taskStatus = progressState[section.id][task.id as keyof typeof progressState[typeof section.id]];
          if (taskStatus !== 'completed') {
            return {
              section: section.id,
              task: task.id,
              sectionTitle: section.title,
              taskTitle: task.title,
            };
          }
        }
      }
    }
    return null;
  }, [progressState, getSectionStatus]);

  return {
    progressState,
    progressSections,
    activeSection,
    setActiveSection,
    updateTaskStatus,
    getSectionStatus,
    getOverallProgress,
    canNavigateToSection,
    resetProgress,
    getNextIncompleteTask,
  };
};

export default useProgressTracking;