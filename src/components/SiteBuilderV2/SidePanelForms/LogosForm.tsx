import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const LogosForm: React.FC = () => {
  const { data, updateData, setEditMode } = useLandingPage();
  const logos = data.home.banner?.logos || [];
  const [expandedLogo, setExpandedLogo] = useState<number | null>(null);

  const presetSVGs = [
    'invisalign',
    'invisalign-teen',
    'aa',
    'aao',
    'abo',
  ];

  const handleAddLogo = () => {
    const newLogo = {
      format: 'svg',
      icon: '',
      alt: '',
    };
    updateData('home.banner.logos', [...logos, newLogo]);
  };

  const handleRemoveLogo = (index: number) => {
    const newLogos = logos.filter((_, i) => i !== index);
    updateData('home.banner.logos', newLogos);
  };

  const handleUpdateLogo = (index: number, field: string, value: string) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], [field]: value };
    updateData('home.banner.logos', newLogos);
  };

  const handleSVGUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Extract filename without .svg extension
      const fileName = file.name.replace(/\.svg$/i, '');
      handleUpdateLogo(index, 'icon', fileName);
      
      console.log('SVG uploaded:', fileName);
    }
  };

  return (
    <div className="side-panel-form">
      <button 
        className="side-panel-form__back-btn"
        onClick={() => setEditMode({ type: 'global' })}
      >
        ← Back to Settings
      </button>
      
      <h2 className="side-panel-form__title">Logo Banner Section</h2>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Organization Logos</h3>
        
        <div className="side-panel-form__logos-list">
          {logos.map((logo, index) => (
            <div key={index} className="side-panel-form__logo-item">
              <div className="side-panel-form__logo-header">
                <button
                  className="side-panel-form__logo-expand"
                  onClick={() => setExpandedLogo(expandedLogo === index ? null : index)}
                >
                  <span className="side-panel-form__logo-number">{index + 1}</span>
                  <span className="side-panel-form__logo-title">
                    {logo.alt || `Logo ${index + 1}`}
                  </span>
                  <span className="side-panel-form__logo-arrow">
                    {expandedLogo === index ? '▼' : '▶'}
                  </span>
                </button>
                <button
                  className="side-panel-form__logo-remove"
                  onClick={() => handleRemoveLogo(index)}
                  aria-label="Remove logo"
                >
                  ✕
                </button>
              </div>

              {expandedLogo === index && (
                <div className="side-panel-form__logo-content">
                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Alt Text</label>
                    <input
                      type="text"
                      className="side-panel-form__input"
                      value={logo.alt}
                      onChange={(e) => handleUpdateLogo(index, 'alt', e.target.value)}
                      placeholder="Logo description"
                    />
                  </div>

                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Format</label>
                    <div className="side-panel-form__radio-group">
                      <label className="side-panel-form__radio">
                        <input
                          type="radio"
                          name={`format-${index}`}
                          value="svg"
                          checked={logo.format === 'svg'}
                          onChange={(e) => handleUpdateLogo(index, 'format', e.target.value)}
                        />
                        <span>SVG File</span>
                      </label>
                      <label className="side-panel-form__radio">
                        <input
                          type="radio"
                          name={`format-${index}`}
                          value="link"
                          checked={logo.format === 'link'}
                          onChange={(e) => handleUpdateLogo(index, 'format', e.target.value)}
                        />
                        <span>Image URL</span>
                      </label>
                    </div>
                  </div>

                  {logo.format === 'svg' ? (
                    <>
                      <div className="side-panel-form__field">
                        <label className="side-panel-form__label">Upload SVG</label>
                        <div className="side-panel-form__file-upload">
                          <input
                            type="file"
                            id={`svg-upload-${index}`}
                            className="side-panel-form__file-input"
                            accept=".svg,image/svg+xml"
                            onChange={(e) => handleSVGUpload(index, e)}
                          />
                          <label htmlFor={`svg-upload-${index}`} className="side-panel-form__file-label">
                            <span className="side-panel-form__file-icon">📁</span>
                            <span className="side-panel-form__file-text">
                              {logo.icon ? `${logo.icon}.svg` : 'Choose SVG file'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="side-panel-form__divider">
                        <span>OR</span>
                      </div>

                      <div className="side-panel-form__field">
                        <label className="side-panel-form__label">Select Preset SVG</label>
                        <select
                          className="side-panel-form__select"
                          value={logo.icon}
                          onChange={(e) => handleUpdateLogo(index, 'icon', e.target.value)}
                        >
                          <option value="">Choose a preset...</option>
                          {presetSVGs.map((preset) => (
                            <option key={preset} value={preset}>
                              {preset.toUpperCase().replace(/-/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="side-panel-form__field">
                      <label className="side-panel-form__label">Image URL</label>
                      <input
                        type="url"
                        className="side-panel-form__input"
                        value={logo.icon}
                        onChange={(e) => handleUpdateLogo(index, 'icon', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          className="side-panel-form__add-item-btn"
          onClick={handleAddLogo}
        >
          + Add Logo
        </button>
      </div>
    </div>
  );
};

export default LogosForm;

