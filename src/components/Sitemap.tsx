import React, { useState, useEffect, useCallback } from 'react';
import { SitemapSection, SitemapItem } from '../types/SitemapTypes';
import SitemapSectionComponent from './SitemapSection/SitemapSection';
import SiteSelector from './SiteSelector';
import DefaultTemplateSelector from './DefaultTemplateSelector/DefaultTemplateSelector';

export interface SitemapProps {
  currentModels: string[];
  selectedModelGroupKey: string;
  setSelectedModelGroupKey: (key: string) => void;
  modelGroups: Record<string, string[]>;
  setModelGroups: (groups: Record<string, string[]>) => void;
  questionnaireData: any;
  setQuestionnaireData: (data: any) => void;
}

const Sitemap: React.FC<SitemapProps> = ({
  currentModels,
  selectedModelGroupKey,
  setSelectedModelGroupKey,
  modelGroups,
  setModelGroups,
  questionnaireData,
  setQuestionnaireData,
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
    link.download = 'sitemap_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.pages && typeof importedData.pages === 'object') {
        const entries = Object.entries(importedData.pages);
        const newPages: SitemapSection[] = entries.map(([title, pageData]) => {
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
        setPages(newPages);
      }
      if (importedData.selectedModelGroupKey && typeof importedData.selectedModelGroupKey === 'string') {
        setSelectedModelGroupKey(importedData.selectedModelGroupKey);
      }
      if (importedData.modelGroups && typeof importedData.modelGroups === 'object') {
        setModelGroups(importedData.modelGroups as Record<string, string[]>);
      }
      if (importedData.questionnaireData) {
        setQuestionnaireData(importedData.questionnaireData);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
    }
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
          onTemplateSelect={importJSON}
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
      <div className="app__actions">
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
    </>
  );
};

export default Sitemap; 