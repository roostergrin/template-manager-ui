import React, { useState } from 'react';
import { SitemapItem } from '../../types/SitemapTypes';
import './VisualModelSelector.sass';

// Model info with additional visual elements
interface ModelInfo {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  adjectives: string[];
}

interface VisualModelSelectorProps {
  models: string[];
  title: string;
  pageID: string;
  pageNumber: number;
  items: SitemapItem[];
  onItemsChange: (newItems: SitemapItem[]) => void;
}

const VisualModelSelector: React.FC<VisualModelSelectorProps> = ({
  models,
  title,
  pageID,
  pageNumber,
  items,
  onItemsChange
}) => {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showSitemap, setShowSitemap] = useState<boolean>(false);
  
  // Mock model info - in a real app, you'd probably fetch this data
  const modelInfoList: ModelInfo[] = models.map(model => ({
    id: model,
    name: model,
    imageUrl: `https://d22lbo23j84nfg.cloudfront.net/sites/templates-${model.toLowerCase().replace(/\s/g, '')}.webp`,
    videoUrl: Math.random() > 0.7 ? `https://d22lbo23j84nfg.cloudfront.net/sites/templates-${model.toLowerCase().replace(/\s/g, '')}.mp4` : undefined,
    adjectives: [
      ['Modern', 'Clean', 'Professional', 'Minimal', 'Elegant', 'Dynamic'][Math.floor(Math.random() * 6)],
      ['Textual', 'Fresh', 'Traditional', 'Playful', 'Serene', 'Bright'][Math.floor(Math.random() * 6)],
      ['Polished', 'Metropolitan', 'Delicate', 'Calm', 'Clean', 'Professional'][Math.floor(Math.random() * 6)]
    ]
  }));

  // Add item function
  const addItem = () => {
    const newItem: SitemapItem = { id: Date.now().toString(), model: selectedModel || models[0], query: '' };
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

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, newModel: string, newQuery: string) => {
    if (e.key === 'Enter') {
      editItem(itemId, newModel, newQuery);
    }
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setShowSitemap(true);
  };

  const filteredItems = items.filter(item => !selectedModel || item.model === selectedModel);

  return (
    <div className="visual-model-selector">
      {!showSitemap ? (
        <section className="custom-site-repeater">
          <div className="custom-site-repeater__container">
            {modelInfoList.map(model => (
              <div key={model.id} className="custom-site-repeater__site scrolling" onClick={() => handleModelSelect(model.id)}>
                <div className="custom-site-repeater__site-media">
                  {model.videoUrl ? (
                    <video muted className="custom-site-repeater__site-video">
                      <source src={model.videoUrl} type="video/mp4" className="custom-site-repeater__video" />
                    </video>
                  ) : (
                    <video muted className="custom-site-repeater__site-video" style={{ display: 'none' }}>
                      <source src="" type="video/mp4" className="custom-site-repeater__video" />
                    </video>
                  )}
                  <div className="base-image custom-site-repeater__site-image">
                    <picture>
                      <source type="image/webp" srcSet={model.imageUrl} />
                      <img 
                        alt={`image of ${model.name}`} 
                        className="base-image__image" 
                        style={{ objectPosition: 'center center' }} 
                        src={model.imageUrl.replace('.webp', '.jpeg')} 
                      />
                    </picture>
                  </div>
                </div>
                <h3 className="custom-site-repeater__site-title">{model.name}</h3>
                <div className="custom-site-repeater__site-adjectives">
                  {model.adjectives.map((adjective, index) => (
                    <div key={index} className="custom-site-repeater__site-adjective">{adjective}</div>
                  ))}
                </div>
                <div className="block-button custom-site-repeater__button">
                  <div className="block-button__wrapper">
                    <div className="block-button__background"></div>
                    <div className="base-icon block-button__arrow" aria-hidden="">
                      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M11 8L17 14L11 20" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                    <div className="block-button__label">Select model</div>
                    <div className="base-icon block-button__arrow block-button__arrow--hover" aria-hidden="">
                      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M11 8L17 14L11 20" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="sitemap-section">
          <div className="sitemap-section__header">
            <h3 className="sitemap-section__model-title">{selectedModel}</h3>
            <button 
              className="sitemap-section__back-button" 
              onClick={() => { setShowSitemap(false); setSelectedModel(null); }}
            >
              Back to Models
            </button>
          </div>
          
          <ul className="sitemap-section__list">
            {filteredItems.map((item, index) => (
              <li key={item.id} className="sitemap-section__item">
                {`${pageNumber}.${index + 1}`}
                <textarea
                  className="sitemap-section__input"
                  value={item.query}
                  onChange={(e) => editItem(item.id, selectedModel || item.model, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, item.id, selectedModel || item.model, e.currentTarget.value)}
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                />
                <button className="sitemap-section__button" onClick={() => removeItem(item.id)}>-</button>
              </li>
            ))}
          </ul>
          
          <div className="sitemap-section__controls">
            <button className="sitemap-section__add-button" onClick={addItem}>Add Item</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualModelSelector; 