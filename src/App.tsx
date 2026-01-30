import React, { useState } from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import TestGenerateContent from './pages/TestGenerateContent';
import GithubFileUpdaterDemo from './pages/GithubFileUpdaterDemo';
import MigrationWizard from './pages/MigrationWizard';
import UnifiedWorkflowPage from './pages/UnifiedWorkflowPage';
import GithubRepoProvider from './context/GithubRepoContext';
import { QuestionnaireProvider } from './contexts/QuestionnaireProvider';
import { SitemapProvider } from './contexts/SitemapProvider';
import { WorkflowProvider } from './contexts/WorkflowProvider';
import { AppConfigProvider } from './contexts/AppConfigProvider';
import './App.sass';
import apiClient from './services/apiService';
import { setInMemoryInternalApiKey } from './services/apiService';

declare global {
  interface Window { __INTERNAL_API_TOKEN__?: string }
}

const TokenGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Attempt to load and verify a saved token on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('INTERNAL_API_TOKEN') || localStorage.getItem('internalApiToken');
    if (!saved) return;
    setToken(saved);
    setInMemoryInternalApiKey(saved);
    window.__INTERNAL_API_TOKEN__ = saved;
    (async () => {
      setChecking(true);
      try {
        await apiClient.get('/');
        setVerified(true);
      } catch {
        setInMemoryInternalApiKey(null);
        window.__INTERNAL_API_TOKEN__ = undefined;
        localStorage.removeItem('INTERNAL_API_TOKEN');
        localStorage.removeItem('internalApiToken');
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const verify = async () => {
    setChecking(true);
    setError(null);
    try {
      setInMemoryInternalApiKey(token);
      window.__INTERNAL_API_TOKEN__ = token;
      await apiClient.get('/');
      setVerified(true);
      try {
        localStorage.setItem('INTERNAL_API_TOKEN', token);
      } catch {
        // ignore storage failures
      }
    } catch {
      setInMemoryInternalApiKey(null);
      window.__INTERNAL_API_TOKEN__ = undefined;
      setError('Invalid token');
    } finally {
      setChecking(false);
    }
  };

  if (verified) return <>{children}</>;

  return (
    <div className="token-gate">
      <div className="token-gate__card" role="form" aria-label="Internal access form">
        <img
          src="/onyx--750w.jpg"
          alt="Onyx the dog"
          className="token-gate__image"
        />
        <h2 className="token-gate__title">Internal Access</h2>
        <p className="token-gate__description">Paste your internal access token to continue.</p>
        <input
          className="token-gate__input"
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return;
            if (!token || checking) return;
            verify();
          }}
          placeholder="Enter token"
          aria-label="Internal access token"
        />
        {error && <div className="token-gate__error" role="alert">{error}</div>}
        <button
          className="token-gate__button"
          onClick={verify}
          disabled={!token || checking}
          aria-label={checking ? 'Verifying' : 'Continue'}
        >
          {checking ? 'Verifying…' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppConfigProvider>
      <QuestionnaireProvider>
        <SitemapProvider>
          <WorkflowProvider>
                          <GithubRepoProvider>
                <TokenGate>
                  <div className="app">
                    {typeof window !== 'undefined' && window.location.pathname.includes('/test-generate-content') ? (
                      <TestGenerateContent />
                    ) : typeof window !== 'undefined' && window.location.pathname.includes('/github-file-updater') ? (
                      <GithubFileUpdaterDemo />
                    ) : typeof window !== 'undefined' && window.location.pathname.includes('/migration-wizard') ? (
                      <MigrationWizard />
                    ) : typeof window !== 'undefined' && window.location.pathname.includes('/unified-workflow') ? (
                      <UnifiedWorkflowPage />
                    ) : (
                      <WorkflowManager />
                    )}
                  </div>
                </TokenGate>
              </GithubRepoProvider>
          </WorkflowProvider>
        </SitemapProvider>
      </QuestionnaireProvider>
    </AppConfigProvider>
  );
};

export default App;
