import React from 'react';
import { templateRegistry, TemplateInfo } from '../../templates/templateRegistry';
import './DefaultTemplateSelector.sass';

interface DefaultTemplateSelectorProps {
  selectedModelGroupKey: string;
  onTemplateSelect: (jsonData: string) => void;
}

const DefaultTemplateSelector: React.FC<DefaultTemplateSelectorProps> = ({ 
  selectedModelGroupKey, 
  onTemplateSelect 
}) => {
  const availableTemplates = templateRegistry[selectedModelGroupKey] || [];
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (!selectedValue) return;
    
    // Find the selected template
    const selectedIndex = parseInt(selectedValue, 10);
    const selectedTemplate = availableTemplates[selectedIndex];
    
    if (selectedTemplate) {
      const jsonString = JSON.stringify(selectedTemplate.data);
      onTemplateSelect(jsonString);
    }
  };
  
  if (availableTemplates.length === 0) {
    return (
      <div className="default-template-selector empty">
        <span>No templates available for {selectedModelGroupKey}</span>
      </div>
    );
  }

  return (
    <div className="default-template-selector">
      <label htmlFor="template-select">Load template: </label>
      <select
        id="template-select"
        onChange={handleTemplateChange}
        defaultValue=""
      >
        <option value="" disabled>Select a template</option>
        {availableTemplates.map((template, index) => (
          <option key={index} value={index}>
            {template.name}
          </option>
        ))}
      </select>
      
      {/* Optional description display for the selected template */}
      <div className="template-description">
        {availableTemplates.length > 0 && (
          <p><i>Select a template to quickly populate your sitemap</i></p>
        )}
      </div>
    </div>
  );
};

export default DefaultTemplateSelector; 