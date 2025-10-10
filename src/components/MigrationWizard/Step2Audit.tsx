import React from 'react';
import ScrapedContentViewer from '../ScrapedContentViewer/ScrapedContentViewer';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import './Step2Audit.sass';

const Step2Audit: React.FC = () => {
  const { state, actions } = useMigrationWizard();

  if (!state.scrapedContent) {
    return (
      <div className="step-2-audit__empty">
        <p>No scraped content available. Please complete Step 1 first.</p>
        <div className="step-2-audit__empty-actions">
          <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
            Go to Step 1
          </button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    actions.nextStep();
  };

  return (
    <div className="step-2-audit">
      <div className="step-2-audit__content">
        <ScrapedContentViewer
          scrapedContent={state.scrapedContent}
          onNext={handleContinue}
        />
      </div>
    </div>
  );
};

export default Step2Audit;
