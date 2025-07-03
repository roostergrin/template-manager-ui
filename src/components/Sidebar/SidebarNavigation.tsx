import React, { useEffect, useState } from 'react';
import useProgressTracking, { ProgressStatus } from '../../hooks/useProgressTracking';
import ProgressIndicator from '../Common/ProgressIndicator';

interface SidebarNavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    progressSections,
    activeSection,
    setActiveSection,
    getSectionStatus,
    getOverallProgress,
    canNavigateToSection,
    progressState,
  } = useProgressTracking();

  const [scrollActiveSection, setScrollActiveSection] = useState<typeof activeSection>('infrastructure');
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const handleSectionClick = (sectionId: typeof activeSection) => {
    // Allow navigation to any section regardless of completion status
    setActiveSection(sectionId);
    // Clear active task when clicking section header
    setActiveTask(null);
    
    // Small delay to ensure state is updated before scrolling
    setTimeout(() => {
      const sectionElement = document.getElementById(`section-${sectionId}`);
      const mainContainer = document.querySelector('.workflow-manager__main') as HTMLElement;
      
      if (sectionElement && mainContainer) {
        // Calculate the position relative to the main container
        const containerRect = mainContainer.getBoundingClientRect();
        const sectionRect = sectionElement.getBoundingClientRect();
        const currentScroll = mainContainer.scrollTop;
        const targetScroll = currentScroll + sectionRect.top - containerRect.top - 20; // 20px offset from top
        
        // Smooth scroll the main container
        mainContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else if (sectionElement) {
        // Fallback to window scroll if main container not found
        sectionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 50);
  };

  // Track which section is currently visible in the viewport
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events to reduce jank
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mainContainer = document.querySelector('.workflow-manager__main');
        if (!mainContainer) return;

        // Get all task elements and section elements
        const allTasks: Array<{sectionId: string, taskId: string, element: HTMLElement}> = [];
        const sections = progressSections.map(section => {
          // Collect all tasks for this section
          section.tasks.forEach(task => {
            const taskElement = document.getElementById(`task-${section.id}-${task.id}`);
            if (taskElement) {
              allTasks.push({
                sectionId: section.id,
                taskId: task.id,
                element: taskElement
              });
            }
          });
          
          return {
            id: section.id,
            element: document.getElementById(`section-${section.id}`)
          };
        }).filter(section => section.element);

        const containerRect = mainContainer.getBoundingClientRect();

        let currentSection = 'infrastructure';
        let currentTask: string | null = null;
        let bestScore = -1;
        
        // First, check if any specific task is most visible
        for (const task of allTasks) {
          const rect = task.element.getBoundingClientRect();
          const elementTop = rect.top - containerRect.top;
          
          // Calculate how much of the task is visible
          const visibleTop = Math.max(0, -elementTop);
          const visibleBottom = Math.min(rect.height, containerRect.height - elementTop);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const visibilityRatio = visibleHeight / rect.height;
          
          // Score based on visibility and position
          let score = visibilityRatio;
          if (elementTop <= 100 && elementTop >= 0) {
            score += 0.5; // Bonus for being near the top
          }
          
          if (score > bestScore && score > 0.3) { // Minimum 30% visibility for tasks
            bestScore = score;
            currentSection = task.sectionId;
            currentTask = task.taskId;
          }
        }
        
        // If no task is clearly visible, fall back to section detection
        if (!currentTask) {
          bestScore = -1;
          for (const section of sections) {
            if (section.element) {
              const rect = section.element.getBoundingClientRect();
              const elementTop = rect.top - containerRect.top;
              
              // Calculate how much of the section is visible
              const visibleTop = Math.max(0, -elementTop);
              const visibleBottom = Math.min(rect.height, containerRect.height - elementTop);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const visibilityRatio = visibleHeight / rect.height;
              
              // Score based on visibility and position
              let score = visibilityRatio;
              if (elementTop <= 100 && elementTop >= 0) {
                score += 0.5; // Bonus for being near the top
              }
              
              if (score > bestScore) {
                bestScore = score;
                currentSection = section.id;
              }
            }
          }
        }

        setScrollActiveSection(currentSection);
        setActiveTask(currentTask);
      }, 50); // 50ms debounce
    };

    // Get the main container and add scroll listener
    const mainContainer = document.querySelector('.workflow-manager__main');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Check initial position

      return () => {
        clearTimeout(timeoutId);
        mainContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [progressSections]);

  // Update active section based on scroll position
  useEffect(() => {
    if (scrollActiveSection !== activeSection) {
      setActiveSection(scrollActiveSection);
    }
  }, [scrollActiveSection, activeSection, setActiveSection]);

  const overallProgress = getOverallProgress();

  return (
    <div className={`sidebar-navigation ${isCollapsed ? 'sidebar-navigation--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-navigation__header">
        <div className="sidebar-navigation__logo">
          <span className="sidebar-navigation__logo-icon">🚀</span>
          {!isCollapsed && (
            <h2 className="sidebar-navigation__title">Template Manager</h2>
          )}
        </div>
        <button
          className="sidebar-navigation__toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          tabIndex={0}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Overall Progress */}
      {!isCollapsed && (
        <div className="sidebar-navigation__progress">
          <div className="sidebar-navigation__progress-header">
            <span className="sidebar-navigation__progress-label">Overall Progress</span>
            <span className="sidebar-navigation__progress-percentage">{overallProgress}%</span>
          </div>
          <div className="sidebar-navigation__progress-bar">
            <div 
              className="sidebar-navigation__progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="sidebar-navigation__nav">
        {progressSections.map((section) => {
          const sectionStatus = getSectionStatus(section.id);
          const isActive = activeSection === section.id;
          const hasActiveTask = activeSection === section.id && activeTask !== null;

          return (
            <div key={section.id} className="sidebar-navigation__section">
              <button
                className={`sidebar-navigation__section-button ${
                  isActive ? 'sidebar-navigation__section-button--active' : ''
                } ${
                  hasActiveTask ? 'sidebar-navigation__section-button--has-active-task' : ''
                }`}
                onClick={() => handleSectionClick(section.id)}
                aria-label={`Navigate to ${section.title}`}
                tabIndex={0}
              >
                <div className="sidebar-navigation__section-header">
                  <span className="sidebar-navigation__section-icon">
                    {section.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="sidebar-navigation__section-title">
                        {section.title}
                      </span>
                      <ProgressIndicator status={sectionStatus} size="small" />
                    </>
                  )}
                </div>
              </button>

              {/* Task List - Always expanded */}
              {!isCollapsed && (
                <div className="sidebar-navigation__tasks">
                  {section.tasks.map((task) => {
                    const taskStatus = progressState[section.id][task.id as keyof typeof progressState[typeof section.id]] as ProgressStatus;
                    const isActiveTask = activeTask === task.id && activeSection === section.id;
                    
                    return (
                      <button
                        key={task.id}
                        className={`sidebar-navigation__task ${
                          isActiveTask ? 'sidebar-navigation__task--active' : ''
                        }`}
                        onClick={() => {
                          // Set the main section as active
                          setActiveSection(section.id);
                          // Set the active task
                          setActiveTask(task.id);
                          // Then scroll to the specific task section
                          setTimeout(() => {
                            const taskElement = document.getElementById(`task-${section.id}-${task.id}`);
                            const mainContainer = document.querySelector('.workflow-manager__main') as HTMLElement;
                            
                            if (taskElement && mainContainer) {
                              const containerRect = mainContainer.getBoundingClientRect();
                              const taskRect = taskElement.getBoundingClientRect();
                              const currentScroll = mainContainer.scrollTop;
                              const targetScroll = currentScroll + taskRect.top - containerRect.top - 20;
                              
                              mainContainer.scrollTo({
                                top: targetScroll,
                                behavior: 'smooth'
                              });
                            }
                          }, 50);
                        }}
                        aria-label={`Navigate to ${task.title}`}
                        tabIndex={0}
                      >
                        <div className="sidebar-navigation__task-header">
                          <ProgressIndicator status={taskStatus} size="small" />
                          <span className="sidebar-navigation__task-title">
                            {task.title}
                          </span>
                        </div>
                        <p className="sidebar-navigation__task-description">
                          {task.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Section scroll indicator */}
              {isActive && (
                <div className="sidebar-navigation__scroll-indicator">
                  <div className="sidebar-navigation__scroll-track">
                    <div 
                      className="sidebar-navigation__scroll-thumb"
                      style={{
                        height: '20%',
                        transform: 'translateY(0%)'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </div>
  );
};

export default SidebarNavigation;