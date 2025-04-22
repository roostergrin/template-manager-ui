import { useState, useEffect } from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

// Mock scrape function
export async function mockScrapeWebsite(domain: string) {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 1200));
  if (domain.includes('fail')) {
    throw new Error('Could not scrape the website. Please check the domain and try again.');
  }
  // Return mock data
  return {
    practiceName: 'Mocked Practice Name',
    orthodontistName: 'Dr. Jane Doe',
    siteVision: 'To provide the best orthodontic care.',
    uniqueQualities: 'Friendly staff, modern technology.',
    phone: '(555) 123-4567',
    email: 'info@' + domain.replace(/^https?:\/\//, ''),
    address: '123 Main St, Suite 100, Anytown, USA',
    googleMapsLink: 'https://maps.google.com/?q=123+Main+St,+Anytown',
    businessHours: 'Mon-Fri 8am-5pm',
    specialNotes: 'Free parking available. Wheelchair accessible.',
    brandColor: '#4d4ec1',
    accentColor: '#fbbf24',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    instagram: '@mockpractice',
    googleReviewLink: 'https://g.page/r/CQmocks',
    formsUrl: 'https://mockpractice.com/forms',
    teamMembers: 'Jane Doe (Office Manager), John Smith (Assistant)',
    doctorBio: 'Dr. Jane Doe is a board-certified orthodontist with 15 years of experience.',
    missionStatement: 'Our mission is to create beautiful, healthy smiles in a caring environment.',
    communityInvolvement: 'Sponsor of local youth sports and annual free dental screenings.',
    patientForms: 'New Patient Form, Medical History Form',
  };
}

export function useQuestionnaireForm(onSubmit: (formData: QuestionnaireData) => void) {
  const defaultAdjectives = ['Modern', 'Professional', 'Friendly', 'Clean'];

  const [formData, setFormData] = useState<QuestionnaireData>({
    website: {
      hasSite: false,
      siteDomain: '',
      siteVision: '',
      uniqueQualities: '',
      websitesYouLove: '',
    },
    contact: {
      practiceName: '',
      orthodontistName: '',
      phone: '',
      email: '',
      address: '',
      suite: '',
      cityState: '',
      googleMapsLink: '',
      businessHours: '',
      specialNotes: '',
    },
    brand: {
      brandColor: '',
      accentColor: '',
      headingFont: '',
      bodyFont: '',
      instagram: '',
      googleReviewLink: '',
      missionStatement: '',
      communityInvolvement: '',
      logoUpload: null,
      collateralUpload: null,
    },
    about: {
      teamMembers: '',
      doctorBio: '',
      doctorPhilosophy: '',
      topReasons: '',
      patientExperience: '',
      testimonials: '',
      communityEngagement: '',
      financialOptions: '',
    },
    treatments: {
      treatmentsOffered: '',
      treatmentPitches: '',
      topTreatments: '',
      topicsToAvoid: '',
    },
    patientInfo: {
      hasPatientForms: 'no',
      patientForms: '',
      patientFormsUpload: null,
      formsUrl: '',
    },
    content: {
      contentCreation: 'new',
      hasBlog: false,
      blogType: '',
    },
    integrations: {
      preferredContactMethods: '',
      smsNumber: '',
      embedChat: 'no',
      widgetCode: '',
    },
    reviews: {
      reviewPlatform: '',
      reviewLinks: '',
    },
    technical: {
      dnsManager: '',
      delegatedDns: 'no',
      googleAnalyticsId: '',
      googleAdsLandingPages: 'no',
    },
    visual: {
      preferredPhotographyStyle: '',
      reuseImages: 'no',
      headshots: null,
      officePhotos: null,
    },
    tone: {
      primaryAudience: '',
      secondaryAudience: '',
      demographics: '',
      writingStyle: '',
      websiteAdjectives: '',
    },
  });

  const [showContentSection, setShowContentSection] = useState(false);
  const [showToneSection, setShowToneSection] = useState(true);

  const [customFields, setCustomFields] = useState({
    primaryAudience: false,
    secondaryAudience: false,
    demographics: false,
    photography: false,
    adjectives: false
  });

  const [selectedAdjectives, setSelectedAdjectives] = useState<string[]>(defaultAdjectives);
  const [customAdjective, setCustomAdjective] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedSummary, setScrapedSummary] = useState<unknown | null>(null);

  useEffect(() => {
    const submissionData: Partial<QuestionnaireData> = {};
    submissionData.website = { ...formData.website };
    submissionData.contact = { ...formData.contact };
    submissionData.brand = { ...formData.brand };
    submissionData.about = { ...formData.about };
    submissionData.treatments = { ...formData.treatments };
    submissionData.patientInfo = { ...formData.patientInfo };
    submissionData.content = { ...formData.content };
    submissionData.integrations = { ...formData.integrations };
    submissionData.reviews = { ...formData.reviews };
    submissionData.technical = { ...formData.technical };
    submissionData.visual = { ...formData.visual };
    submissionData.tone = { ...formData.tone };
    if (showToneSection) {
      submissionData.tone.primaryAudience = formData.tone.primaryAudience;
      submissionData.tone.secondaryAudience = formData.tone.secondaryAudience;
      submissionData.tone.demographics = formData.tone.demographics;
      submissionData.tone.writingStyle = formData.tone.writingStyle;
      submissionData.tone.websiteAdjectives = formData.tone.websiteAdjectives;
    }
    if (showContentSection) {
      submissionData.content.contentCreation = formData.content.contentCreation;
      submissionData.content.hasBlog = formData.content.hasBlog;
      submissionData.content.blogType = formData.content.blogType;
      submissionData.treatments.topTreatments = formData.treatments.topTreatments;
      submissionData.treatments.topicsToAvoid = formData.treatments.topicsToAvoid;
      submissionData.about.communityEngagement = formData.about.communityEngagement;
      submissionData.about.testimonials = formData.about.testimonials;
      submissionData.about.patientExperience = formData.about.patientExperience;
      submissionData.about.financialOptions = formData.about.financialOptions;
    }
    onSubmit(submissionData as QuestionnaireData);
  }, [formData, showToneSection, showContentSection, onSubmit]);

  const handleChange = (section: keyof QuestionnaireData, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleHasSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      website: {
        ...formData.website,
        hasSite: e.target.value === 'yes',
      },
    });
  };

  const handleSiteDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      website: {
        ...formData.website,
        siteDomain: e.target.value,
      },
    });
    setError(null);
    setScrapedSummary(null);
  };

  const handleSiteDomainScrape = async () => {
    if (formData.website.siteDomain && formData.website.hasSite) {
      setLoading(true);
      setError(null);
      try {
        const scraped = await mockScrapeWebsite(formData.website.siteDomain);
        setFormData(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            practiceName: scraped.practiceName || prev.contact.practiceName,
            orthodontistName: scraped.orthodontistName || prev.contact.orthodontistName,
            siteVision: scraped.siteVision || prev.contact.siteVision,
            uniqueQualities: scraped.uniqueQualities || prev.contact.uniqueQualities,
            phone: scraped.phone || prev.contact.phone,
            email: scraped.email || prev.contact.email,
            address: scraped.address || prev.contact.address,
            googleMapsLink: scraped.googleMapsLink || prev.contact.googleMapsLink,
            businessHours: scraped.businessHours || prev.contact.businessHours,
            specialNotes: scraped.specialNotes || prev.contact.specialNotes,
          },
          brand: {
            ...prev.brand,
            brandColor: scraped.brandColor || prev.brand.brandColor,
            accentColor: scraped.accentColor || prev.brand.accentColor,
            headingFont: scraped.headingFont || prev.brand.headingFont,
            bodyFont: scraped.bodyFont || prev.brand.bodyFont,
            instagram: scraped.instagram || prev.brand.instagram,
            googleReviewLink: scraped.googleReviewLink || prev.brand.googleReviewLink,
            missionStatement: scraped.missionStatement || prev.brand.missionStatement,
            communityInvolvement: scraped.communityInvolvement || prev.brand.communityInvolvement,
            logoUpload: scraped.logoUpload || prev.brand.logoUpload,
            collateralUpload: scraped.collateralUpload || prev.brand.collateralUpload,
          },
          about: {
            ...prev.about,
            teamMembers: scraped.teamMembers || prev.about.teamMembers,
            doctorBio: scraped.doctorBio || prev.about.doctorBio,
            doctorPhilosophy: scraped.doctorPhilosophy || prev.about.doctorPhilosophy,
            topReasons: scraped.topReasons || prev.about.topReasons,
            patientExperience: scraped.patientExperience || prev.about.patientExperience,
            testimonials: scraped.testimonials || prev.about.testimonials,
            communityEngagement: scraped.communityEngagement || prev.about.communityEngagement,
            financialOptions: scraped.financialOptions || prev.about.financialOptions,
          },
          treatments: {
            ...prev.treatments,
            topTreatments: scraped.topTreatments || prev.treatments.topTreatments,
            topicsToAvoid: scraped.topicsToAvoid || prev.treatments.topicsToAvoid,
          },
          patientInfo: {
            ...prev.patientInfo,
            hasPatientForms: scraped.hasPatientForms || prev.patientInfo.hasPatientForms,
            patientForms: scraped.patientForms || prev.patientInfo.patientForms,
            patientFormsUpload: scraped.patientFormsUpload || prev.patientInfo.patientFormsUpload,
            formsUrl: scraped.formsUrl || prev.patientInfo.formsUrl,
          },
          content: {
            ...prev.content,
            contentCreation: scraped.contentCreation || prev.content.contentCreation,
            hasBlog: scraped.hasBlog || prev.content.hasBlog,
            blogType: scraped.blogType || prev.content.blogType,
          },
          tone: {
            ...prev.tone,
            primaryAudience: scraped.primaryAudience || prev.tone.primaryAudience,
            secondaryAudience: scraped.secondaryAudience || prev.tone.secondaryAudience,
            demographics: scraped.demographics || prev.tone.demographics,
            writingStyle: scraped.writingStyle || prev.tone.writingStyle,
            websiteAdjectives: scraped.websiteAdjectives || prev.tone.websiteAdjectives,
          },
        }));
        setScrapedSummary(scraped);
      } catch (err: any) {
        setError(err.message || 'Failed to scrape website.');
        setScrapedSummary(null);
      }
      setLoading(false);
    }
  };

  const handleOptionSelect = (field: string, value: string) => {
    if (value === 'Other') {
      setCustomFields({ ...customFields, [field === 'preferredPhotographyStyle' ? 'photography' : field]: true });
    } else {
      setCustomFields({ ...customFields, [field === 'preferredPhotographyStyle' ? 'photography' : field]: false });
      setFormData({ ...formData, [field]: value });
    }
  };

  const toggleAdjective = (adjective: string) => {
    setSelectedAdjectives(prev => {
      if (prev.includes(adjective)) {
        return prev.filter(adj => adj !== adjective);
      } else {
        return [...prev, adjective];
      }
    });
  };

  const handleCustomAdjectiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAdjective(e.target.value);
  };

  const addCustomAdjective = () => {
    if (customAdjective && !selectedAdjectives.includes(customAdjective)) {
      setSelectedAdjectives(prev => [...prev, customAdjective]);
      setCustomAdjective('');
    }
  };

  const handleOtherAdjective = () => {
    setCustomFields(prev => ({
      ...prev,
      adjectives: !prev.adjectives
    }));
    if (customFields.adjectives) {
      setCustomAdjective('');
    }
  };

  const toggleContentSection = () => {
    setShowContentSection(prev => !prev);
  };

  const toggleToneSection = () => {
    setShowToneSection(prev => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all fields?")) {
      setFormData({
        website: {
          hasSite: false,
          siteDomain: '',
          siteVision: '',
          uniqueQualities: '',
          websitesYouLove: '',
        },
        contact: {
          practiceName: '',
          orthodontistName: '',
          phone: '',
          email: '',
          address: '',
          suite: '',
          cityState: '',
          googleMapsLink: '',
          businessHours: '',
          specialNotes: '',
        },
        brand: {
          brandColor: '',
          accentColor: '',
          headingFont: '',
          bodyFont: '',
          instagram: '',
          googleReviewLink: '',
          missionStatement: '',
          communityInvolvement: '',
          logoUpload: null,
          collateralUpload: null,
        },
        about: {
          teamMembers: '',
          doctorBio: '',
          doctorPhilosophy: '',
          topReasons: '',
          patientExperience: '',
          testimonials: '',
          communityEngagement: '',
          financialOptions: '',
        },
        treatments: {
          treatmentsOffered: '',
          treatmentPitches: '',
          topTreatments: '',
          topicsToAvoid: '',
        },
        patientInfo: {
          hasPatientForms: 'no',
          patientForms: '',
          patientFormsUpload: null,
          formsUrl: '',
        },
        content: {
          contentCreation: 'new',
          hasBlog: false,
          blogType: '',
        },
        integrations: {
          preferredContactMethods: '',
          smsNumber: '',
          embedChat: 'no',
          widgetCode: '',
        },
        reviews: {
          reviewPlatform: '',
          reviewLinks: '',
        },
        technical: {
          dnsManager: '',
          delegatedDns: 'no',
          googleAnalyticsId: '',
          googleAdsLandingPages: 'no',
        },
        visual: {
          preferredPhotographyStyle: '',
          reuseImages: 'no',
          headshots: null,
          officePhotos: null,
        },
        tone: {
          primaryAudience: '',
          secondaryAudience: '',
          demographics: '',
          writingStyle: '',
          websiteAdjectives: '',
        },
      });
      setCustomFields({
        primaryAudience: false,
        secondaryAudience: false,
        demographics: false,
        photography: false,
        adjectives: false
      });
      setSelectedAdjectives([]);
      setCustomAdjective('');
      setError(null);
      setScrapedSummary(null);
    }
  };

  useEffect(() => {
    if (selectedAdjectives.length === 0 && formData.websiteAdjectives) {
      const adjectivesList = formData.websiteAdjectives.split(',').map(adj => adj.trim());
      setSelectedAdjectives(adjectivesList);
    }
  }, [formData.websiteAdjectives]);

  useEffect(() => {
    const newAdjectivesString = selectedAdjectives.join(', ');
    if (newAdjectivesString !== formData.websiteAdjectives) {
      setFormData(prev => ({
        ...prev,
        websiteAdjectives: newAdjectivesString
      }));
    }
  }, [selectedAdjectives, formData.websiteAdjectives]);

  const mergeValues = (values: Partial<QuestionnaireData>) => {
    setFormData(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(values).map(([section, sectionData]) => [
          section,
          { ...prev[section as keyof QuestionnaireData], ...sectionData }
        ])
      )
    }));
  };

  return {
    formData, setFormData,
    showContentSection, toggleContentSection,
    showToneSection, toggleToneSection,
    customFields, setCustomFields,
    selectedAdjectives, setSelectedAdjectives,
    customAdjective, setCustomAdjective,
    handleChange, handleOptionSelect,
    toggleAdjective, handleCustomAdjectiveChange,
    addCustomAdjective, handleOtherAdjective,
    handleSubmit, handleReset,
    handleHasSiteChange, handleSiteDomainChange, handleSiteDomainScrape,
    loading, error, scrapedSummary,
    mergeValues
  };
} 