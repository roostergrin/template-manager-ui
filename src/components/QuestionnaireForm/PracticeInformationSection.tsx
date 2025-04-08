import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface PracticeInformationSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const PracticeInformationSection: React.FC<PracticeInformationSectionProps> = ({ 
  formData, 
  handleChange 
}) => {
  return (
    <div className="form-section">
      <h3>Practice Information</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="practiceName">
            Practice Name:
            <p className="question-text">What is your practice name?</p>
          </label>
          <input
            type="text"
            id="practiceName"
            name="practiceName"
            value={formData.practiceName}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="orthodontistName">
            Orthodontist Name:
            <p className="question-text">What is the orthodontist's name and credentials?</p>
          </label>
          <input
            type="text"
            id="orthodontistName"
            name="orthodontistName"
            value={formData.orthodontistName}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="uniqueQualities">
          Competitive Advantage & Unique Qualities:
          <p className="question-text">What makes your practice stand out from competitors?</p>
        </label>
        <textarea
          id="uniqueQualities"
          name="uniqueQualities"
          value={formData.uniqueQualities}
          onChange={handleChange}
          rows={4}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="siteVision">
          Site Vision:
          <p className="question-text">What is the overall purpose and vision for your site?</p>
        </label>
        <textarea
          id="siteVision"
          name="siteVision"
          value={formData.siteVision}
          onChange={handleChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default PracticeInformationSection; 