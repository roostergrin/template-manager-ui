import React from 'react';
import { Zap, ArrowLeft, Plus, Copy } from 'lucide-react';
import { UnifiedWorkflowProvider, useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import UnifiedWorkflow from '../components/UnifiedWorkflow/UnifiedWorkflow';
import './UnifiedWorkflowPage.sass';

const UnifiedWorkflowPageContent: React.FC = () => {
  const { sessionId, openNewSession } = useUnifiedWorkflow();

  const handleBackToWorkflow = () => {
    // Navigate back to the main workflow manager
    window.location.href = '/';
  };

  const handleCopySessionLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="unified-workflow-page">
      <header className="unified-workflow-page__header">
        <div className="unified-workflow-page__header-top">
          <button
            type="button"
            className="unified-workflow-page__back-btn"
            onClick={handleBackToWorkflow}
            aria-label="Back to Workflow Manager"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="unified-workflow-page__session-controls">
            <span className="unified-workflow-page__session-badge" title="Session ID">
              Session: {sessionId}
            </span>
            <button
              type="button"
              className="unified-workflow-page__session-btn"
              onClick={handleCopySessionLink}
              title="Copy session link"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              className="unified-workflow-page__session-btn unified-workflow-page__session-btn--new"
              onClick={openNewSession}
              title="Open new session in new tab"
            >
              <Plus size={14} />
              New Session
            </button>
          </div>
        </div>
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
