import React, { useState } from 'react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import './Step5Launch.sass';

const Step5Launch: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const [deploymentOption, setDeploymentOption] = useState<'preview' | 'download' | 'deploy' | null>(null);

  const handlePreview = () => {
    setDeploymentOption('preview');
    // Placeholder: Show preview iframe
  };

  const handleDownload = () => {
    setDeploymentOption('download');
    // Placeholder: Download site package
    alert('Download functionality coming soon!');
  };

  const handleDeploy = () => {
    setDeploymentOption('deploy');
    // Placeholder: Deploy to hosting
  };

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over? All progress will be lost.')) {
      actions.resetWizard();
    }
  };

  return (
    <div className="step-5-launch">
      <div className="step-5-launch__header">
        <h2 className="step-5-launch__title">🎉 Your New Site is Ready!</h2>
        <p className="step-5-launch__subtitle">
          We've successfully migrated your content and applied your customizations.
        </p>
      </div>

      <div className="launch-summary">
        <div className="summary-card">
          <div className="summary-card__icon">📄</div>
          <div className="summary-card__content">
            <h4>Pages Migrated</h4>
            <p className="summary-card__value">
              {state.scrapedContent?.pages.length || 0}
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__icon">🖼️</div>
          <div className="summary-card__content">
            <h4>Images Processed</h4>
            <p className="summary-card__value">
              {state.scrapedContent?.metadata.total_images || 0}
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__icon">🎨</div>
          <div className="summary-card__content">
            <h4>Theme Applied</h4>
            <p className="summary-card__value">
              {state.themeSettings.colors ? 'Custom' : 'Default'}
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__icon">📋</div>
          <div className="summary-card__content">
            <h4>Template</h4>
            <p className="summary-card__value">
              {state.selectedTemplate || 'Mirrored'}
            </p>
          </div>
        </div>
      </div>

      <div className="launch-actions">
        <div className="action-card" onClick={handlePreview}>
          <div className="action-card__icon">👁️</div>
          <h3 className="action-card__title">Preview Site</h3>
          <p className="action-card__description">
            View your new site in a live preview
          </p>
          <button className="btn btn--primary">Preview</button>
        </div>

        <div className="action-card" onClick={handleDownload}>
          <div className="action-card__icon">📦</div>
          <h3 className="action-card__title">Download Package</h3>
          <p className="action-card__description">
            Download your site files for self-hosting
          </p>
          <button className="btn btn--primary">Download</button>
        </div>

        <div className="action-card" onClick={handleDeploy}>
          <div className="action-card__icon">🚀</div>
          <h3 className="action-card__title">Deploy Now</h3>
          <p className="action-card__description">
            Deploy to GitHub, WordPress, or other platforms
          </p>
          <button className="btn btn--primary">Deploy</button>
        </div>
      </div>

      {deploymentOption === 'preview' && (
        <div className="preview-section">
          <div className="preview-section__header">
            <h3>Live Preview</h3>
            <button className="btn btn--secondary" onClick={() => setDeploymentOption(null)}>
              Close Preview
            </button>
          </div>
          <div className="preview-frame-container">
            <div className="preview-placeholder">
              <p>🖥️ Live Preview Placeholder</p>
              <p className="preview-note">Your site will be displayed here in an iframe</p>
            </div>
          </div>
        </div>
      )}

      {deploymentOption === 'deploy' && (
        <div className="deployment-options">
          <h3>Choose Deployment Platform</h3>
          <div className="platform-options">
            <div className="platform-option">
              <div className="platform-option__icon">
                <svg viewBox="0 0 16 16" width="32" height="32">
                  <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </div>
              <h4>GitHub Pages</h4>
              <p>Deploy to GitHub Pages for free hosting</p>
              <button className="btn btn--secondary">Coming Soon</button>
            </div>

            <div className="platform-option">
              <div className="platform-option__icon">📝</div>
              <h4>WordPress</h4>
              <p>Deploy to your WordPress site</p>
              <button className="btn btn--secondary">Coming Soon</button>
            </div>

            <div className="platform-option">
              <div className="platform-option__icon">☁️</div>
              <h4>Custom Server</h4>
              <p>Deploy to your own hosting</p>
              <button className="btn btn--secondary">Coming Soon</button>
            </div>
          </div>
        </div>
      )}

      <div className="launch-footer">
        <button className="btn btn--secondary" onClick={handleStartOver}>
          🔄 Start Over
        </button>
      </div>
    </div>
  );
};

export default Step5Launch;
