import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const HeroForm: React.FC = () => {
  const { data, updateData, setEditMode } = useLandingPage();
  const [logoFile, setLogoFile] = useState<string>('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoFile(file.name);
        updateData('global-data.logo', base64String);
      };
      reader.readAsDataURL(file);
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
      
      <h2 className="side-panel-form__title">Hero Section</h2>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Hero Content</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Tagline</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.hero?.tagline || ''}
            onChange={(e) => updateData('home.hero.tagline', e.target.value)}
            placeholder="Main headline"
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Logo</label>
          <div className="side-panel-form__file-upload">
            <input
              type="file"
              id="logo-upload-hero"
              className="side-panel-form__file-input"
              accept="image/svg+xml"
              onChange={handleLogoUpload}
            />
            <label htmlFor="logo-upload-hero" className="side-panel-form__file-label">
              <span className="side-panel-form__file-icon">📁</span>
              <span className="side-panel-form__file-text">
                {logoFile || data['global-data'].logo ? (logoFile || 'Logo uploaded') : 'Choose logo file'}
              </span>
            </label>
            {(logoFile || data['global-data'].logo) && (
              <button 
                className="side-panel-form__file-clear"
                onClick={() => {
                  setLogoFile('');
                  updateData('global-data.logo', '');
                }}
              >
                ✕
              </button>
            )}
          </div>
          <span className="side-panel-form__hint">Upload SVG</span>
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Secondary Tagline (Optional)</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.hero?.secondary_tagline || ''}
            onChange={(e) => updateData('home.hero.secondary_tagline', e.target.value)}
            placeholder="Subheadline"
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Button Text</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.hero?.button || 'Contact Us'}
            onChange={(e) => updateData('home.hero.button', e.target.value)}
            placeholder="Contact Us"
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Background Image URL</label>
          <input
            type="url"
            className="side-panel-form__input"
            value={data.home.hero?.image?.webp || 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-bg-3.jpg'}
            onChange={(e) => {
              updateData('home.hero.image.webp', e.target.value);
              updateData('home.hero.image.jpg', e.target.value);
            }}
            placeholder="https://example.com/hero-image.jpg"
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Image Alt Text</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.hero?.image?.alt || 'Smiling Woman'}
            onChange={(e) => updateData('home.hero.image.alt', e.target.value)}
            placeholder="Describe the image"
          />
        </div>
      </div>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Hero Colors</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Hero Text Color</label>
          <div className="side-panel-form__color-input">
            <input
              type="color"
              value={data.theme.colors.heroText}
              onChange={(e) => updateData('theme.colors.heroText', e.target.value)}
            />
            <input
              type="text"
              className="side-panel-form__input side-panel-form__input--small"
              value={data.theme.colors.heroText}
              onChange={(e) => updateData('theme.colors.heroText', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroForm;

