import React, { useState } from 'react';
import './WorkflowPanel.sass';

interface WorkflowPanelProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  id,
  title,
  description,
  icon,
  children,
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

  return (
    <section className="workflow-panel" id={id}>
      <button
        className="workflow-panel__header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        aria-label={`${title} - ${isExpanded ? 'Collapse' : 'Expand'} section`}
      >
        <div className="workflow-panel__header-content">
          <span className="workflow-panel__icon">{icon}</span>
          <div className="workflow-panel__header-text">
            <h2 className="workflow-panel__title">{title}</h2>
            <p className="workflow-panel__description">{description}</p>
          </div>
        </div>
        <span className={`workflow-panel__toggle ${isExpanded ? 'workflow-panel__toggle--expanded' : ''}`}>
          ▼
        </span>
      </button>

      <div
        id={`${id}-content`}
        className={`workflow-panel__content ${isExpanded ? 'workflow-panel__content--expanded' : ''}`}
        aria-hidden={!isExpanded}
      >
        <div className="workflow-panel__inner">
          {children}
        </div>
      </div>
    </section>
  );
};

export default WorkflowPanel;

