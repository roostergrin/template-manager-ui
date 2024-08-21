import React, { useState } from 'react';
import { SitemapItem } from '../../types/SitemapTypes';
import './SitemapSection.sass';

const models = ['Model1', 'Model2', 'Model3']; // Example models

const SitemapSection: React.FC<{ title: string, id: string, pageNumber: number }> = ({ title, id, pageNumber }) => {
  const [items, setItems] = useState<SitemapItem[]>([]);

  // Add item function
  const addItem = () => {
    const newItem: SitemapItem = { id: Date.now().toString(), model: models[0], query: '' };
    setItems([...items, newItem]);
  };

  // Remove item function
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Edit item function
  const editItem = (itemId: string, newModel: string, newQuery: string) => {
    setItems(items.map(item => item.id === itemId ? { ...item, model: newModel, query: newQuery } : item));
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, newModel: string, newQuery: string) => {
    if (e.key === 'Enter') {
      editItem(itemId, newModel, newQuery);
    }
  };

  return (
    <div className="sitemap-section">
      <ul className="sitemap-section__list">
        {items.map((item, index) => (
          <li key={item.id} className="sitemap-section__item">
            {`${pageNumber}.${index + 1}`}
            <div className="sitemap-section__select-container">
              <select
              className="sitemap-section__select"
              value={item.model}
              onChange={(e) => editItem(item.id, e.target.value, item.query)}
            >
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <textarea
              className="sitemap-section__input"
              value={item.query}
              onChange={(e) => editItem(item.id, item.model, e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, item.id, item.model, e.currentTarget.value)}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
            />
            </div>
            <button className="sitemap-section__button" onClick={() => removeItem(item.id)}>-</button>
          </li>
        ))}
      </ul>
      <div className="sitemap-section__controls">
        <button className="sitemap-section__add-button" onClick={addItem}>Add Item</button>
      </div>
    </div>
  );
};

export default SitemapSection;