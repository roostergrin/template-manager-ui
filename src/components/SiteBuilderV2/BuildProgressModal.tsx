import React from 'react';
import './BuildProgressModal.sass';

interface BuildStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  errorMessage?: string;
}

interface BuildProgressModalProps {
  isOpen: boolean;
  steps: BuildStep[];
  onClose?: () => void;
  isComplete?: boolean;
  repoUrl?: string;
}

const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
  isOpen,
  steps,
  onClose,
  isComplete = false,
  repoUrl,
}) => {
  if (!isOpen) return null;

  const hasError = steps.some(step => step.status === 'error');
  const canClose = isComplete || hasError;

  const getStepIcon = (status: BuildStep['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⟳';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  const getTitle = () => {
    if (hasError) return '❌ Build Failed';
    if (isComplete) return '🎉 Landing Page Built!';
    return '🚀 Building Landing Page';
  };

  return (
    <div className="build-progress-modal">
      <div className="build-progress-modal__overlay" onClick={canClose ? onClose : undefined} />
      <div className="build-progress-modal__content">
        <div className="build-progress-modal__header">
          <h2 className="build-progress-modal__title">
            {getTitle()}
          </h2>
          {canClose && onClose && (
            <button
              className="build-progress-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="build-progress-modal__steps">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`build-progress-modal__step build-progress-modal__step--${step.status}`}
            >
              <div className="build-progress-modal__step-icon">
                {getStepIcon(step.status)}
              </div>
              <div className="build-progress-modal__step-content">
                <span className="build-progress-modal__step-label">{step.label}</span>
                {step.errorMessage && (
                  <span className="build-progress-modal__step-error">{step.errorMessage}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {(isComplete || hasError) && (
          <div className="build-progress-modal__actions">
            {isComplete && repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="build-progress-modal__button build-progress-modal__button--primary"
              >
                View Repository
              </a>
            )}
            {onClose && (
              <button
                className="build-progress-modal__button build-progress-modal__button--secondary"
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildProgressModal;

