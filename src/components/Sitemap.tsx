import React, { useState, useEffect } from 'react';
import { SitemapSection, SitemapItem } from '../types/SitemapTypes';
import SitemapSectionComponent from './SitemapSection/SitemapSection';
import SiteSelector from './SiteSelector';
import DefaultTemplateSelector from './DefaultTemplateSelector/DefaultTemplateSelector';
import useGenerateSitemap from '../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../utils/modelGroupKeyToBackendSiteType';

export interface SitemapProps {
  currentModels: string[];
  selectedModelGroupKey: string;
  setSelectedModelGroupKey: (key: string) => void;
  modelGroups: Record<string, string[]>;
  setModelGroups: (groups: Record<string, string[]>) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
}

// Define a type for questionnaireData (customize as needed)
type QuestionnaireData = Record<string, any>;

const Sitemap: React.FC<SitemapProps> = ({
  currentModels,
  selectedModelGroupKey,
  setSelectedModelGroupKey,
  modelGroups,
  setModelGroups,
  questionnaireData,
  setQuestionnaireData
}) => {
  const [pages, setPages] = useState<SitemapSection[]>([]);
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);
  // View mode states
  const [showSelect, setShowSelect] = useState<boolean>(true);
  const [showTextarea, setShowTextarea] = useState<boolean>(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState<boolean>(false);
  const [showItemNumbers, setShowItemNumbers] = useState<boolean>(false);
  const [showPageIds, setShowPageIds] = useState<boolean>(false);
  const [gridColumnWidth, setGridColumnWidth] = useState<number>(175);
  const [useGridLayout, setUseGridLayout] = useState<boolean>(true);
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const [usePageJson, setUsePageJson] = useState<boolean>(false);
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey);
  const addPage = (newPage: SitemapSection) => {
    setPages([...pages, newPage]);
  };

  const removePage = (pageId: string) => {
    setPages(pages.filter(page => page.id !== pageId));
  };

  const updatePageTitle = (pageId: string, newTitle: string) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, title: newTitle } : page
    ));
  };

  const updatePageWordpressId = (pageId: string, newWordpressId: string) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, wordpress_id: newWordpressId } : page
    ));
  };

  const updatePageItems = (pageId: string, newItems: SitemapItem[]) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, items: newItems } : page
    ));
  };

  // Reset the update indicator after a brief period
  useEffect(() => {
    if (dataUpdated) {
      const timer = setTimeout(() => {
        setDataUpdated(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dataUpdated]);

  useEffect(() => {
    if (generateSitemapData && generateSitemapData.sitemap_data) {
      // Assume sitemap_data is in the same format as export/import JSON pages
      console.log(generateSitemapData.sitemap_data.pages);
      setPages(mapImportedPages(generateSitemapData.sitemap_data.pages));
    }
  }, [generateSitemapData]);

  const toggleSelectVisibility = () => {
    setShowSelect(!showSelect);
  };
  const toggleTextareaVisibility = () => {
    setShowTextarea(!showTextarea);
  };
  const toggleDeleteButtonsVisibility = () => {
    setShowDeleteButtons(!showDeleteButtons);
  };
  const toggleItemNumbersVisibility = () => {
    setShowItemNumbers(!showItemNumbers);
  };
  const togglePageIdsVisibility = () => {
    setShowPageIds(!showPageIds);
  };
  const handleGridWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridColumnWidth(Number(e.target.value));
  };
  const toggleGridLayout = () => {
    setUseGridLayout(!useGridLayout);
  };

  const gridContainerStyle = useGridLayout ? {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${gridColumnWidth}px, 1fr))`,
    gap: '1rem',
    marginBottom: '1.5rem'
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginBottom: '1.5rem'
  };

  const exportJSON = () => {
    const exportData = {
      pages: pages.reduce((acc, page) => ({
        ...acc,
        [page.title]: {
          internal_id: page.id,
          page_id: page.wordpress_id || '',
          model_query_pairs: page.items.map((item: SitemapItem) => ({
            model: item.model,
            query: item.query,
            internal_id: item.id
          }))
        }
      }), {}),
      selectedModelGroupKey,
      modelGroups,
      questionnaireData
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const rawPractice = questionnaireData.practiceBasics.practiceName || 'export';
    const practiceName = rawPractice.toString().replace(/\s+/g, '_');
    const siteType = selectedModelGroupKey.replace(/\s+/g, '_');
    link.download = `${siteType}_${practiceName}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to map imported pages to SitemapSection[]
  const mapImportedPages = (pagesObj: any): SitemapSection[] => {
    if (!pagesObj || typeof pagesObj !== 'object') return [];
    return Object.entries(pagesObj).map(([title, pageData]) => {
      const typedPageData = pageData as {
        internal_id: string;
        page_id: string;
        model_query_pairs: Array<{
          model: string;
          query: string;
          internal_id: string;
        }>;
      };
      return {
        id: typedPageData.internal_id,
        title: title,
        wordpress_id: typedPageData.page_id || '',
        items: typedPageData.model_query_pairs.map(item => ({
          model: item.model,
          query: item.query,
          id: item.internal_id
        }))
      };
    });
  };

  const importJSON = (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.pages) {
        setPages(mapImportedPages(importedData.pages));
      }
      if (importedData.selectedModelGroupKey && typeof importedData.selectedModelGroupKey === 'string') {
        setSelectedModelGroupKey(importedData.selectedModelGroupKey);
      }
      if (importedData.modelGroups && typeof importedData.modelGroups === 'object') {
        setModelGroups(importedData.modelGroups as Record<string, string[]>);
      }
      if (
        importedData.questionnaireData &&
        typeof importedData.questionnaireData === 'object' &&
        Object.keys(importedData.questionnaireData).length > 0
      ) {
        setQuestionnaireData(importedData.questionnaireData);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
    }
  };

  // Handler to load template pages without overriding questionnaireData or other settings
  const importTemplateData = (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.pages) {
        setPages(mapImportedPages(importedData.pages));
      }
    } catch (error) {
      console.error('Error loading template JSON:', error);
    }
  };

  const handleToggleUsePageJson = () => {
    setUsePageJson((prev) => !prev);
  };

  return (
    <>
      <h2>Sitemap Builder</h2>
      <div className="app__header">
        <SiteSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onModelGroupChange={setSelectedModelGroupKey}
        />
        <DefaultTemplateSelector 
          selectedModelGroupKey={selectedModelGroupKey}
          onTemplateSelect={importTemplateData}
        />
      </div>
      <div className="app__view-controls">
        <div className="app__view-control">
          <label>
            <input 
              type="checkbox" 
              checked={showSelect} 
              onChange={toggleSelectVisibility} 
            />
            Show Model Selectors
          </label>
        </div>
        <div className="app__view-control">
          <label>
            <input 
              type="checkbox" 
              checked={showTextarea} 
              onChange={toggleTextareaVisibility} 
            />
            Show Query Inputs
          </label>
        </div>
        <div className="app__view-control">
          <label>
            <input 
              type="checkbox" 
              checked={showDeleteButtons} 
              onChange={toggleDeleteButtonsVisibility} 
            />
            Show Delete Buttons
          </label>
        </div>
        <div className="app__view-control">
          <label>
            <input 
              type="checkbox" 
              checked={showItemNumbers} 
              onChange={toggleItemNumbersVisibility} 
            />
            Show Item Numbers
          </label>
        </div>
        <div className="app__view-control">
          <label>
            <input 
              type="checkbox" 
              checked={showPageIds} 
              onChange={togglePageIdsVisibility} 
            />
            Show Page IDs
          </label>
        </div>
      </div>
      <div className="app__layout-controls">
        <div className="app__grid-layout-control">
          <label>
            <input 
              type="checkbox" 
              checked={useGridLayout} 
              onChange={toggleGridLayout} 
            />
            Use Grid Layout
          </label>
        </div>
        {useGridLayout && (
          <div className="app__grid-width-control">
            <label>
              Grid Column Width: {gridColumnWidth}px
              <input
                type="range"
                min="100"
                max="550"
                step="25"
                value={gridColumnWidth}
                onChange={handleGridWidthChange}
                className="app__grid-width-slider"
              />
            </label>
          </div>
        )}
      </div>
      <div style={gridContainerStyle} className="app__page-container">
        {pages.map((page, index) => (
          <div key={page.id} className="app__page app__page--compact">
            <div className="app__page-header">
              {showItemNumbers && (
                <span className="app__page-number">{`${index + 1}.0`}</span>
              )}
              <input
                type="text" 
                className="app__page-title-input"
                value={page.title} 
                onChange={(e) => updatePageTitle(page.id, e.target.value)} 
                placeholder="Page Title"
              />
              <div className="app__page-controls">
                {showPageIds && (
                  <input
                    type="text" 
                    className="app__page-wordpress-id-input"
                    placeholder="Page ID"
                    value={page.wordpress_id || ''} 
                    onChange={(e) => updatePageWordpressId(page.id, e.target.value)} 
                  />
                )}
                {showDeleteButtons && (
                  <button 
                    className="app__delete-page-button" 
                    onClick={() => removePage(page.id)}
                  >
                    -
                  </button>
                )}
              </div>
            </div>
            <SitemapSectionComponent 
              models={currentModels}
              pageID={page.id} 
              title={page.title} 
              pageNumber={index + 1}
              items={page.items}
              showSelect={showSelect}
              showTextarea={showTextarea}
              showDeleteButtons={showDeleteButtons}
              showItemNumbers={showItemNumbers}
              onItemsChange={(newItems) => updatePageItems(page.id, newItems)}
            />
          </div>
        ))}
        <button className="app__add-page-button" onClick={() => addPage({ id: Date.now().toString(), title: 'New Page', items: [], wordpress_id: '' })}>
          Add Page
        </button>
      </div>
      <div className="app__actions flex flex-col gap-2 items-start mt-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium" aria-label="Current Site Type" tabIndex={0}>
            Current Site Type: 
            <span className="text-blue-700">{backendSiteType}</span>
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={usePageJson}
              onChange={handleToggleUsePageJson}
              aria-label="Use Page JSON"
              tabIndex={0}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700">Use Page JSON</span>
          </label>
        </div>
        <div className="flex gap-4 items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() =>
              generateSitemap({
                questionnaire: questionnaireData,
                site_type: backendSiteType,
                use_page_json: usePageJson,
              })
            }
            aria-label="Generate Sitemap"
            tabIndex={0}
          >
            Generate Sitemap
          </button>
          <button className="app__export-json-button" onClick={exportJSON}>Export JSON</button>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    importJSON(event.target.result as string);
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Sitemap; 