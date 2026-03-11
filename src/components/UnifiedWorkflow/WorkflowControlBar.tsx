import React from 'react';
import { Play, Pause, Square, RefreshCw } from 'lucide-react';
import { WorkflowStep } from '../../types/UnifiedWorkflowTypes';

interface WorkflowControlBarProps {
  isRunning: boolean;
  isPaused: boolean;
  lastExecutedStep: WorkflowStep | null;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
  onRetryLastStep: () => void;
}

export const WorkflowControlBar: React.FC<WorkflowControlBarProps> = ({
  isRunning,
  isPaused,
  lastExecutedStep,
  onResume,
  onPause,
  onStop,
  onRetryLastStep,
}) => (
  <>
    {/* Running Controls - only shown when workflow is active */}
    {isRunning && (
      <div className="unified-workflow__controls">
        {isPaused ? (
          <button
            type="button"
            className="unified-workflow__control-btn unified-workflow__control-btn--resume"
            onClick={onResume}
            aria-label="Resume workflow"
          >
            <Play size={18} />
            Resume
          </button>
        ) : (
          <button
            type="button"
            className="unified-workflow__control-btn unified-workflow__control-btn--pause"
            onClick={onPause}
            aria-label="Pause workflow"
          >
            <Pause size={18} />
            Pause
          </button>
        )}
        <button
          type="button"
          className="unified-workflow__control-btn unified-workflow__control-btn--stop"
          onClick={onStop}
          aria-label="Stop workflow"
        >
          <Square size={18} />
          Stop
        </button>
      </div>
    )}

    {/* Retry last step - shown when not running and a step was executed */}
    {lastExecutedStep && !isRunning && (
      <div className="unified-workflow__controls">
        <button
          type="button"
          className="unified-workflow__control-btn unified-workflow__control-btn--retry"
          onClick={onRetryLastStep}
          aria-label={`Retry step: ${lastExecutedStep.name}`}
        >
          <RefreshCw size={18} />
          Retry {lastExecutedStep.name}
        </button>
      </div>
    )}
  </>
);

export default WorkflowControlBar;
