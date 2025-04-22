import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface PracticeContactBasicsSectionProps {
  formData: QuestionnaireData['contact'];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const PracticeContactBasicsSection: React.FC<PracticeContactBasicsSectionProps> = ({ formData, handleChange }) => (
  <div className="form-section">
    <h3>Practice & Contact Basics</h3>
    <div className="form-group">
      <label>Practice Name</label>
      <input type="text" name="practiceName" data-section="contact" value={formData.practiceName || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Orthodontist Name</label>
      <input type="text" name="orthodontistName" data-section="contact" value={formData.orthodontistName || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Office Phone Number</label>
      <input type="tel" name="phone" data-section="contact" value={formData.phone || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Public Email Address</label>
      <input type="email" name="email" data-section="contact" value={formData.email || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Street Address</label>
      <input type="text" name="address" data-section="contact" value={formData.address || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Suite / Unit</label>
      <input type="text" name="suite" data-section="contact" value={formData.suite || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>City & State</label>
      <input type="text" name="cityState" data-section="contact" value={formData.cityState || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Google Maps Link</label>
      <input type="url" name="googleMapsLink" data-section="contact" value={formData.googleMapsLink || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Business Hours</label>
      <input type="text" name="businessHours" data-section="contact" value={formData.businessHours || ''} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Special Notes / Amenities</label>
      <textarea name="specialNotes" data-section="contact" value={formData.specialNotes || ''} onChange={handleChange} />
    </div>
  </div>
);

export default PracticeContactBasicsSection; 