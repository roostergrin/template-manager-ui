import React from 'react';
import { Play, RotateCcw, Square, Eye, Download } from 'lucide-react';
import { WorkflowStep } from '../../types/UnifiedWorkflowTypes';
import { useWorkflowExport } from '../../hooks/useWorkflowExport';
import JsonViewer from './JsonViewer';

interface InterventionPanelProps {
  step: WorkflowStep;
  onContinue: () => void;
  onRetry: () => void;
  onStop: () => void;
}

const InterventionPanel: React.FC<InterventionPanelProps> = ({
  step,
  onContinue,
  onRetry,
  onStop,
}) => {
  const { exportStepResult } = useWorkflowExport();

  const handleDownload = () => {
    exportStepResult(step.id);
  };

  return (
    <div className="intervention-panel">
      <div className="intervention-panel__header">
        <Eye size={20} className="intervention-panel__icon" />
        <h4 className="intervention-panel__title">
          Step Completed: {step.name}
        </h4>
      </div>

      <div className="intervention-panel__status">
        <span className="intervention-panel__status-label">Status:</span>
        <span className={`intervention-panel__status-value intervention-panel__status-value--${step.status}`}>
          {step.status}
        </span>
        {step.actualDurationSeconds !== undefined && (
          <span className="intervention-panel__duration">
            ({step.actualDurationSeconds}s)
          </span>
        )}
      </div>

      {step.error && (
        <div className="intervention-panel__error">
          <strong>Error:</strong> {step.error}
        </div>
      )}

      <div className="intervention-panel__result">
        <h5 className="intervention-panel__result-title">Step Result:</h5>
        {step.result ? (
          <JsonViewer
            data={step.result}
            maxStringLength={150}
            initialExpanded={true}
            className="intervention-panel__json"
          />
        ) : (
          <p className="intervention-panel__no-result">No result data available</p>
        )}
      </div>

      <div className="intervention-panel__actions">
        <button
          type="button"
          className="intervention-panel__btn intervention-panel__btn--continue"
          onClick={onContinue}
          aria-label="Continue to next step"
        >
          <Play size={16} />
          Continue
        </button>
        <button
          type="button"
          className="intervention-panel__btn intervention-panel__btn--download"
          onClick={handleDownload}
          disabled={!step.result}
          aria-label="Download step result as JSON"
        >
          <Download size={16} />
          Download
        </button>
        <button
          type="button"
          className="intervention-panel__btn intervention-panel__btn--retry"
          onClick={onRetry}
          aria-label="Retry this step"
        >
          <RotateCcw size={16} />
          Retry
        </button>
        <button
          type="button"
          className="intervention-panel__btn intervention-panel__btn--stop"
          onClick={onStop}
          aria-label="Stop workflow"
        >
          <Square size={16} />
          Stop
        </button>
      </div>
    </div>
  );
};

export default InterventionPanel;
