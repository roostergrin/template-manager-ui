import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const ImageTextForm: React.FC = () => {
  const { data, updateData, setEditMode } = useLandingPage();
  const sections = data.home.image_text?.sections || [];
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const handleAddSection = () => {
    const newSection = {
      image: {
        webp: '',
        jpg: '',
        alt: '',
      },
      title: '',
      body: '',
    };
    updateData('home.image_text.sections', [...sections, newSection]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    updateData('home.image_text.sections', newSections);
  };

  const handleUpdateSection = (index: number, field: string, value: string) => {
    const newSections = [...sections];
    const keys = field.split('.');
    let current: any = newSections[index];
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    updateData('home.image_text.sections', newSections);
  };

  return (
    <div className="side-panel-form">
      <button 
        className="side-panel-form__back-btn"
        onClick={() => setEditMode({ type: 'global' })}
      >
        ← Back to Settings
      </button>
      
      <h2 className="side-panel-form__title">Image & Text Section</h2>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Overall Title</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Section Title (Optional)</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.image_text?.title || ''}
            onChange={(e) => updateData('home.image_text.title', e.target.value)}
            placeholder="Why Choose Our Practice?"
          />
        </div>
      </div>

      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Content Sections</h3>
        
        <div className="side-panel-form__logos-list">
          {sections.map((section, index) => (
            <div key={index} className="side-panel-form__logo-item">
              <div className="side-panel-form__logo-header">
                <button
                  className="side-panel-form__logo-expand"
                  onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                >
                  <span className="side-panel-form__logo-number">{index + 1}</span>
                  <span className="side-panel-form__logo-title">
                    {section.title || `Section ${index + 1}`}
                  </span>
                  <span className="side-panel-form__logo-arrow">
                    {expandedSection === index ? '▼' : '▶'}
                  </span>
                </button>
                <button
                  className="side-panel-form__logo-remove"
                  onClick={() => handleRemoveSection(index)}
                  aria-label="Remove section"
                >
                  ✕
                </button>
              </div>

              {expandedSection === index && (
                <div className="side-panel-form__logo-content">
                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Section Title</label>
                    <input
                      type="text"
                      className="side-panel-form__input"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                      placeholder="State-of-the-Art Technology"
                    />
                  </div>

                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Body Content</label>
                    <textarea
                      className="side-panel-form__textarea"
                      value={section.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n').trim()}
                      onChange={(e) => {
                        const paragraphs = e.target.value.split('\n\n').filter(p => p.trim());
                        const htmlBody = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
                        handleUpdateSection(index, 'body', htmlBody);
                      }}
                      rows={6}
                      placeholder="Enter content... Use double line breaks for new paragraphs."
                    />
                    <span className="side-panel-form__hint">
                      Separate paragraphs with double line breaks
                    </span>
                  </div>

                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Image URL (WebP)</label>
                    <input
                      type="url"
                      className="side-panel-form__input"
                      value={section.image?.webp || ''}
                      onChange={(e) => handleUpdateSection(index, 'image.webp', e.target.value)}
                      placeholder="https://example.com/image.webp"
                    />
                  </div>

                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Image URL (JPG Fallback)</label>
                    <input
                      type="url"
                      className="side-panel-form__input"
                      value={section.image?.jpg || ''}
                      onChange={(e) => handleUpdateSection(index, 'image.jpg', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="side-panel-form__field">
                    <label className="side-panel-form__label">Image Alt Text</label>
                    <input
                      type="text"
                      className="side-panel-form__input"
                      value={section.image?.alt || ''}
                      onChange={(e) => handleUpdateSection(index, 'image.alt', e.target.value)}
                      placeholder="Describe the image for accessibility"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          className="side-panel-form__add-item-btn"
          onClick={handleAddSection}
        >
          + Add Section
        </button>
      </div>
    </div>
  );
};

export default ImageTextForm;

