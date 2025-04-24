import React, { useEffect } from 'react';
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
  const availableTemplates = selectedModelGroupKey && modelGroups[selectedModelGroupKey]?.templates || [];
  const [selectedTemplateIndex, setSelectedTemplateIndex] = React.useState<number>(0);
  
  // Auto-select the first template when component mounts or selectedModelGroupKey changes
  useEffect(() => {
    if (availableTemplates.length > 0) {
      const firstTemplate = availableTemplates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      onTemplateSelect(jsonString);
      setSelectedTemplateIndex(0);
    }
  }, []); // Only depend on the model group key, not onTemplateSelect

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (!selectedValue) return;
    
    // Find the selected template
    const selectedIndex = parseInt(selectedValue, 10);
    const selectedTemplate = availableTemplates[selectedIndex];
    
    if (selectedTemplate) {
      const jsonString = JSON.stringify(selectedTemplate.data);
      onTemplateSelect(jsonString);
      setSelectedTemplateIndex(selectedIndex);
    }
  };
  
  if (availableTemplates.length === 0) {
    return (
      <div className="default-template-selector empty">
        <span>No templates available for {selectedModelGroupKey}</span>
      </div>
    );
  }

  const selectedTemplate = availableTemplates[selectedTemplateIndex];

  return (
    <div className="default-template-selector">
      <div className="template-select-container">
        <label htmlFor="template-select">Load template: </label>
        <select
          id="template-select"
          onChange={handleTemplateChange}
          value={selectedTemplateIndex.toString()}
        >
          {availableTemplates.map((template, index) => (
            <option key={index} value={index}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Template description display */}
      <div className="template-description">
        {selectedTemplate && (
          <>
            <h4>{selectedTemplate.name}</h4>
            <p>{selectedTemplate.description}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DefaultTemplateSelector; 