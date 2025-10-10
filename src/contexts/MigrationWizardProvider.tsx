import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScrapedContent } from '../components/ScrapedContentViewer/ScrapedContentViewer';

type WizardStep = 'capture' | 'audit' | 'structure' | 'customize' | 'launch';

interface SitemapPage {
  title: string;
  path: string;
  component: string;
  items?: string[];
}

interface PageMapping {
  sitemapPagePath: string;
  scrapedPageKey: string | null;
  confidence?: number;
}

interface MigrationWizardState {
  currentStep: WizardStep;
  scrapedContent: ScrapedContent | null;
  selectedSitemap: { pages: SitemapPage[] } | null;
  pageMappings: PageMapping[];
  selectedTemplate: string | null;
  themeSettings: {
    colors: { primary: string; secondary: string } | null;
    fonts: { heading: string; body: string } | null;
    logo: string | null;
  };
}

interface MigrationWizardContextType {
  state: MigrationWizardState;
  actions: {
    setCurrentStep: (step: WizardStep) => void;
    setScrapedContent: (content: ScrapedContent) => void;
    setSelectedSitemap: (sitemap: { pages: SitemapPage[] }) => void;
    setPageMappings: (mappings: PageMapping[]) => void;
    setSelectedTemplate: (template: string) => void;
    setThemeSettings: (settings: Partial<MigrationWizardState['themeSettings']>) => void;
    nextStep: () => void;
    previousStep: () => void;
    resetWizard: () => void;
  };
}

const MigrationWizardContext = createContext<MigrationWizardContextType | undefined>(undefined);

const initialState: MigrationWizardState = {
  currentStep: 'capture',
  scrapedContent: null,
  selectedSitemap: null,
  pageMappings: [],
  selectedTemplate: null,
  themeSettings: {
    colors: null,
    fonts: null,
    logo: null,
  },
};

const stepOrder: WizardStep[] = ['capture', 'audit', 'structure', 'customize', 'launch'];

export const MigrationWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MigrationWizardState>(initialState);

  const setCurrentStep = (step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const setScrapedContent = (content: ScrapedContent) => {
    setState(prev => ({ ...prev, scrapedContent: content }));
  };

  const setSelectedSitemap = (sitemap: { pages: SitemapPage[] }) => {
    setState(prev => ({ ...prev, selectedSitemap: sitemap }));
  };

  const setPageMappings = (mappings: PageMapping[]) => {
    setState(prev => ({ ...prev, pageMappings: mappings }));
  };

  const setSelectedTemplate = (template: string) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  };

  const setThemeSettings = (settings: Partial<MigrationWizardState['themeSettings']>) => {
    setState(prev => ({
      ...prev,
      themeSettings: { ...prev.themeSettings, ...settings },
    }));
  };

  const nextStep = () => {
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const resetWizard = () => {
    setState(initialState);
  };

  const contextValue: MigrationWizardContextType = {
    state,
    actions: {
      setCurrentStep,
      setScrapedContent,
      setSelectedSitemap,
      setPageMappings,
      setSelectedTemplate,
      setThemeSettings,
      nextStep,
      previousStep,
      resetWizard,
    },
  };

  return (
    <MigrationWizardContext.Provider value={contextValue}>
      {children}
    </MigrationWizardContext.Provider>
  );
};

export const useMigrationWizard = (): MigrationWizardContextType => {
  const context = useContext(MigrationWizardContext);
  if (!context) {
    throw new Error('useMigrationWizard must be used within MigrationWizardProvider');
  }
  return context;
};
