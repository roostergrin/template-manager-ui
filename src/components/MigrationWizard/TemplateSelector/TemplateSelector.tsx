import React, { useEffect, useMemo, useRef } from 'react';
import { modelGroups } from '../../../modelGroups';
import './TemplateSelector.sass';

interface TemplateSelectorProps {
  selectedModelGroupKey: string;
  onTemplateSelect: (jsonData: string, modelGroupKey: string) => void;
  onModelGroupChange: (key: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedModelGroupKey,
  onTemplateSelect,
  onModelGroupChange,
}) => {
  // Get all enabled model groups
  const availableModelGroups = useMemo(() => {
    return Object.entries(modelGroups)
      .filter(([_, group]) => group.enabled !== false)
      .map(([key, group]) => ({
        key,
        ...group,
      }));
  }, []);

  // Stabilize callback to avoid effect loops
  const onSelectRef = useRef(onTemplateSelect);
  useEffect(() => {
    onSelectRef.current = onTemplateSelect;
  }, [onTemplateSelect]);

  // Auto-select the first template of the selected model group
  useEffect(() => {
    const selectedGroup = modelGroups[selectedModelGroupKey];
    if (selectedGroup && selectedGroup.templates.length > 0) {
      const firstTemplate = selectedGroup.templates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      onSelectRef.current(jsonString, selectedModelGroupKey);
    }
  }, [selectedModelGroupKey]);

  const handleTemplateClick = (modelGroupKey: string) => {
    const group = modelGroups[modelGroupKey];
    if (group && group.templates.length > 0) {
      const firstTemplate = group.templates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      onModelGroupChange(modelGroupKey);
      onTemplateSelect(jsonString, modelGroupKey);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, modelGroupKey: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTemplateClick(modelGroupKey);
    }
  };

  if (availableModelGroups.length === 0) {
    return (
      <div className="template-selector__empty">
        <p>No templates available</p>
      </div>
    );
  }

  return (
    <div className="template-selector">
      <div className="template-selector__grid">
        {availableModelGroups.map(({ key, title, image, adjectives, templates }) => (
          <div
            key={key}
            className={`template-selector__card ${selectedModelGroupKey === key ? 'template-selector__card--selected' : ''}`}
            onClick={() => handleTemplateClick(key)}
            onKeyDown={(e) => handleKeyDown(e, key)}
            tabIndex={0}
            role="button"
            aria-label={`Select ${title} template`}
          >
            <div className="template-selector__card-image">
              <img src={image} alt={`${title} template preview`} />
            </div>
            <div className="template-selector__card-content">
              <h4 className="template-selector__card-title">{title}</h4>
              {templates.length > 0 && (
                <p className="template-selector__card-template-name">
                  {templates[0].name}
                </p>
              )}
              {adjectives.length > 0 && (
                <div className="template-selector__card-tags">
                  {adjectives.slice(0, 3).map((adj) => (
                    <span key={adj} className="template-selector__tag">
                      {adj}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {selectedModelGroupKey === key && (
              <div className="template-selector__card-selected-indicator">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="12" fill="#10b981" />
                  <path
                    d="M7 12l3 3 7-7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
