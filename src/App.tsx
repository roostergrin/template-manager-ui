import React, { useState } from 'react';
import { SitemapSection } from './types/SitemapTypes';
import SitemapSectionComponent from './components/SitemapSection/SitemapSection';

const App: React.FC = () => {
  const [sections, setSections] = useState<SitemapSection[]>([]);

  const addSection = (newSection: SitemapSection) => {
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const exportJSON = () => {
    const exportData: { [key: string]: any } = {};
    sections.forEach(section => {
      exportData[section.title.toLowerCase()] = {
        page_id: section.id,
        model_query_pairs: section.items.map(item => [item.title, "query"])
      };
    });
    console.log(JSON.stringify(exportData, null, 2));
    return exportData;
  };

  return (
    <div>
      <h1>Sitemap Builder</h1>
      {sections.map(section => (
        <SitemapSectionComponent 
          key={section.id} 
          id={section.id} 
          title={section.title} 
        />
      ))}
      <button onClick={() => addSection({ id: Date.now().toString(), title: 'New Section', items: [] })}>
        Add Section
      </button>
      <button onClick={exportJSON}>Export JSON</button>
    </div>
  );
};

export default App;