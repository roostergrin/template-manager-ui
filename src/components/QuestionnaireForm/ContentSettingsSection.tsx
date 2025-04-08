import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface ContentSettingsSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ContentSettingsSection: React.FC<ContentSettingsSectionProps> = ({
  formData,
  handleChange
}) => {
  return (
    <div className="form-section">
      <div className="form-group">
        <label>
          Content Creation:
          <p className="question-text">How would you like to handle content creation?</p>
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="contentCreation"
              value="new"
              checked={formData.contentCreation === 'new'}
              onChange={handleChange}
            />
            Create all new content
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="contentCreation"
              value="prior"
              checked={formData.contentCreation === 'prior'}
              onChange={handleChange}
            />
            Use prior content as reference
          </label>
        </div>
      </div>
      
      <div className="form-group">
        <label>
          Blog:
          <p className="question-text">Would you like to include a blog?</p>
        </label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="hasBlog"
              checked={formData.hasBlog}
              onChange={handleChange}
            />
            Include a blog
          </label>
        </div>
        
        {formData.hasBlog && (
          <div className="form-group nested">
            <label htmlFor="blogType">
              Blog Type:
              <p className="question-text">What type of blog content would you like?</p>
            </label>
            <input
              type="text"
              id="blogType"
              name="blogType"
              value={formData.blogType}
              onChange={handleChange}
              placeholder="E.g., Educational, Patient Stories, etc."
            />
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="topTreatments">
          Top Treatments:
          <p className="question-text">What are your top treatments/services to highlight?</p>
        </label>
        <textarea
          id="topTreatments"
          name="topTreatments"
          value={formData.topTreatments}
          onChange={handleChange}
          rows={3}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="topicsToAvoid">
          Topics to Avoid:
          <p className="question-text">Are there any topics you prefer not to emphasize?</p>
        </label>
        <textarea
          id="topicsToAvoid"
          name="topicsToAvoid"
          value={formData.topicsToAvoid}
          onChange={handleChange}
          rows={2}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="communityEngagement">
          Community Engagement:
          <p className="question-text">How does your practice engage with the local community?</p>
        </label>
        <textarea
          id="communityEngagement"
          name="communityEngagement"
          value={formData.communityEngagement}
          onChange={handleChange}
          rows={2}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="testimonials">
          Patient Testimonials:
          <p className="question-text">Do you have any patient testimonials to highlight?</p>
        </label>
        <textarea
          id="testimonials"
          name="testimonials"
          value={formData.testimonials}
          onChange={handleChange}
          rows={2}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="patientExperience">
          Patient Experience:
          <p className="question-text">Describe the typical patient experience at your practice:</p>
        </label>
        <textarea
          id="patientExperience"
          name="patientExperience"
          value={formData.patientExperience}
          onChange={handleChange}
          rows={2}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="financialOptions">
          Financial Options:
          <p className="question-text">What financial options do you offer?</p>
        </label>
        <textarea
          id="financialOptions"
          name="financialOptions"
          value={formData.financialOptions}
          onChange={handleChange}
          rows={2}
        />
      </div>
    </div>
  );
};

export default ContentSettingsSection; 