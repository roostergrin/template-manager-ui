import React from 'react';
import { SitemapItem as SitemapItemType } from '../../types/SitemapTypes';
import './SitemapItem.sass';

interface SitemapItemProps {
  item: SitemapItemType;
  itemNumber: string;
  models: string[];
  showSelect: boolean;
  showTextarea: boolean;
  showDeleteButton: boolean;
  showItemNumber: boolean;
  onEdit: (itemId: string, newModel: string, newQuery: string) => void;
  onRemove: (itemId: string) => void;
}

const SitemapItem: React.FC<SitemapItemProps> = ({ 
  item, 
  itemNumber, 
  models, 
  showSelect, 
  showTextarea, 
  showDeleteButton,
  showItemNumber,
  onEdit, 
  onRemove 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, newModel: string, newQuery: string) => {
    if (e.key === 'Enter') {
      onEdit(itemId, newModel, newQuery);
    }
  };

  return (
    <li className="sitemap-item">
      {showItemNumber && (
        <div className="sitemap-item__number">{itemNumber}</div>
      )}
      <div className={`sitemap-item__content ${!showItemNumber ? 'sitemap-item__content--full-width' : ''}`}>
        {showSelect && (
          <select
            className="sitemap-item__select"
            value={item.model}
            onChange={(e) => onEdit(item.id, e.target.value, item.query)}
          >
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        )}
        {showTextarea && (
          <textarea
            className="sitemap-item__input"
            value={item.query}
            onChange={(e) => onEdit(item.id, item.model, e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, item.id, item.model, e.currentTarget.value)}
            rows={1}
            onInput={(e) => {
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
          />
        )}
      </div>
      {showDeleteButton && (
        <button className="sitemap-item__remove-button" onClick={() => onRemove(item.id)}>-</button>
      )}
    </li>
  );
};

export default SitemapItem;
