import React, { useState } from 'react';
import QuestionnaireManager from './components/QuestionnaireManager/QuestionnaireManager';
import Sitemap from './components/Sitemap';
import { initialModelGroups } from './modelGroups';
import ProvisionSiteSection from './components/ProvisionSiteSection';
import ScrapedImageTester from './components/ScrapedImageTester/ScrapedImageTester';
import GithubRepoProvider from './context/GithubRepoContext';
import { QuestionnaireData } from './types/SitemapTypes';
import './App.sass';

const App: React.FC = () => {
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, unknown>>({});

  // Convert to QuestionnaireData for Sitemap component
  const questionnaireDataForSitemap: QuestionnaireData = (questionnaireData as unknown as QuestionnaireData) || {
    practiceDetails: '',
    siteVision: '',
    primaryAudience: '',
    secondaryAudience: '',
    demographics: '',
    uniqueQualities: '',
    contentCreation: 'new',
    hasBlog: false,
    blogType: '',
    topTreatments: '',
    writingStyle: '',
    topicsToAvoid: '',
    communityEngagement: '',
    testimonials: '',
    patientExperience: '',
    financialOptions: ''
  };

  const handleQuestionnaireDataChange = (data: QuestionnaireData) => {
    setQuestionnaireData(data as unknown as Record<string, unknown>);
  };

  const currentModels = initialModelGroups[selectedModelGroupKey] || [];
  return (
    <GithubRepoProvider>
      <div className="app">
        <div className="app__questionnaire-container">
          <QuestionnaireManager formData={questionnaireData} setFormData={setQuestionnaireData} />
        </div>
        <Sitemap
          currentModels={currentModels}
          selectedModelGroupKey={selectedModelGroupKey}
          setSelectedModelGroupKey={setSelectedModelGroupKey}
          modelGroups={modelGroups}
          setModelGroups={setModelGroups}
          questionnaireData={questionnaireDataForSitemap}
          setQuestionnaireData={handleQuestionnaireDataChange}
        />
        <ProvisionSiteSection />
        <ScrapedImageTester />
      </div>
    </GithubRepoProvider>
  );
};

export default App;