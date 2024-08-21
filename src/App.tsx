import React, { useState } from 'react';
import { SitemapSection } from './types/SitemapTypes';
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

  const exportJSON = () => {
    const exportData: { [key: string]: any } = {};
    pages.forEach(page => {
      exportData[page.title.toLowerCase()] = {
        page_id: page.id,
        wordpress_id: page.wordpress_id,
        model_query_pairs: page.items.map(item => [item.title, "query"])
      };
    });
    console.log(JSON.stringify(exportData, null, 2));
    return exportData;
  };

  return (
    <div className="app">
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
          </div>
          <SitemapSectionComponent 
            id={page.id} 
            title={page.title} 
            pageNumber={index + 1} // Pass the page number
          />
        </div>
      ))}
      <button className="app__add-page-button" onClick={() => addPage({ id: Date.now().toString(), title: 'New Page', items: [], wordpress_id: '' })}>
        Add Page
      </button>
      </div>
      <button className="app__export-json-button" onClick={exportJSON}>Export JSON</button>
    </div>
  );
};

export default App;