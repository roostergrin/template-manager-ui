import React, { useState } from 'react';
import './TaskCard.sass';

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
  status?: 'pending' | 'in-progress' | 'completed' | 'error';
  defaultExpanded?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  icon,
  children,
  status = 'pending',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⏳';
      case 'error':
        return '!';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#e5e5e5';
    }
  };

  return (
    <div className={`task-card task-card--${status}`} id={id}>
      <button
        className="task-card__header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        aria-label={`${title} - ${isExpanded ? 'Collapse' : 'Expand'} task`}
      >
        <div className="task-card__header-left">
          <span className="task-card__icon">{icon}</span>
          <div className="task-card__header-text">
            <h3 className="task-card__title">{title}</h3>
            <p className="task-card__description">{description}</p>
          </div>
        </div>
        <div className="task-card__header-right">
          {status !== 'pending' && (
            <span
              className="task-card__status-badge"
              style={{ backgroundColor: getStatusColor() }}
              aria-label={`Status: ${status}`}
            >
              {getStatusIcon()}
            </span>
          )}
          <span className={`task-card__toggle ${isExpanded ? 'task-card__toggle--expanded' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {children && (
        <div
          id={`${id}-content`}
          className={`task-card__content ${isExpanded ? 'task-card__content--expanded' : ''}`}
          aria-hidden={!isExpanded}
        >
          <div className="task-card__inner">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;

