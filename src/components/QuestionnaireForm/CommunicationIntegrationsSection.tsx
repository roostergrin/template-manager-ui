import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface CommunicationIntegrationsSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const CommunicationIntegrationsSection: React.FC<CommunicationIntegrationsSectionProps> = ({ formData, handleChange }) => (
  <div className="communication-integrations-section">
    <h3 className="communication-integrations-section__header">Communication & Integrations</h3>
    <div className="communication-integrations-section__group">
      <label>Rank Preferred Contact Methods</label>
      <textarea name="preferredContactMethods" value={formData.preferredContactMethods || ''} onChange={handleChange} placeholder="List or rank your preferred contact methods" />
    </div>
    <div className="communication-integrations-section__group">
      <label>SMS Number (if different)</label>
      <input type="tel" name="smsNumber" value={formData.smsNumber || ''} onChange={handleChange} />
    </div>
    <div className="communication-integrations-section__group">
      <label>Do You Embed Chat Widgets or Pop-ups?</label>
      <div>
        <label>
          <input type="radio" name="embedChat" value="yes" checked={formData.embedChat === 'yes'} onChange={handleChange} /> Yes
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="embedChat" value="no" checked={formData.embedChat === 'no'} onChange={handleChange} /> No
        </label>
      </div>
    </div>
    <div className="communication-integrations-section__group">
      <label>Widget Code / Provider Name</label>
      <textarea name="widgetCode" value={formData.widgetCode || ''} onChange={handleChange} />
    </div>
  </div>
);

export default CommunicationIntegrationsSection; 