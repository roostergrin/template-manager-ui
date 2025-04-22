import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface VisualPreferencesSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const VisualPreferencesSection: React.FC<VisualPreferencesSectionProps> = ({ formData, handleChange }) => (
  <div className="visual-preferences-section">
    <h3 className="visual-preferences-section__header">Visual Preferences & Inspiration</h3>
    <div className="visual-preferences-section__group">
      <label>Select up to 3 Brand Adjectives</label>
      <input type="text" name="websiteAdjectives" value={formData.websiteAdjectives || ''} onChange={handleChange} placeholder="E.g. Modern, Friendly, Clean" />
    </div>
    <div className="visual-preferences-section__group">
      <label>Websites You Love & Why</label>
      <textarea name="websitesYouLove" value={formData.websitesYouLove || ''} onChange={handleChange} placeholder="List websites and what you like about them" />
    </div>
    <div className="visual-preferences-section__group">
      <label>Preferred Photography Style</label>
      <input type="text" name="preferredPhotographyStyle" value={formData.preferredPhotographyStyle || ''} onChange={handleChange} />
    </div>
    <div className="visual-preferences-section__group">
      <label>Upload Collateral to Match</label>
      <input type="file" name="collateralUpload" multiple />
    </div>
  </div>
);

export default VisualPreferencesSection; 