import React, { useState } from 'react';
import QuestionnaireForm from './components/QuestionnaireForm/QuestionnaireForm';
import Sitemap from './components/Sitemap';
import { initialModelGroups } from './modelGroups';
import ProvisionSiteSection from './components/ProvisionSiteSection';
import GithubRepoProvider from './context/GithubRepoContext';
import './App.sass';

const App: React.FC = () => {
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);

  const currentModels = initialModelGroups[selectedModelGroupKey] || [];
  return (
    <GithubRepoProvider>
      <div className="app">
        <div className="app__questionnaire-container">
          <QuestionnaireForm formData={questionnaireData} setFormData={setQuestionnaireData} />
        </div>
        <Sitemap
          currentModels={currentModels}
          selectedModelGroupKey={selectedModelGroupKey}
          setSelectedModelGroupKey={setSelectedModelGroupKey}
          modelGroups={modelGroups}
          setModelGroups={setModelGroups}
          questionnaireData={questionnaireData}
          setQuestionnaireData={setQuestionnaireData}
        />
        <ProvisionSiteSection />
      </div>
    </GithubRepoProvider>
  );
};

export default App;