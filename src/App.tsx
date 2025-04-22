import React, { useState, useCallback } from 'react';
import QuestionnaireForm, { QuestionnaireData } from './components/QuestionnaireForm';
import Sitemap from './components/Sitemap';
import { initialModelGroups } from './modelGroups';
import './App.sass';

const App: React.FC = () => {
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);

  const currentModels = initialModelGroups[selectedModelGroupKey] || [];

  // Memoize the function to prevent it from being recreated on every render
  const handleQuestionnaireSubmit = useCallback((formData: QuestionnaireData) => {
    setQuestionnaireData(formData);
    console.log("formData", formData);
  }, []);

  return (
    <div className="app">
      <div className="app__questionnaire-container">
        <QuestionnaireForm onSubmit={handleQuestionnaireSubmit} />
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
    </div>
  );
};

export default App;