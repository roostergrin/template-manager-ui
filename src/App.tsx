import React, { useState } from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import GithubRepoProvider from './context/GithubRepoContext';
import './App.sass';

const App: React.FC = () => {
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, unknown>>({});

  return (
    <GithubRepoProvider>
      <div className="app">
        <WorkflowManager 
          questionnaireData={questionnaireData}
          setQuestionnaireData={setQuestionnaireData}
        />
      </div>
    </GithubRepoProvider>
  );
};

export default App;