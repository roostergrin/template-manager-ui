import React from 'react';
import './ProjectTypeSelector.sass';

interface ProjectTypeSelectorProps {
  onSelectType: (type: 'landing-page' | 'website') => void;
}

const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({ onSelectType }) => {
  const handleSelection = (type: 'landing-page' | 'website') => {
    onSelectType(type);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'landing-page' | 'website') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelection(type);
    }
  };

  return (
    <div className="project-type-selector">
      <div className="project-type-selector__container">
        <div className="project-type-selector__header">
          <h1 className="project-type-selector__title">
            What would you like to build?
          </h1>
          <p className="project-type-selector__subtitle">
            Choose your project type to get started
          </p>
        </div>

        <div className="project-type-selector__options">
          <button
            className="project-type-selector__card"
            onClick={() => handleSelection('landing-page')}
            onKeyDown={(e) => handleKeyDown(e, 'landing-page')}
            aria-label="Create a landing page"
          >
            <div className="project-type-selector__card-icon">📄</div>
            <h2 className="project-type-selector__card-title">Landing Page</h2>
            <p className="project-type-selector__card-description">
              Perfect for single-page sites, product launches, or campaign pages
            </p>
            <div className="project-type-selector__card-arrow">→</div>
          </button>

          <button
            className="project-type-selector__card"
            onClick={() => handleSelection('website')}
            onKeyDown={(e) => handleKeyDown(e, 'website')}
            aria-label="Create a website"
          >
            <div className="project-type-selector__card-icon">🌐</div>
            <h2 className="project-type-selector__card-title">Website</h2>
            <p className="project-type-selector__card-description">
              Full multi-page website with navigation, multiple sections, and complex structure
            </p>
            <div className="project-type-selector__card-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTypeSelector;

