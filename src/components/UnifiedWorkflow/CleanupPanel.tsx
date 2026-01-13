import React, { useState, useCallback, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle, XCircle, Loader, X, Info } from 'lucide-react';
import { useCleanup } from '../../hooks/useCleanup';

interface CleanupPanelProps {
  onClose: () => void;
}

const CleanupPanel: React.FC<CleanupPanelProps> = ({ onClose }) => {
  const {
    activeDomain,
    workflowDomain,
    customDomain,
    setCustomDomain,
    resetToWorkflowDomain,
    resourceList,
    isUsingDerivedResources,
    performCleanup,
    isCleaningUp,
    cleanupResult,
    clearCleanupResult,
  } = useCleanup();

  const [domainInput, setDomainInput] = useState(workflowDomain || '');
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === activeDomain && activeDomain.length > 0;

  // Update custom domain when input changes (with debounce effect)
  useEffect(() => {
    const trimmed = domainInput.trim();
    if (trimmed !== workflowDomain) {
      setCustomDomain(trimmed);
    } else {
      setCustomDomain('');
    }
  }, [domainInput, workflowDomain, setCustomDomain]);

  // Reset confirm text when domain changes
  useEffect(() => {
    setConfirmText('');
  }, [activeDomain]);

  const handleCleanup = useCallback(async () => {
    if (!isConfirmValid) return;
    await performCleanup();
  }, [isConfirmValid, performCleanup]);

  const handleClose = useCallback(() => {
    clearCleanupResult();
    resetToWorkflowDomain();
    onClose();
  }, [clearCleanupResult, resetToWorkflowDomain, onClose]);

  const handleUseWorkflowDomain = useCallback(() => {
    setDomainInput(workflowDomain);
    resetToWorkflowDomain();
  }, [workflowDomain, resetToWorkflowDomain]);

  return (
    <div className="cleanup-panel">
      <div className="cleanup-panel__header">
        <div className="cleanup-panel__header-left">
          <Trash2 size={20} />
          <h3>Cleanup Infrastructure</h3>
        </div>
        <button
          type="button"
          className="cleanup-panel__close-btn"
          onClick={handleClose}
          aria-label="Close cleanup panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="cleanup-panel__warning">
        <AlertTriangle size={24} />
        <div>
          <p>
            <strong>Warning:</strong> This will permanently delete all infrastructure
            for the specified domain.
          </p>
          <p>This action cannot be undone.</p>
        </div>
      </div>

      {/* Domain Input Section */}
      <div className="cleanup-panel__domain-section">
        <label className="cleanup-panel__domain-label">
          <span className="cleanup-panel__domain-label-text">
            Domain to clean up:
          </span>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="example.com"
            disabled={isCleaningUp || !!cleanupResult}
            className="cleanup-panel__domain-input"
          />
        </label>
        {workflowDomain && customDomain && (
          <button
            type="button"
            className="cleanup-panel__use-workflow-btn"
            onClick={handleUseWorkflowDomain}
            disabled={isCleaningUp || !!cleanupResult}
          >
            Use current: {workflowDomain}
          </button>
        )}
      </div>

      {/* Info about derived resources */}
      {activeDomain && isUsingDerivedResources && (
        <div className="cleanup-panel__derived-notice">
          <Info size={16} />
          <span>
            Resource names are derived from the domain pattern. CloudFront IDs are only
            available for the currently provisioned site.
          </span>
        </div>
      )}

      {/* Resources to be deleted */}
      <div className="cleanup-panel__resources">
        <h4>Resources to be deleted{activeDomain ? ` for ${activeDomain}` : ''}:</h4>
        {resourceList.length > 0 ? (
          <ul className="cleanup-panel__resources-list">
            {resourceList.map((resource, idx) => (
              <li key={idx} className={resource.derived ? 'cleanup-panel__resource--derived' : ''}>
                <span className="cleanup-panel__resource-type">{resource.type}:</span>
                <span className="cleanup-panel__resource-id">{resource.id}</span>
                {resource.derived && (
                  <span className="cleanup-panel__resource-derived-tag">derived</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="cleanup-panel__no-resources">
            {activeDomain
              ? 'No resources found to clean up.'
              : 'Enter a domain name above to see resources.'}
          </p>
        )}
      </div>

      {!cleanupResult && resourceList.length > 0 && (
        <div className="cleanup-panel__confirmation">
          <label className="cleanup-panel__confirm-label">
            Type <strong>{activeDomain}</strong> to confirm:
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={activeDomain}
              disabled={isCleaningUp}
              className="cleanup-panel__confirm-input"
            />
          </label>
          <button
            type="button"
            className="cleanup-panel__delete-btn"
            onClick={handleCleanup}
            disabled={!isConfirmValid || isCleaningUp}
          >
            {isCleaningUp ? (
              <>
                <Loader size={16} className="cleanup-panel__spinner" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete All Resources for {activeDomain}
              </>
            )}
          </button>
        </div>
      )}

      {cleanupResult && (
        <div
          className={`cleanup-panel__result ${
            cleanupResult.success
              ? 'cleanup-panel__result--success'
              : 'cleanup-panel__result--error'
          }`}
        >
          {cleanupResult.success ? (
            <>
              <CheckCircle size={24} />
              <div>
                <p><strong>All resources deleted successfully!</strong></p>
                {cleanupResult.deletedResources.length > 0 && (
                  <ul className="cleanup-panel__deleted-list">
                    {cleanupResult.deletedResources.map((resource, idx) => (
                      <li key={idx}>{resource}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle size={24} />
              <div>
                <p><strong>Some resources failed to delete:</strong></p>
                <ul className="cleanup-panel__failed-list">
                  {cleanupResult.failedResources.map((failed, idx) => (
                    <li key={idx}>
                      <strong>{failed.resource}:</strong> {failed.error}
                    </li>
                  ))}
                </ul>
                {cleanupResult.deletedResources.length > 0 && (
                  <>
                    <p><strong>Successfully deleted:</strong></p>
                    <ul className="cleanup-panel__deleted-list">
                      {cleanupResult.deletedResources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </>
          )}
          <button
            type="button"
            className="cleanup-panel__done-btn"
            onClick={handleClose}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default CleanupPanel;
