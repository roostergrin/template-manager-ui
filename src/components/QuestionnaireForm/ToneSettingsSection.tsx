import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface ToneSettingsSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOptionSelect: (field: string, value: string) => void;
  toggleAdjective: (adjective: string) => void;
  handleCustomAdjectiveChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addCustomAdjective: () => void;
  handleOtherAdjective: () => void;
  customFields: {
    primaryAudience: boolean;
    secondaryAudience: boolean;
    demographics: boolean;
    photography: boolean;
    adjectives: boolean;
  };
  selectedAdjectives: string[];
  customAdjective: string;
  audienceOptions: string[];
  demographicsOptions: string[];
  photographyOptions: string[];
  adjectiveOptions: string[];
}

const ToneSettingsSection: React.FC<ToneSettingsSectionProps> = ({
  formData,
  handleChange,
  handleOptionSelect,
  toggleAdjective,
  handleCustomAdjectiveChange,
  addCustomAdjective,
  handleOtherAdjective,
  customFields,
  selectedAdjectives,
  customAdjective,
  audienceOptions,
  demographicsOptions,
  photographyOptions,
  adjectiveOptions
}) => {
  return (
    <div className="form-section">
      {/* Primary Audience */}
      <div className="option-section">
        <label>
          Primary Audience:
          <p className="question-text">Who are the main users of your site?</p>
        </label>
        <div className="option-buttons">
          {audienceOptions.slice(0, 5).map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${formData.primaryAudience === option && !customFields.primaryAudience ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('primaryAudience', option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={`option-button ${customFields.primaryAudience ? 'selected' : ''}`}
            onClick={() => handleOptionSelect('primaryAudience', 'Other')}
          >
            Other
          </button>
        </div>
        {customFields.primaryAudience && (
          <input
            type="text"
            name="primaryAudience"
            value={formData.primaryAudience}
            onChange={handleChange}
            placeholder="Enter your primary audience..."
            className="custom-option-input"
            autoFocus
          />
        )}
      </div>
      
      {/* Secondary Audience */}
      <div className="option-section">
        <label>
          Secondary Audience:
          <p className="question-text">Who else will be using your site?</p>
        </label>
        <div className="option-buttons">
          {audienceOptions.slice(0, 5).map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${formData.secondaryAudience === option && !customFields.secondaryAudience ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('secondaryAudience', option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={`option-button ${customFields.secondaryAudience ? 'selected' : ''}`}
            onClick={() => handleOptionSelect('secondaryAudience', 'Other')}
          >
            Other
          </button>
        </div>
        {customFields.secondaryAudience && (
          <input
            type="text"
            name="secondaryAudience"
            value={formData.secondaryAudience}
            onChange={handleChange}
            placeholder="Enter your secondary audience..."
            className="custom-option-input"
            autoFocus
          />
        )}
      </div>
      
      {/* Demographics */}
      <div className="option-section">
        <label>
          Demographics:
          <p className="question-text">What are the key demographics of your clients?</p>
        </label>
        <div className="option-buttons">
          {demographicsOptions.slice(0, 3).map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${formData.demographics === option && !customFields.demographics ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('demographics', option)}
            >
              {option.split(' (')[0]}
            </button>
          ))}
          <button
            type="button"
            className={`option-button ${customFields.demographics ? 'selected' : ''}`}
            onClick={() => handleOptionSelect('demographics', 'Other')}
          >
            Other
          </button>
        </div>
        {customFields.demographics && (
          <input
            type="text"
            name="demographics"
            value={formData.demographics}
            onChange={handleChange}
            placeholder="Describe your client demographics..."
            className="custom-option-input"
            autoFocus
          />
        )}
      </div>
      
      {/* Writing Tone */}
      <div className="form-group">
        <label htmlFor="writingStyle">
          Writing Tone:
          <p className="question-text">What is your preferred writing style?</p>
        </label>
        <input
          type="text"
          id="writingStyle"
          name="writingStyle"
          value={formData.writingStyle}
          onChange={handleChange}
          placeholder="E.g., Professional but friendly"
        />
      </div>
      
      {/* Photography Style */}
      <div className="option-section">
        <label>
          Photography Style:
          <p className="question-text">What style of photography would you prefer?</p>
        </label>
        <div className="option-buttons">
          {photographyOptions.slice(0, 3).map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${formData.preferredPhotographyStyle === option && !customFields.photography ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('preferredPhotographyStyle', option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={`option-button ${customFields.photography ? 'selected' : ''}`}
            onClick={() => handleOptionSelect('preferredPhotographyStyle', 'Other')}
          >
            Other
          </button>
        </div>
        {customFields.photography && (
          <input
            type="text"
            name="preferredPhotographyStyle"
            value={formData.preferredPhotographyStyle}
            onChange={handleChange}
            placeholder="Describe your preferred style..."
            className="custom-option-input"
            autoFocus
          />
        )}
      </div>
      
      {/* Website Adjectives */}
      <div className="option-section">
        <label>
          Website Adjectives:
          <p className="question-text">How would you describe your ideal website? (Select multiple)</p>
        </label>
        <div className="option-buttons multi-select">
          {adjectiveOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${selectedAdjectives.includes(option) ? 'selected' : ''}`}
              onClick={() => toggleAdjective(option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={`option-button ${customFields.adjectives ? 'selected' : ''}`}
            onClick={handleOtherAdjective}
          >
            Other
          </button>
        </div>
        {customFields.adjectives && (
          <div className="custom-adjective-input">
            <input
              type="text"
              value={customAdjective}
              onChange={handleCustomAdjectiveChange}
              placeholder="Enter a custom adjective..."
              className="custom-option-input"
              autoFocus
            />
            <button 
              type="button" 
              className="add-adjective-button"
              onClick={addCustomAdjective}
            >
              Add
            </button>
          </div>
        )}
        {selectedAdjectives.length > 0 && (
          <div className="selected-adjectives">
            <p>Selected: {selectedAdjectives.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToneSettingsSection; 