import React from 'react';
import './QuestionnaireForm.sass';
import WebsiteDiscoverySection from './WebsiteDiscoverySection';
import PracticeContactBasicsSection from './PracticeContactBasicsSection';
import BrandIdentitySection from './BrandIdentitySection';
import HomepageHighlightsSection from './HomepageHighlightsSection';
import AboutSection from './AboutSection';
import TreatmentsOfferedSection from './TreatmentsOfferedSection';
import GetStartedPatientInfoSection from './GetStartedPatientInfoSection';
import CommunicationIntegrationsSection from './CommunicationIntegrationsSection';
import ReviewsSocialProofSection from './ReviewsSocialProofSection';
import TechnicalLogisticsSection from './TechnicalLogisticsSection';
import ToneSettingsSection from './ToneSettingsSection';
import ContentSettingsSection from './ContentSettingsSection';
import CollapsibleSection from './CollapsibleSection';
import FormActions from './FormActions';
import { useQuestionnaireForm } from './useQuestionnaireForm';
import {
  audienceOptions,
  demographicsOptions,
  photographyOptions,
  adjectiveOptions
} from './questionnaireOptions';

export interface QuestionnaireData {
  website: {
    hasSite: boolean;
    siteDomain: string;
    siteVision: string;
    uniqueQualities: string;
    websitesYouLove?: string;
  };
  contact: {
    practiceName: string;
    orthodontistName: string;
    phone?: string;
    email?: string;
    address?: string;
    suite?: string;
    cityState?: string;
    googleMapsLink?: string;
    businessHours?: string;
    specialNotes?: string;
  };
  brand: {
    brandColor?: string;
    accentColor?: string;
    headingFont?: string;
    bodyFont?: string;
    instagram?: string;
    googleReviewLink?: string;
    missionStatement?: string;
    communityInvolvement?: string;
    logoUpload?: FileList | null;
    collateralUpload?: FileList | null;
  };
  about: {
    teamMembers?: string;
    doctorBio?: string;
    doctorPhilosophy?: string;
    topReasons?: string;
    patientExperience?: string;
    testimonials?: string;
    communityEngagement?: string;
    financialOptions?: string;
  };
  treatments: {
    treatmentsOffered?: string;
    treatmentPitches?: string;
    topTreatments?: string;
    topicsToAvoid?: string;
  };
  patientInfo: {
    hasPatientForms?: 'yes' | 'no';
    patientForms?: string;
    patientFormsUpload?: FileList | null;
    formsUrl?: string;
  };
  content: {
    contentCreation: 'new' | 'prior';
    hasBlog: boolean;
    blogType: string;
  };
  integrations: {
    preferredContactMethods?: string;
    smsNumber?: string;
    embedChat?: 'yes' | 'no';
    widgetCode?: string;
  };
  reviews: {
    reviewPlatform?: string;
    reviewLinks?: string;
  };
  technical: {
    dnsManager?: string;
    delegatedDns?: 'yes' | 'no';
    googleAnalyticsId?: string;
    googleAdsLandingPages?: 'yes' | 'no';
  };
  visual: {
    preferredPhotographyStyle: string;
    reuseImages?: 'yes' | 'no';
    headshots?: FileList | null;
    officePhotos?: FileList | null;
  };
  tone: {
    primaryAudience: string;
    secondaryAudience: string;
    demographics: string;
    writingStyle: string;
    websiteAdjectives: string;
  };
}

interface QuestionnaireFormProps {
  onSubmit: (formData: QuestionnaireData) => void;
}

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ onSubmit }) => {
  const form = useQuestionnaireForm(onSubmit);

  console.log('form.formData', form.formData);
  // State to manage expanded/collapsed sections
  const [expandedSections, setExpandedSections] = React.useState({
    practiceContact: true,
    brand: false,
    homepage: false,
    about: false,
    treatments: false,
    patientInfo: false,
    integrations: false,
    reviews: false,
    technical: false,
    tone: form.showToneSection,
    content: form.showContentSection,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="questionnaire-form">
      <h2>Site Content Questionnaire</h2>
      <div className="questionnaire-progress">
        <div className="progress-text">
          Customize your site with your practice information
        </div>
      </div>
      <form onSubmit={form.handleSubmit}>
        <WebsiteDiscoverySection
          hasSite={form.formData.website.hasSite}
          siteDomain={form.formData.website.siteDomain}
          handleHasSiteChange={form.handleHasSiteChange}
          handleSiteDomainChange={form.handleSiteDomainChange}
          handleSiteDomainScrape={form.handleSiteDomainScrape}
          loading={form.loading}
          error={form.error}
          scrapedSummary={form.scrapedSummary}
        />
        <CollapsibleSection
          title="Practice & Contact Basics"
          expanded={expandedSections.practiceContact}
          onToggle={() => toggleSection('practiceContact')}
        >
          <PracticeContactBasicsSection formData={form.formData.contact} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Brand Identity"
          expanded={expandedSections.brand}
          onToggle={() => toggleSection('brand')}
        >
          <BrandIdentitySection formData={form.formData.brand} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Homepage Highlights"
          expanded={expandedSections.homepage}
          onToggle={() => toggleSection('homepage')}
        >
          <HomepageHighlightsSection formData={form.formData.website} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="About"
          expanded={expandedSections.about}
          onToggle={() => toggleSection('about')}
        >
          <AboutSection formData={form.formData.about} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Treatments Offered"
          expanded={expandedSections.treatments}
          onToggle={() => toggleSection('treatments')}
        >
          <TreatmentsOfferedSection formData={form.formData.treatments} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Get Started / Patient Info"
          expanded={expandedSections.patientInfo}
          onToggle={() => toggleSection('patientInfo')}
        >
          <GetStartedPatientInfoSection formData={form.formData.patientInfo} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Communication Integrations"
          expanded={expandedSections.integrations}
          onToggle={() => toggleSection('integrations')}
        >
          <CommunicationIntegrationsSection formData={form.formData.integrations} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Reviews & Social Proof"
          expanded={expandedSections.reviews}
          onToggle={() => toggleSection('reviews')}
        >
          <ReviewsSocialProofSection formData={form.formData.reviews} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Technical Logistics"
          expanded={expandedSections.technical}
          onToggle={() => toggleSection('technical')}
        >
          <TechnicalLogisticsSection formData={form.formData.technical} handleChange={form.handleChange} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Tone Settings"
          expanded={expandedSections.tone}
          onToggle={() => toggleSection('tone')}
        >
          <ToneSettingsSection
            formData={form.formData}
            handleChange={form.handleChange}
            handleOptionSelect={form.handleOptionSelect}
            toggleAdjective={form.toggleAdjective}
            handleCustomAdjectiveChange={form.handleCustomAdjectiveChange}
            addCustomAdjective={form.addCustomAdjective}
            handleOtherAdjective={form.handleOtherAdjective}
            customFields={form.customFields}
            selectedAdjectives={form.selectedAdjectives}
            customAdjective={form.customAdjective}
            audienceOptions={audienceOptions}
            demographicsOptions={demographicsOptions}
            photographyOptions={photographyOptions}
            adjectiveOptions={adjectiveOptions}
          />
        </CollapsibleSection>
        <CollapsibleSection
          title="Content Settings"
          expanded={expandedSections.content}
          onToggle={() => toggleSection('content')}
        >
          <ContentSettingsSection formData={form.formData} handleChange={form.handleChange} />
        </CollapsibleSection>
        <FormActions onReset={form.handleReset} />
      </form>
    </div>
  );
};

export default QuestionnaireForm; 