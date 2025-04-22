import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface ReviewsSocialProofSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ReviewsSocialProofSection: React.FC<ReviewsSocialProofSectionProps> = ({ formData, handleChange }) => (
  <div className="reviews-social-proof-section">
    <h3 className="reviews-social-proof-section__header">Reviews & Social Proof</h3>
    <div className="reviews-social-proof-section__group">
      <label>Which Review Platform to Feature?</label>
      <input type="text" name="reviewPlatform" value={formData.reviewPlatform || ''} onChange={handleChange} />
    </div>
    <div className="reviews-social-proof-section__group">
      <label>Link to Review Profile(s)</label>
      <textarea name="reviewLinks" value={formData.reviewLinks || ''} onChange={handleChange} placeholder="Paste links, one per line" />
    </div>
  </div>
);

export default ReviewsSocialProofSection; 