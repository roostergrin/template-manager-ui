import React, { useState } from 'react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import './Step4Customize.sass';

const Step4Customize: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const [primaryColor, setPrimaryColor] = useState('#4299e1');
  const [secondaryColor, setSecondaryColor] = useState('#48bb78');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const themePresets = [
    { id: 'professional-blue', name: 'Professional Blue', primary: '#1e40af', secondary: '#3b82f6' },
    { id: 'warm-healthcare', name: 'Warm Healthcare', primary: '#dc2626', secondary: '#f59e0b' },
    { id: 'modern-minimal', name: 'Modern Minimal', primary: '#0f172a', secondary: '#64748b' },
  ];

  const handlePresetSelect = (preset: typeof themePresets[0]) => {
    setSelectedPreset(preset.id);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    actions.setThemeSettings({
      colors: { primary: preset.primary, secondary: preset.secondary },
    });
  };

  const handleContinue = () => {
    actions.setThemeSettings({
      colors: { primary: primaryColor, secondary: secondaryColor },
    });
    actions.nextStep();
  };

  return (
    <div className="step-4-customize">
      <div className="customize-layout">
        {/* Left: Preview Placeholder */}
        <div className="customize-layout__preview">
          <div className="preview-frame">
            <div className="preview-header">
              <div className="preview-controls">
                <span className="preview-dot"></span>
                <span className="preview-dot"></span>
                <span className="preview-dot"></span>
              </div>
              <div className="preview-url">yoursite.com</div>
            </div>
            <div className="preview-content">
              <div className="preview-placeholder">
                <p>🎨 Live Preview Placeholder</p>
                <p className="preview-note">Theme changes will be reflected here in real-time</p>
                <div className="preview-color-demo" style={{ background: primaryColor }}>
                  Primary Color
                </div>
                <div className="preview-color-demo" style={{ background: secondaryColor }}>
                  Secondary Color
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customization Panel */}
        <div className="customize-layout__controls">
          <div className="customize-section">
            <h3 className="customize-section__title">🎨 Quick Theme Presets</h3>
            <div className="theme-presets">
              {themePresets.map(preset => (
                <div
                  key={preset.id}
                  className={`theme-preset ${selectedPreset === preset.id ? 'theme-preset--active' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="theme-preset__colors">
                    <span className="color-dot" style={{ background: preset.primary }}></span>
                    <span className="color-dot" style={{ background: preset.secondary }}></span>
                  </div>
                  <span className="theme-preset__name">{preset.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="customize-section">
            <h3 className="customize-section__title">🎨 Fine-Tune Colors</h3>
            <div className="color-pickers">
              <div className="color-picker">
                <label htmlFor="primary-color">Primary Color</label>
                <div className="color-picker__input">
                  <input
                    type="color"
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedPreset(null);
                    }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="color-picker__hex"
                  />
                </div>
              </div>

              <div className="color-picker">
                <label htmlFor="secondary-color">Secondary Color</label>
                <div className="color-picker__input">
                  <input
                    type="color"
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedPreset(null);
                    }}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="color-picker__hex"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="customize-section">
            <h3 className="customize-section__title">📝 Font Pairs (Coming Soon)</h3>
            <p className="placeholder-text">Font selection will be available here</p>
          </div>

          <div className="customize-section">
            <h3 className="customize-section__title">📷 Logo Upload (Coming Soon)</h3>
            <p className="placeholder-text">Logo upload will be available here</p>
          </div>

          <div className="customize-actions">
            <button className="btn btn--secondary" onClick={actions.previousStep}>
              ← Back
            </button>
            <button className="btn btn--primary" onClick={handleContinue}>
              Continue to Launch →
            </button>
          </div>
        </div>
      </div>

      {state.scrapedContent && (
        <div className="auto-detected-info">
          <h4>🔍 Auto-Detected from Your Site:</h4>
          <p>Placeholder: Colors and fonts auto-detected from scraped content would appear here</p>
        </div>
      )}
    </div>
  );
};

export default Step4Customize;
