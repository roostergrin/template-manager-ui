import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface GetStartedPatientInfoSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const GetStartedPatientInfoSection: React.FC<GetStartedPatientInfoSectionProps> = ({ formData, handleChange }) => (
  <div className="get-started-patient-info-section">
    <h3 className="get-started-patient-info-section__header">Get Started & Patient Info</h3>
    <div className="get-started-patient-info-section__group">
      <label>Describe First-Visit Experience</label>
      <textarea name="patientExperience" value={formData.patientExperience || ''} onChange={handleChange} />
    </div>
    <div className="get-started-patient-info-section__group">
      <label>Financing / Insurance Overview</label>
      <textarea name="financialOptions" value={formData.financialOptions || ''} onChange={handleChange} />
    </div>
    <div className="get-started-patient-info-section__group">
      <label>Do You Have Patient Forms?</label>
      <div>
        <label>
          <input type="radio" name="hasPatientForms" value="yes" checked={formData.hasPatientForms === 'yes'} onChange={handleChange} /> Yes
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="hasPatientForms" value="no" checked={formData.hasPatientForms === 'no'} onChange={handleChange} /> No
        </label>
      </div>
    </div>
    <div className="get-started-patient-info-section__group">
      <label>Forms URL (if online)</label>
      <input type="url" name="formsUrl" value={formData.formsUrl || ''} onChange={handleChange} />
    </div>
    <div className="get-started-patient-info-section__group">
      <label>Upload PDF Patient Forms</label>
      <input type="file" name="patientFormsUpload" multiple />
    </div>
  </div>
);

export default GetStartedPatientInfoSection; 