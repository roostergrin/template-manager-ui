import React from 'react';
import useProgressTracking from '../../hooks/useProgressTracking';
import ProgressIndicator from './ProgressIndicator';

interface ProgressSummaryProps {
  className?: string;
  showDetails?: boolean;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  className = '',
  showDetails = false,
}) => {
  const {
    progressSections,
    getSectionStatus,
    getOverallProgress,
    getNextIncompleteTask,
    progressState,
  } = useProgressTracking();

  const overallProgress = getOverallProgress();
  const nextTask = getNextIncompleteTask();

  const getProgressMessage = (): string => {
    if (overallProgress === 100) {
      return 'All tasks completed! 🎉';
    } else if (overallProgress === 0) {
      return 'Ready to start your workflow';
    } else if (overallProgress < 50) {
      return 'Getting started...';
    } else {
      return 'Making great progress!';
    }
  };

  const getProgressColor = (): string => {
    if (overallProgress === 100) return '#198754';
    if (overallProgress >= 75) return '#20c997';
    if (overallProgress >= 50) return '#0d6efd';
    if (overallProgress >= 25) return '#fd7e14';
    return '#6c757d';
  };

  return (
    <div className={`progress-summary ${className}`}>
      {/* Overall Progress */}
      <div className="progress-summary__main">
        <div className="progress-summary__circle">
          <svg className="progress-summary__circle-svg" viewBox="0 0 100 100">
            <circle
              className="progress-summary__circle-bg"
              cx="50"
              cy="50"
              r="40"
            />
            <circle
              className="progress-summary__circle-progress"
              cx="50"
              cy="50"
              r="40"
              style={{
                stroke: getProgressColor(),
                strokeDasharray: `${overallProgress * 2.512} 251.2`,
              }}
            />
          </svg>
          <div className="progress-summary__percentage">
            {overallProgress}%
          </div>
        </div>
        
        <div className="progress-summary__info">
          <h3 className="progress-summary__title">Workflow Progress</h3>
          <p className="progress-summary__message">{getProgressMessage()}</p>
          
          {nextTask && (
            <div className="progress-summary__next-task">
              <p className="progress-summary__next-label">Next task:</p>
              <p className="progress-summary__next-title">
                {nextTask.taskTitle} in {nextTask.sectionTitle}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section Details */}
      {showDetails && (
        <div className="progress-summary__sections">
          <h4 className="progress-summary__sections-title">Section Progress</h4>
          <div className="progress-summary__sections-list">
            {progressSections.map((section) => {
              const sectionStatus = getSectionStatus(section.id);
              const sectionTasks = section.tasks;
              const completedTasks = sectionTasks.filter(
                (task) =>
                  progressState[section.id][task.id as keyof typeof progressState[typeof section.id]] === 'completed'
              ).length;

              return (
                <div key={section.id} className="progress-summary__section">
                  <div className="progress-summary__section-header">
                    <span className="progress-summary__section-icon">
                      {section.icon}
                    </span>
                    <span className="progress-summary__section-name">
                      {section.title}
                    </span>
                    <ProgressIndicator status={sectionStatus} size="small" />
                  </div>
                  
                  <div className="progress-summary__section-progress">
                    <div className="progress-summary__section-bar">
                      <div 
                        className="progress-summary__section-fill"
                        style={{
                          width: `${(completedTasks / sectionTasks.length) * 100}%`,
                          backgroundColor: getProgressColor(),
                        }}
                      />
                    </div>
                    <span className="progress-summary__section-fraction">
                      {completedTasks}/{sectionTasks.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressSummary;