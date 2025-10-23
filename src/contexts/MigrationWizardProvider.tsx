import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ScrapedContent } from '../components/ScrapedContentViewer/ScrapedContentViewer';
import { SitemapSection } from '../types/SitemapTypes';
import { useSitemap } from './SitemapProvider';
import {
  saveSitemapData,
  loadSitemapData,
  updateSitemapData,
  PersistedSitemapData,
} from '../utils/sitemapPersistence';

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
  generatedScrapedSitemap: SitemapSection[] | null;
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
    setGeneratedScrapedSitemap: (pages: SitemapSection[] | null) => void;
    setPageMappings: (mappings: PageMapping[]) => void;
    setGeneratedContent: (content: any) => void;
    setSelectedTemplate: (template: string) => void;
    setThemeSettings: (settings: Partial<MigrationWizardState['themeSettings']>) => void;
    nextStep: () => void;
    previousStep: () => void;
    resetWizard: () => void;
    getPersistedLastSource: () => 'default' | 'allocated' | 'scraped' | null;
    saveLastSelectedSource: (source: 'default' | 'allocated' | 'scraped') => void;
  };
}

const MigrationWizardContext = createContext<MigrationWizardContextType | undefined>(undefined);

const initialState: MigrationWizardState = {
  currentStep: 'capture',
  scrapedContent: null,
  selectedSitemap: null,
  allocatedSitemap: null,
  allocatedPagesSitemap: null,
  generatedScrapedSitemap: null,
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Access Sitemap Provider to sync allocated sitemap
  const { actions: sitemapActions } = useSitemap();

  // Load persisted data when scraped content changes
  useEffect(() => {
    if (state.scrapedContent && !isInitialized) {
      const domain = state.scrapedContent.domain;
      const scrapedAt = state.scrapedContent.metadata.scraped_at;

      console.log('🔍 Loading persisted sitemap data for domain:', domain);
      const persistedData = loadSitemapData(domain);

      if (persistedData) {
        console.log('✅ Found persisted data for domain:', domain);
        console.log('  - Has allocated sitemap:', !!persistedData.allocatedSitemap);
        console.log('  - Has allocated pages:', !!persistedData.allocatedPagesSitemap);
        console.log('  - Has generated scraped sitemap:', !!persistedData.generatedScrapedSitemap);
        console.log('  - Last selected source:', persistedData.lastSelectedSource);

        // Restore the persisted state
        setState(prev => ({
          ...prev,
          allocatedSitemap: persistedData.allocatedSitemap,
          allocatedPagesSitemap: persistedData.allocatedPagesSitemap,
          generatedScrapedSitemap: persistedData.generatedScrapedSitemap,
        }));
      } else {
        console.log('ℹ️ No persisted data found for domain:', domain);
        // Initialize new persistence entry
        const newData: PersistedSitemapData = {
          domain,
          scrapedAt,
          lastUpdated: new Date().toISOString(),
          allocatedSitemap: null,
          allocatedPagesSitemap: null,
          generatedScrapedSitemap: null,
          generatedDefaultSitemap: null,
          lastSelectedSource: 'default',
          selectedModelGroupKey: null,
        };
        saveSitemapData(newData);
      }

      setIsInitialized(true);
    }
  }, [state.scrapedContent, isInitialized]);

  // Persist data whenever key state changes
  useEffect(() => {
    if (state.scrapedContent && isInitialized) {
      const domain = state.scrapedContent.domain;
      const scrapedAt = state.scrapedContent.metadata.scraped_at;

      const dataToSave: PersistedSitemapData = {
        domain,
        scrapedAt,
        lastUpdated: new Date().toISOString(),
        allocatedSitemap: state.allocatedSitemap,
        allocatedPagesSitemap: state.allocatedPagesSitemap,
        generatedScrapedSitemap: state.generatedScrapedSitemap,
        generatedDefaultSitemap: null, // We'll add this later if needed
        lastSelectedSource: 'default', // This will be managed by Step3Structure
        selectedModelGroupKey: state.selectedTemplate,
      };

      saveSitemapData(dataToSave);
      console.log('💾 Persisted sitemap data for domain:', domain);
    }
  }, [
    state.allocatedSitemap,
    state.allocatedPagesSitemap,
    state.generatedScrapedSitemap,
    isInitialized,
  ]);

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

    // Sync to Sitemap Provider so Step 4 uses the current data
    if (sitemap?.pages) {
      console.log('🔄 Syncing allocated sitemap to Sitemap Provider');

      // Convert dict format to array format for Sitemap Provider
      const pagesArray: SitemapSection[] = Object.entries(sitemap.pages).map(([key, page]) => ({
        id: page.page_id || key,
        title: page.title,
        path: `/${key.toLowerCase().replace(/\s+/g, '-')}`,
        wordpress_id: page.page_id,
        items: page.model_query_pairs.map((pair: any) => ({
          id: pair.internal_id || `${key}-${pair.model}`,
          model: pair.model,
          query: pair.query,
          use_default: pair.use_default
        })),
        // Add allocated markdown data
        allocated_markdown: page.allocated_markdown,
        source_location: page.source_location,
        allocation_confidence: page.allocation_confidence,
      }));

      // Update sitemap state with allocated data
      sitemapActions.setPages(pagesArray);
      console.log(`✅ Synced ${pagesArray.length} pages to Sitemap Provider with allocated_markdown`);
    }
  };

  const setAllocatedPagesSitemap = (pages: SitemapSection[] | null) => {
    setState(prev => ({ ...prev, allocatedPagesSitemap: pages }));
  };

  const setGeneratedScrapedSitemap = (pages: SitemapSection[] | null) => {
    setState(prev => ({ ...prev, generatedScrapedSitemap: pages }));
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
    setIsInitialized(false);
  };

  const getPersistedLastSource = (): 'default' | 'allocated' | 'scraped' | null => {
    if (!state.scrapedContent) return null;
    const domain = state.scrapedContent.domain;
    const persistedData = loadSitemapData(domain);
    return persistedData?.lastSelectedSource || null;
  };

  const saveLastSelectedSource = (source: 'default' | 'allocated' | 'scraped') => {
    if (!state.scrapedContent) return;
    const domain = state.scrapedContent.domain;
    updateSitemapData(domain, { lastSelectedSource: source });
  };

  const contextValue: MigrationWizardContextType = {
    state,
    actions: {
      setCurrentStep,
      setScrapedContent,
      setSelectedSitemap,
      setAllocatedSitemap,
      setAllocatedPagesSitemap,
      setGeneratedScrapedSitemap,
      setPageMappings,
      setGeneratedContent,
      setSelectedTemplate,
      setThemeSettings,
      nextStep,
      previousStep,
      resetWizard,
      getPersistedLastSource,
      saveLastSelectedSource,
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
