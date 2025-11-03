import React from 'react';
import { useLandingPage } from '../LandingPageContext';
import './SidePanelForms.sass';

const ContactForm: React.FC = () => {
  const { data, updateData, setEditMode } = useLandingPage();

  return (
    <div className="side-panel-form">
      <button 
        className="side-panel-form__back-btn"
        onClick={() => setEditMode({ type: 'global' })}
      >
        ← Back to Settings
      </button>
      
      <h2 className="side-panel-form__title">Form Section</h2>
      
      <div className="side-panel-form__section">
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Section Tagline</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.home.form?.tagline || ''}
            onChange={(e) => updateData('home.form.tagline', e.target.value)}
            placeholder="We'd love to hear from you!"
          />
        </div>
      </div>
      
      <div className="side-panel-form__section">
        <h3 className="side-panel-form__subtitle">Form Settings</h3>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Email Subject</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.form.subject}
            onChange={(e) => updateData('form.subject', e.target.value)}
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Sender Email</label>
          <input
            type="email"
            className="side-panel-form__input"
            value={data.form.sender}
            onChange={(e) => updateData('form.sender', e.target.value)}
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Recipient Email</label>
          <input
            type="email"
            className="side-panel-form__input"
            value={data.form.recipient}
            onChange={(e) => updateData('form.recipient', e.target.value)}
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">CC Recipients (Optional)</label>
          <div className="side-panel-form__repeater-list">
            {(data.form.cc || []).map((cc: any, index: number) => (
              <div key={index} className="side-panel-form__repeater-item">
                <input
                  type="email"
                  className="side-panel-form__input"
                  value={cc.recipient || ''}
                  onChange={(e) => {
                    const newCc = [...(data.form.cc || [])];
                    newCc[index] = { recipient: e.target.value };
                    updateData('form.cc', newCc);
                  }}
                  placeholder="email@example.com"
                />
                <button
                  className="side-panel-form__repeater-remove"
                  onClick={() => {
                    const newCc = (data.form.cc || []).filter((_: any, i: number) => i !== index);
                    updateData('form.cc', newCc);
                  }}
                  aria-label="Remove CC recipient"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button 
            className="side-panel-form__add-item-btn"
            onClick={() => {
              const newCc = [...(data.form.cc || []), { recipient: '' }];
              updateData('form.cc', newCc);
            }}
          >
            + Add CC Recipient
          </button>
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Opt-In Message (Optional)</label>
          <textarea
            className="side-panel-form__textarea"
            value={data.form.optIn?.message || ''}
            onChange={(e) => updateData('form.optIn.message', e.target.value)}
            rows={3}
            placeholder="By providing your phone number, you agree to receive text messages from Example Orthodontics. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out."
          />
          <span className="side-panel-form__hint">
            Leave empty to disable opt-in checkbox
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;

