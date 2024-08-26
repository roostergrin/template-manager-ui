import React, { useState } from 'react';
import { SitemapSection, SitemapItem } from './types/SitemapTypes';
import SitemapSectionComponent from './components/SitemapSection/SitemapSection';
import './App.sass';
import { initialModelGroups } from './modelGroups';

const App: React.FC = () => {
  const [pages, setPages] = useState<SitemapSection[]>([]);
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [adjustableParameters, setAdjustableParameters] = useState<string>(
    `PLEASE USE THIS PART FOR THE TONE AND AESTHETICS. DON"T USE THIS AS CONTENT.
Site Purpose/Vision: Updated site representing expertise, quality of care, and community culture
Audience: Primary: Moms/parents, Secondary: Young adults
Writing Style: Professional with energy
Current Content Likes/Dislikes: Likes thoroughness, dislikes need for SEO optimization and simplification
Preferred Photography Style: Lifestyle
Website Adjectives: Approachable, Friendly, Professional, Clean, Modern`
  );

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

  const exportJSON = () => {
    const exportData = {
      pages: pages.reduce((acc, page) => ({
        ...acc,
        [page.title.toLowerCase()]: {
          internal_id: page.id,
          page_id: page.wordpress_id || '',
          model_query_pairs: page.items.map(item => [item.model, item.query, item.id])
        }
      }), {}),
      selectedModelGroupKey,
      modelGroups,
      adjustableParameters
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
      const newPages: SitemapSection[] = Object.entries(importedData.pages).map(([title, pageData]: [string, any]) => ({
        id: pageData.internal_id,
        title: title,
        wordpress_id: pageData.page_id,
        items: pageData.model_query_pairs.map((pair: [string, string, string]) => ({
          model: pair[0],
          query: pair[1],
          id:    pair[2]
        }))
      }));
      setPages(newPages);
      setSelectedModelGroupKey(importedData.selectedModelGroupKey);
      setModelGroups(importedData.modelGroups);
      if (importedData.adjustableParameters) {
        setAdjustableParameters(importedData.adjustableParameters);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="app">
      <div className="app__header">
        <select
          value={selectedModelGroupKey}
          onChange={(e) => setSelectedModelGroupKey(e.target.value)}
        >
          {Object.entries(modelGroups).map(([key, group]) => (
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
          <SitemapSectionComponent 
            models={currentModels}
            pageID={page.id} 
            title={page.title} 
            pageNumber={index + 1}
            items={page.items}
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
        <textarea
          className="app__adjustable-parameters"
          value={adjustableParameters}
          onChange={(e) => setAdjustableParameters(e.target.value)}
          rows={10}
          style={{ width: '100%', marginTop: '20px' }}
        />
      </div>
    </div>
  );
};

export default App;