import React from 'react';
import { X, Download, FileText, Package } from 'lucide-react';
import { useWorkflowExport } from '../../hooks/useWorkflowExport';

interface ExportPanelProps {
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ onClose }) => {
  const {
    exportStepResult,
    exportFullWorkflow,
    exportSessionLog,
    getExportableSteps,
  } = useWorkflowExport();

  const exportableSteps = getExportableSteps();

  const handleExportAll = () => {
    exportFullWorkflow();
  };

  const handleExportLog = () => {
    exportSessionLog();
  };

  const handleExportStep = (stepId: string) => {
    exportStepResult(stepId);
  };

  return (
    <div className="export-panel">
      <div className="export-panel__header">
        <h3 className="export-panel__title">
          <Download size={20} />
          Export Workflow Data
        </h3>
        <button
          type="button"
          className="export-panel__close"
          onClick={onClose}
          aria-label="Close export panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="export-panel__content">
        {/* Full Export Section */}
        <div className="export-panel__section">
          <h4 className="export-panel__section-title">Complete Export</h4>
          <div className="export-panel__buttons">
            <button
              type="button"
              className="export-panel__btn export-panel__btn--primary"
              onClick={handleExportAll}
              aria-label="Export all workflow data"
            >
              <Package size={16} />
              Export All Data
              <span className="export-panel__btn-desc">
                Full bundle with config, steps, and generated data
              </span>
            </button>
            <button
              type="button"
              className="export-panel__btn export-panel__btn--secondary"
              onClick={handleExportLog}
              aria-label="Export session log"
            >
              <FileText size={16} />
              Export Session Log
              <span className="export-panel__btn-desc">
                Text file with timestamps and step history
              </span>
            </button>
          </div>
        </div>

        {/* Individual Steps Section */}
        {exportableSteps.length > 0 && (
          <div className="export-panel__section">
            <h4 className="export-panel__section-title">
              Individual Step Results ({exportableSteps.length})
            </h4>
            <div className="export-panel__step-list">
              {exportableSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className="export-panel__step-btn"
                  onClick={() => handleExportStep(step.id)}
                  aria-label={`Download ${step.name} result`}
                >
                  <Download size={14} />
                  <span className="export-panel__step-name">{step.name}</span>
                  {step.actualDurationSeconds !== undefined && (
                    <span className="export-panel__step-duration">
                      {step.actualDurationSeconds}s
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {exportableSteps.length === 0 && (
          <div className="export-panel__empty">
            <p>No completed steps with exportable data yet.</p>
            <p>Run some workflow steps to generate data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;
