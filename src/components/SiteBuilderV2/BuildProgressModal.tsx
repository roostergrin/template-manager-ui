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
  domain?: string;
  distributionUrl?: string;
}

const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
  isOpen,
  steps,
  onClose,
  isComplete = false,
  repoUrl,
  domain,
  distributionUrl,
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
        </div>

        {!isComplete && (
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
        )}

        {isComplete && (
          <div className="build-progress-modal__dns-section">
            <h3 className="build-progress-modal__dns-title">📋 DNS Configuration Required</h3>
            <p className="build-progress-modal__dns-description">
              Add these DNS records to your domain registrar to point your domain to your new landing page:
            </p>
            
            <div className="build-progress-modal__dns-records">
              <div className="build-progress-modal__dns-record">
                <div className="build-progress-modal__dns-record-header">
                  <span className="build-progress-modal__dns-record-type">CNAME</span>
                  <span className="build-progress-modal__dns-record-name">www</span>
                </div>
                <div className="build-progress-modal__dns-record-value">
                  {distributionUrl || 'your-cloudfront-distribution.cloudfront.net'}
                </div>
              </div>
              
              <div className="build-progress-modal__dns-record">
                <div className="build-progress-modal__dns-record-header">
                  <span className="build-progress-modal__dns-record-type">A</span>
                  <span className="build-progress-modal__dns-record-name">@</span>
                  <span className="build-progress-modal__dns-record-label">(root)</span>
                </div>
                <div className="build-progress-modal__dns-record-value">44.236.196.209</div>
              </div>
            </div>
            
            <div className="build-progress-modal__certificate-note">
              <strong>⚠️ Important:</strong> You need to issue an SSL certificate in{' '}
              <a 
                href="https://console.aws.amazon.com/acm/home" 
                target="_blank" 
                rel="noopener noreferrer"
                className="build-progress-modal__link"
              >
                AWS Certificate Manager
              </a>
              {' '}for <strong>{domain}</strong> to enable HTTPS.
            </div>
          </div>
        )}

        {(isComplete || hasError) && (
          <div className="build-progress-modal__actions">
            {onClose && (
              <button
                className="build-progress-modal__button build-progress-modal__button--primary"
                onClick={onClose}
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildProgressModal;

