import React, { useState, useEffect } from 'react';
import './QuestionnaireForm.sass';

// Import the separate section components
import PracticeInformationSection from './PracticeInformationSection';
import ToneSettingsSection from './ToneSettingsSection';
import ContentSettingsSection from './ContentSettingsSection';

interface QuestionnaireFormProps {
  onSubmit: (formData: QuestionnaireData) => void;
}

export interface QuestionnaireData {
  // Section A
  practiceName: string;
  orthodontistName: string;
  siteVision: string;
  uniqueQualities: string;
  primaryAudience: string;
  secondaryAudience: string;
  demographics: string;
  writingStyle: string;
  preferredPhotographyStyle: string;
  websiteAdjectives: string;
  
  // Section B
  contentCreation: 'new' | 'prior';
  hasBlog: boolean;
  blogType: string;
  topTreatments: string;
  topicsToAvoid: string;
  communityEngagement: string;
  testimonials: string;
  patientExperience: string;
  financialOptions: string;
}

// Common audience options
const audienceOptions = [
  'Parents',
  'Moms',
  'Dads',
  'Teenagers',
  'Young Adults',
  'Seniors',
  'Business Professionals',
  'Families',
  'Children',
  'Students',
  'Healthcare Professionals'
];

// Demographics options
const demographicsOptions = [
  'Family-oriented (25-45, middle to upper income)',
  'Young professionals (25-35, higher education, urban)',
  'Teens and parents (12-18 and 35-55)',
  'Adults seeking aesthetics (30-60, higher income)',
  'Diverse multicultural families (all ages)',
  'Suburban families (30-50, middle income)',
  'College students and young adults (18-25)',
  'Seniors and retirees (60+)',
  'Business professionals (30-60, higher education)'
];

// Photography style options
const photographyOptions = [
  'Lifestyle',
  'Clinical',
  'Documentary',
  'Candid',
  'Professional/Studio',
  'Mix of styles'
];

// Website adjective options
const adjectiveOptions = [
  'Modern',
  'Professional',
  'Friendly',
  'Approachable',
  'Clean',
  'Trustworthy',
  'Sophisticated',
  'Warm',
  'Inviting',
  'High-tech',
  'Compassionate',
  'Cutting-edge',
  'Innovative',
  'Reassuring'
];

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ onSubmit }) => {
  const defaultAdjectives = ['Modern', 'Professional', 'Friendly', 'Clean'];
  
  const [formData, setFormData] = useState<QuestionnaireData>({
    practiceName: 'Bright Smiles Orthodontics',
    orthodontistName: 'Dr. Sarah Johnson, DDS, MS, Board Certified Orthodontist',
    siteVision: 'To provide exceptional orthodontic care in a comfortable environment where patients feel valued and informed. Tagline: "Creating confident smiles for life."',
    uniqueQualities: 'We offer cutting-edge technology like Invisalign® for adults, flexible evening appointments, complimentary consultations, and a welcoming environment with a coffee bar and kids\' play area. Our team speaks both English and Spanish.',
    primaryAudience: 'Parents',
    secondaryAudience: 'Teenagers',
    demographics: 'Family-oriented (25-45, middle to upper income)',
    writingStyle: 'Professional but approachable tone, avoid overly technical jargon, warm and conversational while still being informative',
    preferredPhotographyStyle: 'Lifestyle',
    websiteAdjectives: defaultAdjectives.join(', '),
    
    contentCreation: 'new',
    hasBlog: false,
    blogType: '',
    topTreatments: '1) Invisalign: Quick, discreet option for adults and teens\n2) Early Intervention: Preventing issues for children aged 7-10\n3) Digital Scanning: Comfortable alternative to traditional impressions',
    topicsToAvoid: 'Avoid discussing costs explicitly, avoid comparing our practice to specific competitors',
    communityEngagement: 'Annual free dental screenings at local schools, sponsorship of youth sports teams',
    testimonials: '"Dr. Johnson made my daughter feel at ease during her entire treatment." "The staff remembers everyone by name."',
    patientExperience: 'Warm welcome from our front desk team, a tour of our office, digital X-rays and photos, a thorough examination by Dr. Johnson',
    financialOptions: 'We accept most major insurance plans, offer 0% interest payment plans, provide a courtesy discount for payment in full'
  });

  // State to control section visibility
  const [showContentSection, setShowContentSection] = useState(false);
  const [showToneSection, setShowToneSection] = useState(true);
  
  // Track custom option fields
  const [customFields, setCustomFields] = useState({
    primaryAudience: false,
    secondaryAudience: false,
    demographics: false,
    photography: false,
    adjectives: false
  });

  // Track selected adjectives - initialize with default values
  const [selectedAdjectives, setSelectedAdjectives] = useState<string[]>(defaultAdjectives);
  const [customAdjective, setCustomAdjective] = useState('');

  // Auto-submit whenever formData changes
  useEffect(() => {
    const submissionData: Partial<QuestionnaireData> = {};
    
    // Always include practice information
    submissionData.practiceName = formData.practiceName;
    submissionData.orthodontistName = formData.orthodontistName;
    submissionData.siteVision = formData.siteVision;
    submissionData.uniqueQualities = formData.uniqueQualities;
    
    // Include tone settings if visible
    if (showToneSection) {
      submissionData.primaryAudience = formData.primaryAudience;
      submissionData.secondaryAudience = formData.secondaryAudience;
      submissionData.demographics = formData.demographics;
      submissionData.writingStyle = formData.writingStyle;
      submissionData.preferredPhotographyStyle = formData.preferredPhotographyStyle;
      submissionData.websiteAdjectives = formData.websiteAdjectives;
    }
    
    // Include content settings if visible
    if (showContentSection) {
      submissionData.contentCreation = formData.contentCreation;
      submissionData.hasBlog = formData.hasBlog;
      submissionData.blogType = formData.blogType;
      submissionData.topTreatments = formData.topTreatments;
      submissionData.topicsToAvoid = formData.topicsToAvoid;
      submissionData.communityEngagement = formData.communityEngagement;
      submissionData.testimonials = formData.testimonials;
      submissionData.patientExperience = formData.patientExperience;
      submissionData.financialOptions = formData.financialOptions;
    }
    
    onSubmit(submissionData as QuestionnaireData);
  }, [formData, showToneSection, showContentSection, onSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle button click for option selection
  const handleOptionSelect = (field: string, value: string) => {
    // Update custom field tracking
    if (value === 'Other') {
      setCustomFields({ ...customFields, [field === 'preferredPhotographyStyle' ? 'photography' : field]: true });
      // Don't change the field value if selecting "Other" - keep the existing value for editing
    } else {
      setCustomFields({ ...customFields, [field === 'preferredPhotographyStyle' ? 'photography' : field]: false });
      setFormData({ ...formData, [field]: value });
    }
  };

  // Handle toggling adjective selection
  const toggleAdjective = (adjective: string) => {
    setSelectedAdjectives(prev => {
      if (prev.includes(adjective)) {
        return prev.filter(adj => adj !== adjective);
      } else {
        return [...prev, adjective];
      }
    });
  };

  // Handle custom adjective input
  const handleCustomAdjectiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAdjective(e.target.value);
  };

  // Add custom adjective to the selected list
  const addCustomAdjective = () => {
    if (customAdjective && !selectedAdjectives.includes(customAdjective)) {
      setSelectedAdjectives(prev => [...prev, customAdjective]);
      setCustomAdjective(''); // Clear the input field
    }
  };

  // Handle "Other" option for adjectives
  const handleOtherAdjective = () => {
    setCustomFields(prev => ({
      ...prev,
      adjectives: !prev.adjectives
    }));
    // If turning off "Other", clear the custom adjective
    if (customFields.adjectives) {
      setCustomAdjective('');
    }
  };

  // Toggle section visibility
  const toggleContentSection = () => {
    setShowContentSection(prev => !prev);
  };

  const toggleToneSection = () => {
    setShowToneSection(prev => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is now handled automatically via useEffect
  };
  
  const handleReset = () => {
    // Confirm before resetting
    if (window.confirm("Are you sure you want to reset all fields?")) {
      // Reset to empty values
      setFormData({
        practiceName: '',
        orthodontistName: '',
        siteVision: '',
        uniqueQualities: '',
        primaryAudience: 'Parents',
        secondaryAudience: 'Teenagers',
        demographics: 'Family-oriented (25-45, middle to upper income)',
        writingStyle: '',
        preferredPhotographyStyle: 'Lifestyle',
        websiteAdjectives: '',
        
        contentCreation: 'new',
        hasBlog: false,
        blogType: '',
        topTreatments: '',
        topicsToAvoid: '',
        communityEngagement: '',
        testimonials: '',
        patientExperience: '',
        financialOptions: ''
      });
      
      // Reset custom fields
      setCustomFields({
        primaryAudience: false,
        secondaryAudience: false,
        demographics: false,
        photography: false,
        adjectives: false
      });
      
      // Reset adjectives to empty (not default values)
      setSelectedAdjectives([]);
      setCustomAdjective('');
    }
  };

  // Initialize selectedAdjectives from formData.websiteAdjectives
  useEffect(() => {
    // Only initialize if selectedAdjectives are not already set and formData.websiteAdjectives is not empty
    if (selectedAdjectives.length === 0 && formData.websiteAdjectives) {
      const adjectivesList = formData.websiteAdjectives.split(',').map(adj => adj.trim());
      setSelectedAdjectives(adjectivesList);
    }
  }, [formData.websiteAdjectives]);

  // Update formData.websiteAdjectives when selectedAdjectives changes
  useEffect(() => {
    // Skip the update if it would result in the same string to prevent infinite loops
    const newAdjectivesString = selectedAdjectives.join(', ');
    if (newAdjectivesString !== formData.websiteAdjectives) {
      setFormData(prev => ({
        ...prev,
        websiteAdjectives: newAdjectivesString
      }));
    }
  }, [selectedAdjectives, formData.websiteAdjectives]);

  return (
    <div className="questionnaire-form">
      <h2>Site Content Questionnaire</h2>
      
      <div className="questionnaire-progress">
        <div className="progress-text">
          Customize your site with your practice information
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Practice Information Section */}
        <PracticeInformationSection 
          formData={formData}
          handleChange={handleChange}
        />
        
        {/* Collapsible Tone Settings */}
        <div className="collapsible-section">
          <div 
            className="section-header" 
            onClick={toggleToneSection}
          >
            <h3>Tone Settings</h3>
            <div className={`collapse-icon ${showToneSection ? 'expanded' : ''}`}>
              ▼
            </div>
          </div>
          
          <div className={`section-content ${showToneSection ? 'expanded' : ''}`}>
            <ToneSettingsSection 
              formData={formData}
              handleChange={handleChange}
              handleOptionSelect={handleOptionSelect}
              toggleAdjective={toggleAdjective}
              handleCustomAdjectiveChange={handleCustomAdjectiveChange}
              addCustomAdjective={addCustomAdjective}
              handleOtherAdjective={handleOtherAdjective}
              customFields={customFields}
              selectedAdjectives={selectedAdjectives}
              customAdjective={customAdjective}
              audienceOptions={audienceOptions}
              demographicsOptions={demographicsOptions}
              photographyOptions={photographyOptions}
              adjectiveOptions={adjectiveOptions}
            />
          </div>
        </div>
        
        {/* Collapsible Content Settings */}
        <div className="collapsible-section">
          <div 
            className="section-header" 
            onClick={toggleContentSection}
          >
            <h3>Content Settings</h3>
            <div className={`collapse-icon ${showContentSection ? 'expanded' : ''}`}>
              ▼
            </div>
          </div>
          
          <div className={`section-content ${showContentSection ? 'expanded' : ''}`}>
            <ContentSettingsSection 
              formData={formData}
              handleChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="reset-button" onClick={handleReset}>Reset Form</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm; 