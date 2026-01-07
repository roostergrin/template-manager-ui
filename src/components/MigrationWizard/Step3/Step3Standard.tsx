import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, FileText, Sparkles, CheckCircle, List, Maximize2, Download, Upload, Database, Clock, ChevronRight, Server, HardDrive } from 'lucide-react';
import { useMigrationWizard } from '../../../contexts/MigrationWizardProvider';
import { useAppConfig } from '../../../contexts/AppConfigProvider';
import { useSitemap } from '../../../contexts/SitemapProvider';
import SitemapListView from './components/SitemapListView';
import SitemapViewToggle from '../../Sitemap/SitemapViewToggle';
import useSecondPassAllocation from '../../../hooks/useSecondPassAllocation';
import useGenerateSitemap from '../../../hooks/useGenerateSitemap';
import useImportExport from '../../../hooks/useImportExport';
import useRagSitemap from '../../../hooks/useRagSitemap';
import { useSavedSitemaps } from '../../../hooks/useSavedSitemaps';
import { getSavedSitemap } from '../../../services/sitemapHistoryService';
import { getBackendSiteTypeForModelGroup } from '../../../utils/modelGroupKeyToBackendSiteType';
import { modelGroups } from '../../../modelGroups';
import { VectorStore } from '../../../types/SitemapTypes';
import './Step3Standard.sass';

type SitemapViewMode = 'compact' | 'full';

const LOCAL_STORAGE_KEY = 'generatedSitemaps';

const getStoredSitemaps = (): { name: string; created: string; sitemap: any }[] => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const Step3Standard: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();

  const [secondPassData, secondPassStatus, secondPassMutation] = useSecondPassAllocation();
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const { exportJson, importJson } = useImportExport();

  // Get vector stores for the domain
  const domain = state.scrapedContent?.domain || '';
  const { vectorStores, vectorStoresLoading } = useRagSitemap(domain);

  // Get saved sitemaps from backend
  const { data: backendSitemaps, isLoading: backendSitemapsLoading, refetch: refetchBackendSitemaps } = useSavedSitemaps();

  const [selectedSitemapName, setSelectedSitemapName] = useState<string>('');
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [sitemapViewMode, setSitemapViewMode] = useState<SitemapViewMode>('compact');
  const [isDragOver, setIsDragOver] = useState(false);
  const [localSelectedVectorStore, setLocalSelectedVectorStore] = useState<VectorStore | null>(null);
  const hasProcessedGenerationRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';
  const pages = sitemapState.pages;
  const scrapedContent = state.scrapedContent;

  // Use local selection or context selection for vector store
  const selectedVectorStore = localSelectedVectorStore || state.selectedVectorStore;

  // Get default sitemaps for the selected template
  const defaultSitemaps = useMemo(() => {
    const selectedGroup = modelGroups[selectedModelGroupKey];
    if (!selectedGroup?.templates) return [];
    return selectedGroup.templates.map((template, idx) => ({
      id: `default-${selectedModelGroupKey}-${idx}`,
      name: template.name || `${selectedGroup.displayName || selectedModelGroupKey} Default`,
      data: template.data,
    }));
  }, [selectedModelGroupKey]);

  // Merge backend sitemaps WITH localStorage sitemaps
  const generatedSitemaps = useMemo(() => {
    const combined: Array<{
      id: string;
      name: string;
      source: 'backend' | 'local';
      filename?: string;
      data?: any;
      created: string;
    }> = [];

    // Add backend sitemaps (from server folder)
    if (backendSitemaps) {
      backendSitemaps.forEach((meta) => {
        combined.push({
          id: `backend-${meta.filename}`,
          name: meta.name,
          source: 'backend' as const,
          filename: meta.filename,
          created: meta.created,
        });
      });
    }

    // Add localStorage sitemaps
    const localSitemaps = getStoredSitemaps();
    localSitemaps.forEach((stored, idx) => {
      combined.push({
        id: `local-${idx}`,
        name: stored.name,
        source: 'local' as const,
        data: stored.sitemap,
        created: stored.created,
      });
    });

    // Sort by date, most recent first
    combined.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    return combined;
  }, [backendSitemaps]);

  // Process sitemap data and load into state
  const processSitemapData = useCallback((sitemapData: any) => {
    if (sitemapData) {
      if (sitemapData.pages) {
        const pagesArray = Object.entries(sitemapData.pages).map(([title, pageData]: [string, any]) => ({
          id: pageData.internal_id || `page-${title.toLowerCase().replace(/\s+/g, '-')}`,
          title,
          path: `/${title.toLowerCase().replace(/\s+/g, '-')}`,
          wordpress_id: pageData.page_id || '',
          items: (pageData.model_query_pairs || []).map((pair: any) => ({
            id: pair.internal_id || `${title}-${pair.model}`,
            model: pair.model,
            query: pair.query,
            useDefault: pair.use_default,
            preserve_image: pair.preserve_image
          })),
          allocated_markdown: pageData.allocated_markdown,
          allocation_confidence: pageData.allocation_confidence,
          source_location: pageData.source_location,
        }));
        sitemapActions.setPages(pagesArray);
      } else {
        const jsonString = JSON.stringify(sitemapData);
        sitemapActions.importPagesFromJson(jsonString);
      }
    }
  }, [sitemapActions]);

  // Load a sitemap (default, local, or backend)
  const loadSitemap = useCallback(async (item: { name: string; source?: 'backend' | 'local'; filename?: string; data?: any }) => {
    setSelectedSitemapName(item.name);

    if (item.source === 'backend' && item.filename) {
      // Fetch from backend API
      setIsLoadingSitemap(true);
      try {
        const sitemapData = await getSavedSitemap(item.filename);
        processSitemapData(sitemapData);
      } catch (error) {
        console.error('Failed to load sitemap from backend:', error);
      } finally {
        setIsLoadingSitemap(false);
      }
    } else if (item.data) {
      // Use inline data (localStorage or default templates)
      processSitemapData(item.data);
    }
  }, [processSitemapData]);

  // Legacy loadSitemap for default templates (takes data directly)
  const loadDefaultSitemap = useCallback((sitemapData: any, name: string) => {
    setSelectedSitemapName(name);
    processSitemapData(sitemapData);
  }, [processSitemapData]);

  // Handle vector store selection
  const handleVectorStoreChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const vsId = e.target.value;
    if (!vsId) {
      setLocalSelectedVectorStore(null);
      actions.setSelectedVectorStore(null as any);
      return;
    }
    const vs = vectorStores.find(v => v.vector_store_id === vsId);
    if (vs) {
      setLocalSelectedVectorStore(vs);
      actions.setSelectedVectorStore(vs);
    }
  }, [vectorStores, actions]);

  // Handle second pass allocation
  const handleAllocateMarkdown = useCallback(() => {
    if (!selectedVectorStore || !scrapedContent || pages.length === 0) {
      console.error('Missing requirements for allocation');
      return;
    }

    const pagesObject: Record<string, any> = {};
    pages.forEach((page) => {
      const pageTitle = page.title || 'Untitled';
      pagesObject[pageTitle] = {
        internal_id: page.id,
        page_id: page.wordpress_id || page.id,
        title: pageTitle,
        model_query_pairs: (page.items || []).map((item: any) => ({
          model: item.model,
          query: item.query,
          internal_id: item.id,
          use_default: item.useDefault,
          preserve_image: item.preserve_image
        })),
      };
    });

    console.log('🚀 Starting Second Pass Allocation');
    console.log(`📊 Vector Store: ${selectedVectorStore.vector_store_id}`);
    console.log(`📄 Pages: ${pages.length}`);

    secondPassMutation({
      vector_store_id: selectedVectorStore.vector_store_id,
      sitemap_pages: pagesObject,
      domain: scrapedContent.domain,
    });
  }, [selectedVectorStore, scrapedContent, pages, secondPassMutation]);

  // Handle second pass success
  useEffect(() => {
    if (secondPassStatus === 'success' && secondPassData?.enhanced_sitemap) {
      console.log('✅ Second Pass successful, updating sitemap with allocated markdown');

      const enhancedPages = secondPassData.enhanced_sitemap.pages;
      const updatedPages = pages.map(page => {
        const matchingPage = enhancedPages[page.title];
        if (matchingPage) {
          return {
            ...page,
            allocated_markdown: matchingPage.allocated_markdown,
          };
        }
        return page;
      });

      sitemapActions.setPages(updatedPages);
      actions.setAllocatedPagesSitemap(updatedPages);
    }
  }, [secondPassStatus, secondPassData, pages, sitemapActions, actions]);

  // Handle sitemap generation (strict mode)
  const handleGenerateSitemap = useCallback(() => {
    if (!scrapedContent) {
      console.error('No scraped content available');
      return;
    }

    const pagesObject: Record<string, any> = {};
    pages.forEach((page) => {
      const pageTitle = page.title || 'Untitled';
      pagesObject[pageTitle] = {
        internal_id: page.id,
        page_id: page.wordpress_id || page.id,
        model_query_pairs: (page.items || []).map((item: any) => ({
          model: item.model,
          query: item.query,
          internal_id: item.id,
          use_default: item.useDefault,
          preserve_image: item.preserve_image
        })),
        ...(page.allocated_markdown && { allocated_markdown: page.allocated_markdown }),
      };
    });

    const sitemapToSend = {
      pages: pagesObject,
      modelGroups: [],
      siteType: backendSiteType,
    };

    console.log('🚀 Generating sitemap in Strict Template Mode');
    generateSitemap({
      scraped_content: scrapedContent,
      site_type: backendSiteType,
      sitemap: sitemapToSend,
      strict_template_mode: true,
    } as any);
  }, [scrapedContent, pages, backendSiteType, generateSitemap]);

  // Store original preserve_image values before generation
  const originalPreserveImageMapRef = useRef<Map<string, boolean>>(new Map());

  // Handle generate success
  useEffect(() => {
    if (generateSitemapStatus === 'success' && generateSitemapData?.sitemap_data && !hasProcessedGenerationRef.current) {
      hasProcessedGenerationRef.current = true;
      console.log('✅ Sitemap generated successfully');

      const sitemapData = generateSitemapData.sitemap_data as any;
      if (sitemapData.pages) {
        const pagesArray = Object.entries(sitemapData.pages).map(([title, pageData]: [string, any]) => ({
          id: pageData.internal_id || `page-${title.toLowerCase().replace(/\s+/g, '-')}`,
          title,
          path: `/${title.toLowerCase().replace(/\s+/g, '-')}`,
          wordpress_id: pageData.page_id || '',
          items: (pageData.model_query_pairs || []).map((pair: any) => {
            const itemId = pair.internal_id || `${title}-${pair.model}`;
            // Restore preserve_image from original sitemap if not in generated data
            const preserveImage = pair.preserve_image ?? originalPreserveImageMapRef.current.get(itemId);
            return {
              id: itemId,
              model: pair.model,
              query: pair.query,
              useDefault: pair.use_default,
              preserve_image: preserveImage
            };
          }),
          allocated_markdown: pageData.allocated_markdown,
        }));
        sitemapActions.setPages(pagesArray);
      }
    }

    if (generateSitemapStatus === 'pending') {
      hasProcessedGenerationRef.current = false;
      // Store preserve_image values before generation starts
      originalPreserveImageMapRef.current.clear();
      pages.forEach(page => {
        page.items.forEach(item => {
          if (item.preserve_image !== undefined) {
            originalPreserveImageMapRef.current.set(item.id, item.preserve_image);
          }
        });
      });
      console.log('📸 Stored preserve_image values for', originalPreserveImageMapRef.current.size, 'items');
    }
  }, [generateSitemapStatus, generateSitemapData, sitemapActions, pages]);

  const canAllocate = selectedVectorStore && pages.length > 0;
  const canGenerate = scrapedContent && pages.length > 0;
  const isAllocating = secondPassStatus === 'pending';
  const isGenerating = generateSitemapStatus === 'pending';

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = e.target.value;
    if (newKey && modelGroups[newKey]) {
      appConfigActions.setSelectedModelGroup(newKey);
      setSelectedSitemapName('');
    }
  };

  // Handle file import
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          importJson(event.target.result as string);
          setSelectedSitemapName('');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [importJson]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    const isJsonFile = file && (file.type === 'application/json' || file.name.endsWith('.json'));
    if (isJsonFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          importJson(event.target.result as string);
          setSelectedSitemapName('');
        }
      };
      reader.readAsText(file);
    }
  }, [importJson]);

  return (
    <div className="step3-standard">
      {/* Template Selection with Default Sitemaps */}
      <section className="step3-standard__section">
        <h3 className="step3-standard__section-title">
          <FileText size={18} />
          Template
        </h3>
        <select
          className="step3-standard__template-select"
          value={selectedModelGroupKey}
          onChange={handleTemplateChange}
          disabled={isAllocating || isGenerating}
        >
          {Object.entries(modelGroups).map(([key, group]) => (
            <option key={key} value={key}>
              {group.displayName || key}
            </option>
          ))}
        </select>

        {/* Default Sitemaps for this template */}
        {defaultSitemaps.length > 0 && (
          <div className="step3-standard__defaults">
            <span className="step3-standard__defaults-label">Default Sitemaps:</span>
            <div className="step3-standard__defaults-list">
              {defaultSitemaps.map((sitemap) => (
                <button
                  key={sitemap.id}
                  className={`step3-standard__default-item ${selectedSitemapName === sitemap.name ? 'step3-standard__default-item--active' : ''}`}
                  onClick={() => loadDefaultSitemap(sitemap.data, sitemap.name)}
                  disabled={isAllocating || isGenerating}
                >
                  <ChevronRight size={14} />
                  <span>{sitemap.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sitemap History */}
      <section className="step3-standard__section">
        <h3 className="step3-standard__section-title">
          <Clock size={18} />
          Sitemap History
          {backendSitemapsLoading && <Loader2 size={14} className="spinning" style={{ marginLeft: '0.5rem' }} />}
        </h3>
        {generatedSitemaps.length > 0 ? (
          <div className="step3-standard__history-list">
            {generatedSitemaps.map((sitemap) => (
              <button
                key={sitemap.id}
                className={`step3-standard__history-item ${selectedSitemapName === sitemap.name ? 'step3-standard__history-item--active' : ''}`}
                onClick={() => loadSitemap(sitemap)}
                disabled={isAllocating || isGenerating || isLoadingSitemap}
              >
                <div className="step3-standard__history-item-info">
                  <span className="step3-standard__history-item-name">
                    {sitemap.source === 'backend' ? (
                      <Server size={12} style={{ marginRight: '0.375rem', opacity: 0.6 }} />
                    ) : (
                      <HardDrive size={12} style={{ marginRight: '0.375rem', opacity: 0.6 }} />
                    )}
                    {sitemap.name}
                  </span>
                  {sitemap.created && (
                    <span className="step3-standard__history-item-date">
                      {new Date(sitemap.created).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {selectedSitemapName === sitemap.name && (
                  isLoadingSitemap ? <Loader2 size={14} className="spinning" /> : <CheckCircle size={14} />
                )}
              </button>
            ))}
          </div>
        ) : backendSitemapsLoading ? (
          <div className="step3-standard__empty-history">
            Loading saved sitemaps...
          </div>
        ) : (
          <div className="step3-standard__empty-history">
            No generated sitemaps yet. Generate one using the actions below.
          </div>
        )}
      </section>

      {/* Actions with Vector Store Selector */}
      <section className="step3-standard__section step3-standard__actions">
        <div className="step3-standard__action-row">
          {/* Vector Store Selector */}
          <div className="step3-standard__vector-store-select">
            <label className="step3-standard__vector-store-label">
              <Database size={16} />
              Vector Store
            </label>
            <select
              className="step3-standard__template-select"
              value={selectedVectorStore?.vector_store_id || ''}
              onChange={handleVectorStoreChange}
              disabled={isAllocating || isGenerating || vectorStoresLoading}
            >
              <option value="">Select a vector store...</option>
              {vectorStores.map((vs) => (
                <option key={vs.vector_store_id} value={vs.vector_store_id}>
                  {vs.vector_store_id.substring(0, 12)}... ({vs.page_count} pages)
                </option>
              ))}
            </select>
            {vectorStores.length === 0 && !vectorStoresLoading && (
              <span className="step3-standard__vector-store-hint">
                Create a vector store in Step 2
              </span>
            )}
          </div>

          {/* Allocate Markdown Button */}
          <button
            className="step3-standard__action-btn step3-standard__action-btn--primary"
            onClick={handleAllocateMarkdown}
            disabled={!canAllocate || isAllocating || isGenerating}
            title={!selectedVectorStore ? 'Select a vector store first' : ''}
          >
            {isAllocating ? (
              <>
                <Loader2 size={16} className="spinning" />
                Allocating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Allocate Markdown
              </>
            )}
          </button>
        </div>

        <div className="step3-standard__action-row">
          <button
            className="step3-standard__action-btn step3-standard__action-btn--secondary"
            onClick={handleGenerateSitemap}
            disabled={!canGenerate || isAllocating || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="spinning" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Sitemap (Strict Mode)
              </>
            )}
          </button>
        </div>
      </section>

      {/* Sitemap Preview */}
      <section
        ref={dropZoneRef}
        className={`step3-standard__section step3-standard__drop-zone ${isDragOver ? 'step3-standard__drop-zone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="step3-standard__drop-overlay">
            <Upload size={32} />
            <span>Drop JSON file to import</span>
          </div>
        )}
        <div className="step3-standard__section-header">
          <h3 className="step3-standard__section-title">
            <FileText size={18} />
            Sitemap {sitemapViewMode === 'compact' ? 'Preview' : 'Editor'}
            {selectedSitemapName && (
              <span className="step3-standard__loaded-name">({selectedSitemapName})</span>
            )}
          </h3>
          <div className="step3-standard__header-actions">
            <button
              className="step3-standard__edit-btn"
              onClick={exportJson}
              title="Export sitemap as JSON"
              disabled={pages.length === 0}
            >
              <Download size={16} />
              Export
            </button>
            <button
              className="step3-standard__edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import sitemap from JSON file (or drag & drop)"
            >
              <Upload size={16} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            {pages.length > 0 && (
              <button
                className="step3-standard__edit-btn"
                onClick={() => setSitemapViewMode(sitemapViewMode === 'compact' ? 'full' : 'compact')}
                title={sitemapViewMode === 'compact' ? 'Switch to full editor' : 'Switch to compact view'}
              >
                {sitemapViewMode === 'compact' ? (
                  <>
                    <Maximize2 size={16} />
                    Full Editor
                  </>
                ) : (
                  <>
                    <List size={16} />
                    Compact View
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        {pages.length > 0 ? (
          sitemapViewMode === 'compact' ? (
            <SitemapListView pages={pages} />
          ) : (
            <SitemapViewToggle />
          )
        ) : (
          <div className="step3-standard__empty">
            Select a sitemap above or drag & drop a JSON file
          </div>
        )}
      </section>
    </div>
  );
};

export default Step3Standard;
