import React, { useEffect, useMemo, useRef } from 'react';
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
  
  // Stabilize callback to avoid effect loops when parent recreates function identities
  const onSelectRef = useRef(onTemplateSelect);
  useEffect(() => {
    onSelectRef.current = onTemplateSelect;
  }, [onTemplateSelect]);

  // Don't auto-select templates - let user explicitly choose
  // useEffect(() => {
  //   if (availableTemplates.length > 0) {
  //     const firstTemplate = availableTemplates[0];
  //     const jsonString = JSON.stringify(firstTemplate.data);
  //     onSelectRef.current(jsonString);
  //   }
  // }, [availableTemplates]);
  
  if (availableTemplates.length === 0) {
    return (
      <div className="default-template-selector empty">
        <span>No templates available for {selectedModelGroupKey}</span>
      </div>
    );
  }

  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value);
    if (selectedIndex >= 0 && selectedIndex < availableTemplates.length) {
      const selectedTemplate = availableTemplates[selectedIndex];
      const jsonString = JSON.stringify(selectedTemplate.data);
      onTemplateSelect(jsonString);
    }
  };

  return (
    <div className="default-template-selector">
      <div className="template-select-container">
        <select 
          id="template-selector"
          onChange={handleTemplateSelect}
          defaultValue=""
        >
          <option value="">Select a template...</option>
          {availableTemplates.map((template, index) => (
            <option key={template.name} value={index}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DefaultTemplateSelector; 
