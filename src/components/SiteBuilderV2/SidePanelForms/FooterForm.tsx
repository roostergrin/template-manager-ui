import React from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const FooterForm: React.FC = () => {
  const { data, updateData, setEditMode } = useLandingPage();

  return (
    <div className="side-panel-form">
      <button 
        className="side-panel-form__back-btn"
        onClick={() => setEditMode({ type: 'global' })}
      >
        ← Back to Settings
      </button>
      
      <h2 className="side-panel-form__title">Footer Section</h2>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Footer Content</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Copyright Text</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data['the-footer'].copyright.label}
            onChange={(e) => updateData('the-footer.copyright.label', e.target.value)}
            placeholder="© 2025 Your Company Name"
          />
        </div>
      </div>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Footer Colors</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Footer Background Color</label>
          <div className="side-panel-form__color-input">
            <input
              type="color"
              value={data.theme.colors.footer}
              onChange={(e) => updateData('theme.colors.footer', e.target.value)}
            />
            <input
              type="text"
              className="side-panel-form__input side-panel-form__input--small"
              value={data.theme.colors.footer}
              onChange={(e) => updateData('theme.colors.footer', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterForm;

