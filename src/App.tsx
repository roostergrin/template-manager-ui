import React from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import GithubRepoProvider from './context/GithubRepoContext';
import { QuestionnaireProvider } from './contexts/QuestionnaireProvider';
import { SitemapProvider } from './contexts/SitemapProvider';
import { WorkflowProvider } from './contexts/WorkflowProvider';
import { AppConfigProvider } from './contexts/AppConfigProvider';
import './App.sass';

const App: React.FC = () => {
  return (
    <AppConfigProvider>
      <QuestionnaireProvider>
        <SitemapProvider>
          <WorkflowProvider>
            <GithubRepoProvider>
              <div className="app">
                <WorkflowManager />
              </div>
            </GithubRepoProvider>
          </WorkflowProvider>
        </SitemapProvider>
      </QuestionnaireProvider>
    </AppConfigProvider>
  );
};

export default App;