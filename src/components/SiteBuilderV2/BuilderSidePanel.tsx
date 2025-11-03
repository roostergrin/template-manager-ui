import React from 'react';
import './BuilderSidePanel.sass';
import { useLandingPage } from './LandingPageContext';
import GlobalSettingsForm from './SidePanelForms/GlobalSettingsForm';
import HeroForm from './SidePanelForms/HeroForm';
import ContactForm from './SidePanelForms/ContactForm';
import FooterForm from './SidePanelForms/FooterForm';
import LogosForm from './SidePanelForms/LogosForm';
import ImageTextForm from './SidePanelForms/ImageTextForm';

interface BuilderSidePanelProps {
  projectType: 'landing-page' | 'website';
  isCollapsed: boolean;
  onToggle: () => void;
}

const BuilderSidePanel: React.FC<BuilderSidePanelProps> = ({ 
  projectType, 
  isCollapsed, 
  onToggle 
}) => {
  const { editMode, setEditMode } = useLandingPage();

  const handleBackToGlobal = () => {
    setEditMode({ type: 'global' });
  };

  return (
    <aside className={`builder-side-panel ${isCollapsed ? 'builder-side-panel--collapsed' : ''}`}>
      <button
        className="builder-side-panel__toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      <div className="builder-side-panel__content">
        {projectType === 'landing-page' ? (
          <>
            {editMode.type === 'global' && <GlobalSettingsForm />}
            {editMode.type === 'hero' && <HeroForm />}
            {editMode.type === 'contact' && <ContactForm />}
            {editMode.type === 'footer' && <FooterForm />}
            {editMode.type === 'logos' && <LogosForm />}
            {editMode.type === 'image-text' && <ImageTextForm />}
          </>
        ) : (
          <>
            <h2 className="builder-side-panel__title">Website Builder</h2>
            <p className="builder-side-panel__description">
              Create a complete multi-page website
            </p>
            
            <div className="builder-side-panel__section">
              <h3 className="builder-side-panel__section-title">Pages</h3>
              <div className="builder-side-panel__list">
                <button className="builder-side-panel__item builder-side-panel__item--active">
                  <span className="builder-side-panel__item-icon">🏠</span>
                  <span className="builder-side-panel__item-text">Home</span>
                </button>
                <button className="builder-side-panel__item">
                  <span className="builder-side-panel__item-icon">ℹ️</span>
                  <span className="builder-side-panel__item-text">About</span>
                </button>
                <button className="builder-side-panel__item">
                  <span className="builder-side-panel__item-icon">⚙️</span>
                  <span className="builder-side-panel__item-text">Services</span>
                </button>
                <button className="builder-side-panel__item">
                  <span className="builder-side-panel__item-icon">📧</span>
                  <span className="builder-side-panel__item-text">Contact</span>
                </button>
              </div>
              
              <button className="builder-side-panel__add-btn">
                <span>+</span> Add Page
              </button>
            </div>

            <div className="builder-side-panel__section">
              <h3 className="builder-side-panel__section-title">Navigation</h3>
              <div className="builder-side-panel__list">
                <button className="builder-side-panel__item">
                  <span className="builder-side-panel__item-icon">📱</span>
                  <span className="builder-side-panel__item-text">Header</span>
                </button>
                <button className="builder-side-panel__item">
                  <span className="builder-side-panel__item-icon">👣</span>
                  <span className="builder-side-panel__item-text">Footer</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default BuilderSidePanel;

