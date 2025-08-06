import React, { useEffect, useMemo } from 'react';
import { modelGroups } from '../../modelGroups';
import './DefaultTemplateSelector.sass';

interface DefaultTemplateSelectorProps {
  selectedModelGroupKey: string;
  onTemplateSelect: (jsonData: string) => void;
}

const DefaultTemplateSelector: React.FC<DefaultTemplateSelectorProps> = ({ 
  selectedModelGroupKey, 
  onTemplateSelect 
}) => {
  const availableTemplates = useMemo(() => {
    return selectedModelGroupKey && modelGroups[selectedModelGroupKey]?.templates || [];
  }, [selectedModelGroupKey]);
  
  // Auto-select the first template when component mounts or selectedModelGroupKey changes
  useEffect(() => {
    if (availableTemplates.length > 0) {
      const firstTemplate = availableTemplates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      onTemplateSelect(jsonString);
    }
  }, [availableTemplates, onTemplateSelect]);
  
  if (availableTemplates.length === 0) {
    return (
      <div className="default-template-selector empty">
        <span>No templates available for {selectedModelGroupKey}</span>
      </div>
    );
  }

  return null;
};

export default DefaultTemplateSelector; 