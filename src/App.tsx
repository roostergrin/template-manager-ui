import React, { useState, useEffect, useCallback } from 'react';
import { SitemapSection, SitemapItem } from './types/SitemapTypes';
import QuestionnaireForm, { QuestionnaireData } from './components/QuestionnaireForm';
import './App.sass';
import { initialModelGroups } from './modelGroups';

const App: React.FC = () => {
  const [pages, setPages] = useState<SitemapSection[]>([]);
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);

  const currentModels = modelGroups[selectedModelGroupKey];

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

  // Memoize the function to prevent it from being recreated on every render
  const handleQuestionnaireSubmit = useCallback((formData: QuestionnaireData) => {
    setQuestionnaireData(formData);
    setDataUpdated(true);
  }, []); // Empty dependency array means this function reference stays stable

  // Reset the update indicator after a brief period
  useEffect(() => {
    if (dataUpdated) {
      const timer = setTimeout(() => {
        setDataUpdated(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [dataUpdated]);

  const exportJSON = () => {
    const exportData = {
      pages: pages.reduce((acc, page) => ({
        ...acc,
        [page.title.toLowerCase()]: {
          internal_id: page.id,
          page_id: page.wordpress_id || '',
          model_query_pairs: page.items.map((item: SitemapItem) => [item.model, item.query, item.id])
        }
      }), {}),
      selectedModelGroupKey,
      modelGroups,
      questionnaireData
    };

    console.log(exportData)

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
      
      // Type casting to ensure proper type safety
      if (importedData.pages && typeof importedData.pages === 'object') {
        const entries = Object.entries(importedData.pages);
        const newPages: SitemapSection[] = entries.map(([title, pageData]) => {
          // Safely cast pageData
          const typedPageData = pageData as {
            internal_id: string;
            page_id: string;
            model_query_pairs: [string, string, string][];
          };
          
          return {
            id: typedPageData.internal_id,
            title: title,
            wordpress_id: typedPageData.page_id,
            items: Array.isArray(typedPageData.model_query_pairs) 
              ? typedPageData.model_query_pairs.map((pair) => ({
                  model: pair[0],
                  query: pair[1],
                  id: pair[2]
                }))
              : []
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
        setQuestionnaireData(importedData.questionnaireData as QuestionnaireData);
      }
      
    } catch (error) {
      console.error('Error importing JSON:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="app">
      <div className="app__questionnaire-container">
        <QuestionnaireForm onSubmit={handleQuestionnaireSubmit} />
      </div>
      
      <h2>Sitemap Builder</h2>
      <div className="app__header">
        <select
          value={selectedModelGroupKey}
          onChange={(e) => setSelectedModelGroupKey(e.target.value)}
        >
          {Object.entries(modelGroups).map(([key]) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div className="app__page-container">
        {pages.map((page, index) => (
          <div key={page.id} className="app__page">
            <div className="app__page-header">
              <span className="app__page-number">{`${index + 1}.0`}</span>
              <input
                type="text" 
                className="app__page-title-input"
                value={page.title} 
                onChange={(e) => updatePageTitle(page.id, e.target.value)} 
              />
              <input
                type="text" 
                className="app__page-wordpress-id-input"
                placeholder="page ID"
                value={page.wordpress_id || ''} 
                onChange={(e) => updatePageWordpressId(page.id, e.target.value)} 
              />
              <button 
                className="app__delete-page-button" 
                onClick={() => removePage(page.id)}
              >
                -
              </button>
            </div>
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
    </div>
  );
};

export default App;