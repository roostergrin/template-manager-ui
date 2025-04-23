import React from 'react';
import './SiteSelector.sass';
import { ModelGroup, modelGroups } from '../../modelGroups';

interface SiteSelectorProps {
  selectedModelGroupKey: string;
  onModelGroupChange: (newModelGroupKey: string) => void;
}

const SiteSelector: React.FC<SiteSelectorProps> = ({
  selectedModelGroupKey,
  onModelGroupChange,
}) => {
  // Helper function to check if a model group is in the new format
  const isModelGroup = (value: ModelGroup | string[]): value is ModelGroup => {
    return typeof value === 'object' && !Array.isArray(value) && 'models' in value;
  };

  return (
    <div className="site-selector">
      <div className="site-selector__container">
        {Object.entries(modelGroups).map(([key, group]) => {
          // Handle both old and new format
          if (isModelGroup(group)) {
            // Check if model is ready (has at least one model)
            const isReady = group.models && group.models.length > 0;
            const isSelected = selectedModelGroupKey === key;
            
            // New format with metadata
            return (
              <div 
                key={key} 
                className={`site-selector__item ${isSelected ? 'site-selector__item--active' : ''} ${!isReady ? 'site-selector__item--coming-soon' : ''}`}
                onClick={isReady ? () => onModelGroupChange(key) : undefined}
              >
                {isSelected && (
                  <div className="site-selector__selected-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="none" d="M0 0h24v24H0z"/>
                      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}
                <div className="site-selector__item-media">
                  <div className="site-selector__item-image">
                    <img src={group.image} alt={`${group.title} template`} />
                  </div>
                  {!isReady && <div className="site-selector__coming-soon">Coming Soon</div>}
                </div>
                <h3 className="site-selector__item-title">{group.title}</h3>
                <div className="site-selector__item-adjectives">
                  {group.adjectives.map((adjective, index) => (
                    <div key={index} className="site-selector__item-adjective">{adjective}</div>
                  ))}
                </div>
                
                {group.demoUrl && (
                  <div className="site-selector__view-template">
                    <a 
                      href={group.demoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="site-selector__template-button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="site-selector__button-label">
                        View Template
                        <span className="site-selector__external-icon">↗</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default SiteSelector; 