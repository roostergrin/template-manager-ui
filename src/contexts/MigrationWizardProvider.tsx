import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScrapedContent } from '../components/ScrapedContentViewer/ScrapedContentViewer';
import { SitemapSection } from '../types/SitemapTypes';

type WizardStep = 'capture' | 'audit' | 'template' | 'structure' | 'allocate' | 'generate' | 'customize' | 'launch';

export interface SitemapPage {
  title: string;
  path: string;
  component: string;
  items?: string[];
}

export interface PageMapping {
  sitemapPagePath: string;
  scrapedPageKey: string | null;
  confidence?: number;
}

export interface AllocatedSitemap {
  pages: Record<string, {
    page_id: string;
    title: string;
    allocated_markdown?: string;
    source_location?: string;
    allocation_confidence?: number;
    mapped_scraped_page?: string;
    model_query_pairs: any[];
  }>;
  allocation_summary?: {
    total_pages: number;
    allocated_pages: number;
    failed_pages: number;
    allocation_rate: number;
    average_confidence: number;
    total_content_length: number;
    total_images: number;
    unmapped_sitemap_pages?: string[];
    unmapped_scraped_pages?: string[];
    mapping_strategy?: string;
  };
}

interface MigrationWizardState {
  currentStep: WizardStep;
  scrapedContent: ScrapedContent | null;
  selectedSitemap: { pages: SitemapPage[] } | null;
  allocatedSitemap: AllocatedSitemap | null;
  allocatedPagesSitemap: SitemapSection[] | null;
  pageMappings: PageMapping[];
  generatedContent: any | null;
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
    setAllocatedSitemap: (sitemap: AllocatedSitemap | null) => void;
    setAllocatedPagesSitemap: (pages: SitemapSection[] | null) => void;
    setPageMappings: (mappings: PageMapping[]) => void;
    setGeneratedContent: (content: any) => void;
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
  allocatedSitemap: null,
  allocatedPagesSitemap: null,
  pageMappings: [],
  generatedContent: null,
  selectedTemplate: null,
  themeSettings: {
    colors: null,
    fonts: null,
    logo: null,
  },
};

const stepOrder: WizardStep[] = ['capture', 'audit', 'template', 'structure', 'generate', 'customize', 'launch'];

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

  const setAllocatedSitemap = (sitemap: AllocatedSitemap | null) => {
    setState(prev => ({ ...prev, allocatedSitemap: sitemap }));
  };

  const setAllocatedPagesSitemap = (pages: SitemapSection[] | null) => {
    setState(prev => ({ ...prev, allocatedPagesSitemap: pages }));
  };

  const setPageMappings = (mappings: PageMapping[]) => {
    setState(prev => ({ ...prev, pageMappings: mappings }));
  };

  const setGeneratedContent = (content: any) => {
    setState(prev => ({ ...prev, generatedContent: content }));
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
      setAllocatedSitemap,
      setAllocatedPagesSitemap,
      setPageMappings,
      setGeneratedContent,
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
