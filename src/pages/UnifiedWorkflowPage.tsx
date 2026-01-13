import React from 'react';
import { Zap, ArrowLeft } from 'lucide-react';
import { UnifiedWorkflowProvider } from '../contexts/UnifiedWorkflowProvider';
import UnifiedWorkflow from '../components/UnifiedWorkflow/UnifiedWorkflow';
import './UnifiedWorkflowPage.sass';

const UnifiedWorkflowPageContent: React.FC = () => {
  const handleBackToWorkflow = () => {
    // Navigate back to the main workflow manager
    window.location.href = '/';
  };

  return (
    <div className="unified-workflow-page">
      <header className="unified-workflow-page__header">
        <button
          type="button"
          className="unified-workflow-page__back-btn"
          onClick={handleBackToWorkflow}
          aria-label="Back to Workflow Manager"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="unified-workflow-page__title-container">
          <Zap size={28} className="unified-workflow-page__icon" />
          <h1 className="unified-workflow-page__title">Unified Site Generation</h1>
        </div>
        <p className="unified-workflow-page__description">
          Orchestrate all site generation steps with real-time progress tracking
        </p>
      </header>

      <main className="unified-workflow-page__content">
        <UnifiedWorkflow />
      </main>

      <footer className="unified-workflow-page__footer">
        <p className="unified-workflow-page__footer-text">
          Template Manager UI - Unified Workflow
        </p>
      </footer>
    </div>
  );
};

const UnifiedWorkflowPage: React.FC = () => {
  return (
    <UnifiedWorkflowProvider>
      <UnifiedWorkflowPageContent />
    </UnifiedWorkflowProvider>
  );
};

export default UnifiedWorkflowPage;
