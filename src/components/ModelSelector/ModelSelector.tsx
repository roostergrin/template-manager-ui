import React from 'react';
import './ModelSelector.sass';

interface ModelSelectorProps {
  selectedModelGroupKey: string;
  modelGroups: Record<string, string[]>;
  onModelGroupChange: (newModelGroupKey: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelGroupKey,
  modelGroups,
  onModelGroupChange,
}) => {
  return (
    <div className="model-selector">
      <select
        value={selectedModelGroupKey}
        onChange={(e) => onModelGroupChange(e.target.value)}
      >
        {Object.entries(modelGroups).map(([key]) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector; 