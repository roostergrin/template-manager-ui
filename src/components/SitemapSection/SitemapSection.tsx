import React from 'react';
import { SitemapItem as SitemapItemType } from '../../types/SitemapTypes';
import SitemapItemComponent from '../SitemapItem/SitemapItem';
import './SitemapSection.sass';

interface SitemapSectionProps {
  models: string[];
  title: string;
  pageID: string;
  pageNumber: number;
  items: SitemapItemType[];
  showSelect: boolean;
  showTextarea: boolean;
  showDeleteButtons: boolean;
  showItemNumbers: boolean;
  onItemsChange: (newItems: SitemapItemType[]) => void;
}

const SitemapSection: React.FC<SitemapSectionProps> = ({ 
  models, 
  title, 
  pageID, 
  pageNumber, 
  items, 
  showSelect,
  showTextarea,
  showDeleteButtons,
  showItemNumbers,
  onItemsChange 
}) => {
  // Add item function
  const addItem = () => {
    const newItem: SitemapItemType = { id: Date.now().toString(), model: models[0], query: '' };
    onItemsChange([...items, newItem]);
  };

  // Remove item function
  const removeItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  // Edit item function
  const editItem = (itemId: string, newModel: string, newQuery: string) => {
    onItemsChange(items.map(item => item.id === itemId ? { ...item, model: newModel, query: newQuery } : item));
  };

  return (
    <div className="sitemap-section">
      <ul className="sitemap-section__list">
        {items.map((item, index) => (
          <SitemapItemComponent
            key={item.id}
            item={item}
            itemNumber={`${pageNumber}.${index + 1}`}
            models={models}
            showSelect={showSelect}
            showTextarea={showTextarea}
            showDeleteButton={showDeleteButtons}
            showItemNumber={showItemNumbers}
            onEdit={editItem}
            onRemove={removeItem}
          />
        ))}
      </ul>
      <div className="sitemap-section__controls">
        <button className="sitemap-section__add-button" onClick={addItem}>Add Item</button>
      </div>
    </div>
  );
};

export default SitemapSection;