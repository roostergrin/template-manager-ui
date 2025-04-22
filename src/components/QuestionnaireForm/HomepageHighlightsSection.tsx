import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface HomepageHighlightsSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const HomepageHighlightsSection: React.FC<HomepageHighlightsSectionProps> = ({ formData, handleChange }) => (
  <div className="form-section">
    <h3>Homepage Highlights</h3>
    <div className="form-group">
      <label>One-sentence Welcome Message / Tagline</label>
      <textarea name="siteVision" value={formData.siteVision || ''} onChange={handleChange} rows={2} />
    </div>
    <div className="form-group">
      <label>Top 3 Reasons to Choose Your Practice</label>
      <textarea name="topReasons" value={formData.topReasons || ''} onChange={handleChange} rows={3} placeholder="List your top reasons, one per line" />
    </div>
    <div className="form-group">
      <label>Doctor Bio (2-3 sentences)</label>
      <textarea name="doctorBio" value={formData.doctorBio || ''} onChange={handleChange} rows={3} />
    </div>
    <div className="form-group">
      <label>Top 3 Signature Treatments</label>
      <textarea name="topTreatments" value={formData.topTreatments || ''} onChange={handleChange} rows={2} />
    </div>
    <div className="form-group">
      <label>Favorite Patient Testimonials</label>
      <textarea name="testimonials" value={formData.testimonials || ''} onChange={handleChange} rows={3} />
    </div>
    <div className="form-group">
      <label>Instagram Handle or Hashtag</label>
      <input type="text" name="instagram" value={formData.instagram || ''} onChange={handleChange} />
    </div>
  </div>
);

export default HomepageHighlightsSection; 