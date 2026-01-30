import React, { useMemo, useState } from 'react';
import { modelGroups } from '../../modelGroups';
import './DefaultPageTemplateSelector.css';

export interface PageTemplate {
  title: string;
  sections: Array<{
    model: string;
    query: string;
    internal_id: string;
    use_default?: boolean;
    preserve_image?: boolean;
  }>;
}

export interface DefaultPageTemplateSelectorProps {
  selectedModelGroupKey: string;
  onPageTemplateSelect: (pageTemplate: PageTemplate) => void;
  onClose: () => void;
}

const DefaultPageTemplateSelector: React.FC<DefaultPageTemplateSelectorProps> = ({
  selectedModelGroupKey,
  onPageTemplateSelect,
  onClose,
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(-1);

  const availablePages = useMemo(() => {
    if (!selectedModelGroupKey || !modelGroups[selectedModelGroupKey]) {
      return [];
    }

    const modelGroup = modelGroups[selectedModelGroupKey];

    // Get the first template (typically "Orthodontist Site" or similar)
    if (!modelGroup.templates || modelGroup.templates.length === 0) {
      return [];
    }

    const templateData = modelGroup.templates[0].data;

    // Extract pages from the template
    if (!templateData || !templateData.pages) {
      return [];
    }

    const pages: PageTemplate[] = Object.entries(templateData.pages).map(([title, pageData]: [string, any]) => ({
      title,
      sections: pageData.model_query_pairs || [],
    }));

    return pages;
  }, [selectedModelGroupKey]);

  const handlePageSelect = (index: number) => {
    setSelectedPageIndex(index);
  };

  const handleApplyTemplate = () => {
    if (selectedPageIndex >= 0 && selectedPageIndex < availablePages.length) {
      const selectedPage = availablePages[selectedPageIndex];
      onPageTemplateSelect(selectedPage);
      onClose();
    }
  };

  if (availablePages.length === 0) {
    return (
      <div className="default-page-template-selector__modal">
        <div className="default-page-template-selector__content">
          <div className="default-page-template-selector__header">
            <h3>Select Page Template</h3>
            <button
              className="default-page-template-selector__close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="default-page-template-selector__body">
            <p className="default-page-template-selector__empty">
              No page templates available for this template.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="default-page-template-selector__modal" onClick={onClose}>
      <div
        className="default-page-template-selector__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="default-page-template-selector__header">
          <h3>Select Page Template</h3>
          <button
            className="default-page-template-selector__close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="default-page-template-selector__body">
          <p className="default-page-template-selector__description">
            Choose a page template to apply to this page. The page's sections will be replaced with the template's structure.
          </p>
          <div className="default-page-template-selector__list">
            {availablePages.map((page, index) => (
              <div
                key={page.title}
                className={`default-page-template-selector__item ${
                  selectedPageIndex === index ? 'default-page-template-selector__item--selected' : ''
                }`}
                onClick={() => handlePageSelect(index)}
              >
                <div className="default-page-template-selector__item-header">
                  <input
                    type="radio"
                    checked={selectedPageIndex === index}
                    onChange={() => handlePageSelect(index)}
                    className="default-page-template-selector__radio"
                  />
                  <h4 className="default-page-template-selector__item-title">
                    {page.title}
                  </h4>
                </div>
                <p className="default-page-template-selector__item-sections">
                  {page.sections.length} section{page.sections.length !== 1 ? 's' : ''}
                  {page.sections.length > 0 && (
                    <span className="default-page-template-selector__item-preview">
                      {' '}
                      ({page.sections.slice(0, 3).map(s => s.model).join(', ')}
                      {page.sections.length > 3 ? ', ...' : ''})
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="default-page-template-selector__footer">
          <button
            className="default-page-template-selector__button default-page-template-selector__button--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="default-page-template-selector__button default-page-template-selector__button--apply"
            onClick={handleApplyTemplate}
            disabled={selectedPageIndex < 0}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaultPageTemplateSelector;
