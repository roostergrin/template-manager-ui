import React, { useState } from 'react';
import './QuestionnaireForm.sass';
import { useQuestionnaireForm, mockScrapeWebsite } from './useQuestionnaireForm';
import DynamicQuestionnaireForm from './DynamicQuestionnaireForm';

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
  const [scrapeDomain, setScrapeDomain] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const handleScrape = async () => {
    setScrapeLoading(true);
    setScrapeError(null);
    try {
      const scraped = await mockScrapeWebsite(scrapeDomain);
      form.mergeValues({
        website: {
          siteVision: scraped.siteVision,
          uniqueQualities: scraped.uniqueQualities,
        },
        contact: {
          practiceName: scraped.practiceName,
          orthodontistName: scraped.orthodontistName,
          phone: scraped.phone,
          email: scraped.email,
          address: scraped.address,
          googleMapsLink: scraped.googleMapsLink,
          businessHours: scraped.businessHours,
          specialNotes: scraped.specialNotes,
        },
        brand: {
          brandColor: scraped.brandColor,
          accentColor: scraped.accentColor,
          headingFont: scraped.headingFont,
          bodyFont: scraped.bodyFont,
          instagram: scraped.instagram,
          googleReviewLink: scraped.googleReviewLink,
          missionStatement: scraped.missionStatement,
          communityInvolvement: scraped.communityInvolvement,
        },
        about: {
          teamMembers: scraped.teamMembers,
          doctorBio: scraped.doctorBio,
        },
        patientInfo: {
          formsUrl: scraped.formsUrl,
          patientForms: scraped.patientForms,
        }
      });
    } catch (err: any) {
      setScrapeError(err.message || 'Failed to scrape website.');
    }
    setScrapeLoading(false);
  };

  return (
    <div className="questionnaire-form">
      <h2>Site Content Questionnaire</h2>
      <div className="questionnaire-progress">
        <div className="progress-text">
          Customize your site with your practice information
        </div>
      </div>
      {/* Website Discovery Section */}
      <div style={{ marginBottom: 24 }}>
        <label>
          Website Domain:{' '}
          <input
            type="text"
            value={scrapeDomain}
            onChange={e => setScrapeDomain(e.target.value)}
            placeholder="Enter your website domain"
          />
        </label>
        <button type="button" onClick={handleScrape} disabled={scrapeLoading || !scrapeDomain} style={{ marginLeft: 8 }}>
          {scrapeLoading ? 'Scraping...' : 'Scrape Website'}
        </button>
        {scrapeError && <div style={{ color: 'red' }}>{scrapeError}</div>}
      </div>
      <DynamicQuestionnaireForm
        formData={form.formData}
        handleChange={form.handleChange}
        handleSubmit={form.handleSubmit}
        handleReset={form.handleReset}
        loading={form.loading}
        error={form.error}
      />
    </div>
  );
};

export default QuestionnaireForm; 