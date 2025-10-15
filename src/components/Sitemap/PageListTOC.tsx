import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import './PageListTOC.sass';

interface SectionRowProps {
  item: SitemapItem;
  pageId: string;
  pageIndex: number;
  itemIndex: number;
  currentModels: string[];
  onUpdateItem: (itemId: string, updates: Partial<SitemapItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  expandedSectionId: string | null;
  setExpandedSectionId: (id: string | null) => void;
}

const SectionRow: React.FC<SectionRowProps> = ({
  item,
  pageId,
  pageIndex,
  itemIndex,
  currentModels,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  expandedSectionId,
  setExpandedSectionId
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: 'item', containerId: pageId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [item.query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedSectionId(null);
      }
    };

    if (expandedSectionId === item.id) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expandedSectionId, item.id, setExpandedSectionId]);

  const toggleSectionDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSectionId(expandedSectionId === item.id ? null : item.id);
  };

  const handleChangeModel = (newModel: string) => {
    onUpdateItem(item.id, { model: newModel });
    setExpandedSectionId(null);
  };

  const handleToggleDefault = () => {
    onUpdateItem(item.id, { useDefault: !item.useDefault });
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateItem(item.id, { query: e.target.value });
  };

  return (
    <div ref={setNodeRef} style={style} className="page-list-toc__row page-list-toc__row--section">
      <div className="page-list-toc__col page-list-toc__col--controls">
        <button
          className="page-list-toc__section-drag-handle"
          aria-label="Drag section"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      </div>
      <div className="page-list-toc__col page-list-toc__col--content">
        <span className="page-list-toc__section-number">{pageIndex + 1}.{itemIndex + 1}</span>
        <textarea
          ref={textareaRef}
          className="page-list-toc__section-description"
          value={item.query}
          onChange={handleQueryChange}
          placeholder="Section description"
          aria-label="Section description"
          rows={1}
        />
      </div>
      <div className="page-list-toc__col page-list-toc__col--type">
        <div className="page-list-toc__type-cell" ref={expandedSectionId === item.id ? dropdownRef : null}>
          <button
            className="page-list-toc__type-select"
            onClick={toggleSectionDropdown}
            aria-label="Change section type"
          >
            {item.model}
          </button>
          {expandedSectionId === item.id && (
            <div className="page-list-toc__dropdown">
              {currentModels.map((model) => (
                <button
                  key={model}
                  className={`page-list-toc__dropdown-item ${item.model === model ? 'page-list-toc__dropdown-item--active' : ''}`}
                  onClick={() => handleChangeModel(model)}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="page-list-toc__col page-list-toc__col--actions">
        <button
          className={`page-list-toc__lock-toggle ${item.useDefault ? 'page-list-toc__lock-toggle--active' : ''}`}
          onClick={handleToggleDefault}
          aria-label={item.useDefault ? 'Unlock (custom content)' : 'Lock (use default)'}
          tabIndex={0}
          title={item.useDefault ? 'Using default content' : 'Using custom content'}
        >
          {item.useDefault ? '●' : '○'}
        </button>
        <button
          className="page-list-toc__duplicate"
          onClick={() => onDuplicateItem(item.id)}
          aria-label="Duplicate section"
          tabIndex={0}
          title="Duplicate section"
        >
          ⎘
        </button>
        <button
          className="page-list-toc__section-delete"
          onClick={() => onDeleteItem(item.id)}
          aria-label="Delete section"
          tabIndex={0}
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface PageListTOCItemProps {
  page: SitemapSection;
  index: number;
}

const PageListTOCItem: React.FC<PageListTOCItemProps> = ({ page, index }) => {
  const { actions } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [isPageExpanded, setIsPageExpanded] = useState<boolean>(true);
  const [isMarkdownExpanded, setIsMarkdownExpanded] = useState<boolean>(false);

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const currentModels = appConfigState.modelGroups[selectedModelGroupKey]?.models || [];

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: page.id,
    data: { type: 'page' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const togglePageExpanded = () => {
    setIsPageExpanded(!isPageExpanded);
  };

  const toggleMarkdownExpanded = () => {
    setIsMarkdownExpanded(!isMarkdownExpanded);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SitemapItem>) => {
    const updatedItems = page.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    actions.updatePageItems(page.id, updatedItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = page.items.filter(item => item.id !== itemId);
    actions.updatePageItems(page.id, updatedItems);
  };

  const handleAddSection = () => {
    const newItem: SitemapItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      model: currentModels[0] || 'Hero',
      query: '',
      useDefault: false
    };
    const updatedItems = [...page.items, newItem];
    actions.updatePageItems(page.id, updatedItems);
  };

  const handleDuplicateSection = (itemId: string) => {
    const itemToDuplicate = page.items.find(item => item.id === itemId);
    if (!itemToDuplicate) return;

    const duplicatedItem: SitemapItem = {
      ...itemToDuplicate,
      id: `item-${Date.now()}-${Math.random()}`,
    };

    const itemIndex = page.items.findIndex(item => item.id === itemId);
    const updatedItems = [
      ...page.items.slice(0, itemIndex + 1),
      duplicatedItem,
      ...page.items.slice(itemIndex + 1)
    ];
    actions.updatePageItems(page.id, updatedItems);
  };

  const itemIds = page.items.map(item => item.id);

  // Helper functions for markdown stats
  const countWords = (markdown?: string): number => {
    if (!markdown) return 0;
    let text = markdown.replace(/!\[.*?\]\(.*?\)/g, '');
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    text = text.replace(/[#*`_~]/g, '');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const countImages = (markdown?: string): number => {
    if (!markdown) return 0;
    const imagePattern = /!\[.*?\]\(.*?\)/g;
    return (markdown.match(imagePattern) || []).length;
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'gray';
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  };

  const hasAllocatedContent = !!page.allocated_markdown;
  const wordCount = countWords(page.allocated_markdown);
  const imageCount = countImages(page.allocated_markdown);

  return (
    <div ref={setNodeRef} style={style} className="page-list-toc__item">
      <div className="page-list-toc__row page-list-toc__row--header">
        <div className="page-list-toc__col page-list-toc__col--controls">
          <button
            className="page-list-toc__chevron"
            onClick={togglePageExpanded}
            aria-label={isPageExpanded ? 'Collapse page' : 'Expand page'}
          >
            {isPageExpanded ? '▼' : '▶'}
          </button>
          <button
            className="page-list-toc__drag-handle"
            aria-label="Drag page"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
        </div>
        <div className="page-list-toc__col page-list-toc__col--content">
          <span className="page-list-toc__number">{index + 1}</span>
          <input
            type="text"
            className="page-list-toc__title-input"
            value={page.title}
            onChange={e => actions.updatePageTitle(page.id, e.target.value)}
            placeholder="Page Title"
            aria-label="Page Title"
          />
        </div>
        <div
          className={`page-list-toc__col page-list-toc__col--allocated-group ${hasAllocatedContent ? 'page-list-toc__col--clickable' : ''}`}
          onClick={hasAllocatedContent ? toggleMarkdownExpanded : undefined}
        >
          {hasAllocatedContent && (
            <div className="page-list-toc__allocated-group-inner">
              <button
                className="page-list-toc__markdown-toggle"
                aria-label={isMarkdownExpanded ? 'Collapse markdown' : 'Expand markdown'}
              >
                {isMarkdownExpanded ? '▼' : '▶'}
              </button>
              <span className="page-list-toc__allocated-source">
                {page.source_location}
              </span>
              <span className="page-list-toc__allocated-stat">
                <FileText size={14} />
                {wordCount.toLocaleString()}
              </span>
              <span className="page-list-toc__allocated-stat">
                <ImageIcon size={14} />
                {imageCount}
              </span>
            </div>
          )}
        </div>
        <div className="page-list-toc__col page-list-toc__col--actions">
          <span className="page-list-toc__count">{page.items.length}</span>
          <button
            className="page-list-toc__duplicate"
            onClick={() => actions.duplicatePage?.(page.id)}
            aria-label="Duplicate Page"
            tabIndex={0}
            title="Duplicate page"
          >
            ⎘
          </button>
          <button
            className="page-list-toc__delete"
            onClick={() => actions.removePage(page.id)}
            aria-label="Delete Page"
            tabIndex={0}
          >
            ×
          </button>
        </div>
      </div>

      {isMarkdownExpanded && hasAllocatedContent && (
        <div className="page-list-toc__allocated-content">
          <div className="page-list-toc__markdown-preview">
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              margin: 0,
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '4px',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {page.allocated_markdown}
            </pre>
          </div>
        </div>
      )}

      {isPageExpanded && (
        <div className="page-list-toc__sections">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {page.items.map((item, itemIndex) => (
              <SectionRow
                key={item.id}
                item={item}
                pageId={page.id}
                pageIndex={index}
                itemIndex={itemIndex}
                currentModels={currentModels}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onDuplicateItem={handleDuplicateSection}
                expandedSectionId={expandedSectionId}
                setExpandedSectionId={setExpandedSectionId}
              />
            ))}
          </SortableContext>
          <button
            className="page-list-toc__add-section"
            onClick={handleAddSection}
            aria-label="Add section"
            tabIndex={0}
          >
            + Add Section
          </button>
        </div>
      )}
    </div>
  );
};

export default PageListTOCItem;
