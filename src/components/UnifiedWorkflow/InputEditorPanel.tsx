import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Edit3, Play, SkipForward, X, AlertTriangle } from 'lucide-react';
import { WorkflowStep } from '../../types/UnifiedWorkflowTypes';
import { STEP_INPUT_MAPPINGS } from '../../constants/stepInputMappings';
import JsonEditor from './JsonEditor';

interface InputEditorPanelProps {
  step: WorkflowStep;
  inputData: unknown;
  onUseOriginal: () => void;
  onUseEdited: (editedData: unknown) => void;
  onCancel: () => void;
}

const EMPTY_OBJECT = {}; // Stable reference for empty state

const InputEditorPanel: React.FC<InputEditorPanelProps> = ({
  step,
  inputData,
  onUseOriginal,
  onUseEdited,
  onCancel,
}) => {
  // Use empty object as default when no input data (allows pasting for testing)
  // useMemo to prevent creating new object reference on every render
  const initialData = useMemo(() => {
    return inputData !== undefined ? inputData : EMPTY_OBJECT;
  }, [inputData]);
  const hasNoInitialData = inputData === undefined;

  const [editedData, setEditedData] = useState<unknown>(initialData);
  const [hasChanges, setHasChanges] = useState(hasNoInitialData); // Consider changed if starting empty
  const [isValid, setIsValid] = useState(true);

  const mapping = STEP_INPUT_MAPPINGS[step.id];

  // Reset when input data changes
  useEffect(() => {
    const newInitialData = inputData !== undefined ? inputData : {};
    setEditedData(newInitialData);
    setHasChanges(inputData === undefined); // Changed if no initial data
    setIsValid(true);
  }, [inputData]);

  const handleDataChange = useCallback((newData: unknown) => {
    setEditedData(newData);
    // If no initial data, any content is considered a change
    if (hasNoInitialData) {
      const hasContent = newData && Object.keys(newData as object).length > 0;
      setHasChanges(hasContent as boolean);
    } else {
      setHasChanges(JSON.stringify(newData) !== JSON.stringify(inputData));
    }
    setIsValid(true);
  }, [inputData, hasNoInitialData]);

  const handleUseEdited = useCallback(() => {
    if (isValid && hasChanges) {
      onUseEdited(editedData);
    }
  }, [editedData, isValid, hasChanges, onUseEdited]);

  return (
    <div className="input-editor-panel">
      <div className="input-editor-panel__header">
        <div className="input-editor-panel__title-row">
          <Edit3 size={20} className="input-editor-panel__icon" />
          <h4 className="input-editor-panel__title">
            Edit Input: {step.name}
          </h4>
        </div>
        <button
          type="button"
          className="input-editor-panel__close"
          onClick={onCancel}
          aria-label="Cancel and stop workflow"
        >
          <X size={20} />
        </button>
      </div>

      <div className="input-editor-panel__description">
        <p>{mapping?.description || 'Input data for this step'}</p>
        {mapping?.dataPath && (
          <span className="input-editor-panel__data-path">
            Data path: {mapping.dataKey}.{mapping.dataPath}
          </span>
        )}
      </div>

      {hasNoInitialData && (
        <div className="input-editor-panel__paste-hint">
          <AlertTriangle size={16} />
          <span>No data from previous steps. Paste your JSON content below to test this step.</span>
        </div>
      )}
      <div className="input-editor-panel__editor">
        <JsonEditor
          data={initialData}
          onChange={handleDataChange}
          className="input-editor-panel__json-editor"
        />
      </div>

      <div className="input-editor-panel__footer">
        <div className="input-editor-panel__status">
          {hasChanges && isValid && (
            <span className="input-editor-panel__changes-badge">
              Changes pending
            </span>
          )}
        </div>

        <div className="input-editor-panel__actions">
          <button
            type="button"
            className="input-editor-panel__btn input-editor-panel__btn--cancel"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X size={16} />
            Cancel
          </button>
          {!hasNoInitialData && (
            <button
              type="button"
              className="input-editor-panel__btn input-editor-panel__btn--skip"
              onClick={onUseOriginal}
              aria-label="Use original data"
            >
              <SkipForward size={16} />
              Use Original
            </button>
          )}
          <button
            type="button"
            className="input-editor-panel__btn input-editor-panel__btn--continue"
            onClick={handleUseEdited}
            disabled={!isValid || !hasChanges}
            aria-label="Run with this data"
          >
            <Play size={16} />
            Run Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputEditorPanel;
