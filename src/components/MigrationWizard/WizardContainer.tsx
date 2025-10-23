import React from 'react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import './WizardContainer.sass';

interface StepInfo {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const steps: StepInfo[] = [
  {
    id: 'capture',
    label: 'Capture',
    icon: '🔍',
    description: "Let's grab your existing content",
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: '✔️',
    description: "Let's review what we found",
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: '🗺️',
    description: 'Choose your site architecture',
  },
  {
    id: 'customize',
    label: 'Customize',
    icon: '🎨',
    description: 'Make it yours while we build',
  },
  {
    id: 'launch',
    label: 'Launch Ready',
    icon: '🚀',
    description: 'Your new site is ready!',
  },
];

interface WizardContainerProps {
  children: React.ReactNode;
}

const WizardContainer: React.FC<WizardContainerProps> = ({ children }) => {
  const { state, actions } = useMigrationWizard();

  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep);
  const currentStepInfo = steps[currentStepIndex];

  const handleStepClick = (stepId: string) => {
    actions.setCurrentStep(stepId as any);
  };

  return (
    <div className="wizard-container">
      <div className="wizard-container__header">
        <h1 className="wizard-container__title">Website Migration Wizard</h1>
        <p className="wizard-container__subtitle">5 easy steps to migrate your website</p>
      </div>

      <div className="wizard-container__progress">
        <div className="step-indicator">
          {steps.map((step, index) => {
            const isActive = step.id === state.currentStep;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <div
                key={step.id}
                className={`step-indicator__step ${isActive ? 'step-indicator__step--active' : ''} ${isCompleted ? 'step-indicator__step--completed' : ''} ${isClickable ? 'step-indicator__step--clickable' : ''}`}
                onClick={() => isClickable && handleStepClick(step.id)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-label={`Step ${index + 1}: ${step.label}`}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    handleStepClick(step.id);
                  }
                }}
              >
                <div className="step-indicator__icon">
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div className="step-indicator__label">{step.label}</div>
                {index < steps.length - 1 && (
                  <div className="step-indicator__connector"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="wizard-container__content">
        <div className="wizard-container__step-header">
          <h2 className="wizard-container__step-title">
            {currentStepInfo.icon} Step {currentStepIndex + 1}: {currentStepInfo.label}
          </h2>
          <p className="wizard-container__step-description">
            {currentStepInfo.description}
          </p>
        </div>

        <div className="wizard-container__step-content">
          {children}
        </div>
      </div>

      <div className="wizard-container__navigation">
        <button
          className="wizard-container__nav-btn wizard-container__nav-btn--prev"
          onClick={actions.previousStep}
          disabled={currentStepIndex === 0}
          aria-label="Previous step"
        >
          ← Previous
        </button>

        <div className="wizard-container__nav-info">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        <button
          className="wizard-container__nav-btn wizard-container__nav-btn--next"
          onClick={actions.nextStep}
          disabled={currentStepIndex === steps.length - 1}
          aria-label="Next step"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default WizardContainer;
