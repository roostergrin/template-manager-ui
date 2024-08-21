import React, { useState } from 'react';
import { SitemapSection, SitemapItem } from './types/SitemapTypes';
import SitemapSectionComponent from './components/SitemapSection/SitemapSection';
import './App.sass';

const App: React.FC = () => {
  const [pages, setPages] = useState<SitemapSection[]>([]);

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
    const exportData: any[] = pages.map(page => ({
      title: page.title.toLowerCase(),
      page_id: page.id,
      wordpress_id: page.wordpress_id || '',
      model_query_pairs: page.items.map(item => [item.id, item.model, item.query])
    }));

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
      const newPages: SitemapSection[] = importedData.map((item: any) => ({
        id: item.page_id,
        title: item.title,
        wordpress_id: item.wordpress_id,
        items: item.model_query_pairs.map((pair: [string, string, string]) => ({
          id:    pair[0],
          model: pair[1],
          query: pair[2]
        }))
      }));
      setPages(newPages);
    } catch (error) {
      console.error('Error importing JSON:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="app">
      {/* TODO: add models dynamically */}
      {/* TODO: add the endpoint to post to. */}
      {/* TODO: add make google doc and link to it */}
      {/* <div className="app__header">
        models
      </div> */}
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
      </div>
    </div>
  );
};

export default App;