import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface BrandIdentitySectionProps {
  formData: QuestionnaireData['brand'];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const BrandIdentitySection: React.FC<BrandIdentitySectionProps> = ({ formData, handleChange }) => (
  <div className="form-section">
    <h3>Brand Identity</h3>
    <div className="form-group">
      <label>Brand Color</label>
      <input type="text" name="brandColor" data-section="brand" value={formData.brandColor || ''} onChange={handleChange} placeholder="#4d4ec1" />
    </div>
    <div className="form-group">
      <label>Accent Color</label>
      <input type="text" name="accentColor" data-section="brand" value={formData.accentColor || ''} onChange={handleChange} placeholder="#fbbf24" />
    </div>
    <div className="form-group">
      <label>Heading Font</label>
      <input type="text" name="headingFont" data-section="brand" value={formData.headingFont || ''} onChange={handleChange} placeholder="Montserrat" />
    </div>
    <div className="form-group">
      <label>Body Font</label>
      <input type="text" name="bodyFont" data-section="brand" value={formData.bodyFont || ''} onChange={handleChange} placeholder="Open Sans" />
    </div>
    <div className="form-group">
      <label>Instagram</label>
      <input type="text" name="instagram" data-section="brand" value={formData.instagram || ''} onChange={handleChange} placeholder="@yourpractice" />
    </div>
    <div className="form-group">
      <label>Google Review Link</label>
      <input type="text" name="googleReviewLink" data-section="brand" value={formData.googleReviewLink || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Mission Statement</label>
      <textarea name="missionStatement" data-section="brand" value={formData.missionStatement || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Community Involvement</label>
      <textarea name="communityInvolvement" data-section="brand" value={formData.communityInvolvement || ''} onChange={handleChange} />
    </div>
    {/* Add file upload fields if needed */}
  </div>
);

export default BrandIdentitySection; 