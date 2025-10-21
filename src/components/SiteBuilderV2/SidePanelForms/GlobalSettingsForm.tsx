import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const GlobalSettingsForm: React.FC = () => {
  const { data, updateData } = useLandingPage();
  const [activeStep, setActiveStep] = useState(1);
  const [faviconFile, setFaviconFile] = useState<string>('');

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFaviconFile(file.name);
        updateData('seo.favicon', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="side-panel-form">
      
      <div className="side-panel-form__steps">
        <button 
          className={`side-panel-form__step ${activeStep === 1 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(1)}
        >
          <span className="side-panel-form__step-number">1</span>
          <span className="side-panel-form__step-label">Site Info</span>
        </button>
        <button 
          className={`side-panel-form__step ${activeStep === 2 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(2)}
        >
          <span className="side-panel-form__step-number">2</span>
          <span className="side-panel-form__step-label">SEO</span>
        </button>
        <button 
          className={`side-panel-form__step ${activeStep === 3 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(3)}
        >
          <span className="side-panel-form__step-number">3</span>
          <span className="side-panel-form__step-label">Theme Colors</span>
        </button>
      </div>
      
      {activeStep === 1 && (
        <>
          <div className="side-panel-form__section">
            <h2 className="side-panel-form__title">Site Information</h2>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Company Name</label>
              <input
                type="text"
                className="side-panel-form__input"
                value={data['global-data'].title}
                onChange={(e) => updateData('global-data.title', e.target.value)}
              />
            </div>

            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Email</label>
              <input
                type="email"
                className="side-panel-form__input"
                value={data['global-data'].email.label}
                onChange={(e) => {
                  updateData('global-data.email.label', e.target.value);
                  updateData('global-data.email.href', `mailto:${e.target.value}`);
                }}
              />
            </div>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Phone</label>
              <input
                type="tel"
                className="side-panel-form__input"
                value={data['global-data'].phone.label}
                onChange={(e) => {
                  updateData('global-data.phone.label', e.target.value);
                  const cleanPhone = e.target.value.replace(/\D/g, '');
                  updateData('global-data.phone.href', `tel:+1${cleanPhone}`);
                }}
              />
            </div>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Address</label>
              <textarea
                className="side-panel-form__textarea"
                value={data['global-data'].address.label.replace(/<br>/g, '\n')}
                onChange={(e) => {
                  const labelWithBr = e.target.value.replace(/\n/g, '<br>');
                  updateData('global-data.address.label', labelWithBr);
                  const cleanAddress = e.target.value.replace(/\n/g, '+');
                  updateData('global-data.address.href', `https://maps.google.com/?q=${cleanAddress}`);
                }}
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      {activeStep === 2 && (
        <>
          
      <div className="side-panel-form__section">
        <h2 className="side-panel-form__title">SEO Settings</h2>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Page Title</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.seo.title}
            onChange={(e) => updateData('seo.title', e.target.value)}
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Meta Description</label>
          <textarea
            className="side-panel-form__textarea"
            value={data.seo.description}
            onChange={(e) => updateData('seo.description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Favicon</label>
          <div className="side-panel-form__file-upload">
            <input
              type="file"
              id="favicon-upload"
              className="side-panel-form__file-input"
              accept="image/x-icon,image/png,image/svg+xml"
              onChange={handleFaviconUpload}
            />
            <label htmlFor="favicon-upload" className="side-panel-form__file-label">
              <span className="side-panel-form__file-icon">🌐</span>
              <span className="side-panel-form__file-text">
                {faviconFile || data.seo.favicon ? (faviconFile || 'Favicon uploaded') : 'Choose favicon file'}
              </span>
            </label>
            {(faviconFile || data.seo.favicon) && (
              <button 
                className="side-panel-form__file-clear"
                onClick={() => {
                  setFaviconFile('');
                  updateData('seo.favicon', '');
                }}
              >
                ✕
              </button>
            )}
          </div>
          <span className="side-panel-form__hint">Upload .ico, .png, or .svg (recommended: 32x32px or 64x64px)</span>
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">GTM ID (Optional)</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.seo.gtmId || ''}
            onChange={(e) => updateData('seo.gtmId', e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
        </div>
      </div>
        </>
      )}

      {activeStep === 3 && (
        <>
          <div className="side-panel-form__section">
            <h2 className="side-panel-form__title">Theme Colors</h2>
        
        <div className="side-panel-form__color-grid">
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Primary Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.primary}
                onChange={(e) => updateData('theme.colors.primary', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.primary}
                onChange={(e) => updateData('theme.colors.primary', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Secondary Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.secondary}
                onChange={(e) => updateData('theme.colors.secondary', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.secondary}
                onChange={(e) => updateData('theme.colors.secondary', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Header Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.header}
                onChange={(e) => updateData('theme.colors.header', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.header}
                onChange={(e) => updateData('theme.colors.header', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Text Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.text}
                onChange={(e) => updateData('theme.colors.text', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.text}
                onChange={(e) => updateData('theme.colors.text', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Button Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.button}
                onChange={(e) => updateData('theme.colors.button', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.button}
                onChange={(e) => updateData('theme.colors.button', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Hover Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.hover}
                onChange={(e) => updateData('theme.colors.hover', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.hover}
                onChange={(e) => updateData('theme.colors.hover', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Background Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.background}
                onChange={(e) => updateData('theme.colors.background', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.background}
                onChange={(e) => updateData('theme.colors.background', e.target.value)}
              />
            </div>
          </div>
          
        </div>
      </div>
        </>
      )}
      
      <div className="side-panel-form__section">
        <button 
          className="side-panel-form__export-btn"
          onClick={() => {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'landing-page-data.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Build Landing Page
        </button>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;

