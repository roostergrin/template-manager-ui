import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  isCompactMode?: boolean;
  onEdit: (itemId: string, newModel: string, newQuery: string, useDefault?: boolean) => void;
  onRemove: (itemId: string) => void;
  containerId?: string;
}

const SitemapItem: React.FC<SitemapItemProps> = ({ 
  item, 
  itemNumber, 
  models, 
  showSelect, 
  showTextarea, 
  showDeleteButton,
  showItemNumber,
  isCompactMode = false,
  onEdit, 
  onRemove,
  containerId
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, data: { type: 'item', containerId } });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, newModel: string, newQuery: string) => {
    if (e.key === 'Enter') {
      onEdit(itemId, newModel, newQuery, item.useDefault);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`sitemap-item ${isCompactMode ? 'sitemap-item--compact' : 'sitemap-item--expanded'} ${item.useDefault ? 'sitemap-item--default-active' : ''}`}
    >
      <div className="sitemap-item__left-controls" aria-label="Item controls">
        <button
          className={`sitemap-item__default-toggle ${item.useDefault ? 'sitemap-item__default-toggle--active' : ''}`}
          onClick={() => onEdit(item.id, item.model, item.query, !item.useDefault)}
          aria-pressed={!!item.useDefault}
          aria-label="Use defaults for this component"
          tabIndex={0}
        >
          D
        </button>
        <button
          className="sitemap-item__handle"
          aria-label="Drag item"
          tabIndex={0}
          role="button"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      </div>
      {showItemNumber && (
        <div className="sitemap-item__number">{itemNumber}</div>
      )}
      <div className={`sitemap-item__content ${!showItemNumber ? 'sitemap-item__content--full-width' : ''}`}>
        {showSelect && (
          <select
            className="sitemap-item__select"
            value={item.model}
            onChange={(e) => onEdit(item.id, e.target.value, item.query, item.useDefault)}
            aria-label="Model selector"
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
            onChange={(e) => onEdit(item.id, item.model, e.target.value, item.useDefault)}
            onKeyPress={(e) => handleKeyPress(e, item.id, item.model, e.currentTarget.value)}
            rows={2}
            aria-label="Query input"
            onInput={(e) => {
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
          />
        )}
      </div>
      {showDeleteButton && (
        <button className="sitemap-item__remove-button" onClick={() => onRemove(item.id)} aria-label="Remove item" tabIndex={0}>-</button>
      )}
      {item.useDefault && (
        <div className="sitemap-item__overlay" aria-hidden="true">
          <span className="sitemap-item__overlay-text">Using default content (no AI)</span>
        </div>
      )}
    </li>
  );
};

export default SitemapItem;
