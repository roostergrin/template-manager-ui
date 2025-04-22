import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface TreatmentsOfferedSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const TreatmentsOfferedSection: React.FC<TreatmentsOfferedSectionProps> = ({ formData, handleChange }) => (
  <div className="treatments-offered-section">
    <h3 className="treatments-offered-section__header">Treatments Offered</h3>
    <div className="treatments-offered-section__group">
      <label>Which Treatments Do You Offer?</label>
      <textarea name="treatmentsOffered" value={formData.treatmentsOffered || ''} onChange={handleChange} rows={3} placeholder="List treatments, one per line or as a grid" />
    </div>
    <div className="treatments-offered-section__group">
      <label>One-sentence Pitch per Selected Treatment</label>
      <textarea name="treatmentPitches" value={formData.treatmentPitches || ''} onChange={handleChange} rows={4} placeholder="List pitches, one per line" />
    </div>
  </div>
);

export default TreatmentsOfferedSection; 