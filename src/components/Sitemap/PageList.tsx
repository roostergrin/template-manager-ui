import React, { useCallback, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, KeyboardSensor, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSitemap } from '../../contexts/SitemapProvider';
import PageCard from './PageCard';
import { SitemapItem, SitemapSection } from '../../types/SitemapTypes';

type ActiveDragType = 'page' | 'item' | null;

const PageList: React.FC = () => {
  const { state, actions } = useSitemap();
  const [activeDragType, setActiveDragType] = useState<ActiveDragType>(null);
  const [filterText, setFilterText] = useState<string>('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const { pages, viewMode, showItems } = state;
  
  const { addPage } = actions;
  // Determine item density from view mode; layout is always full-width single column
  const isCompactMode = viewMode === 'list';
  
  const filteredPages = useMemo(() => {
    const needle = filterText.trim().toLowerCase();
    if (!needle) return pages;
    return pages.filter(p => {
      if (p.title.toLowerCase().includes(needle)) return true;
      return p.items.some(i => i.model.toLowerCase().includes(needle) || i.query.toLowerCase().includes(needle));
    });
  }, [filterText, pages]);

  const pageIds = useMemo(() => filteredPages.map(p => p.id as UniqueIdentifier), [filteredPages]);

  const findPageByItemId = useCallback(
    (itemId: UniqueIdentifier): SitemapSection | undefined => pages.find(p => p.items.some(i => i.id === itemId)),
    [pages]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const type = (event.active.data.current as { type?: ActiveDragType } | undefined)?.type ?? null;
    setActiveDragType(type);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (activeDragType !== 'item') return;
    const { active, over } = event;
    if (!over) return;

    const activeItemId = active.id as UniqueIdentifier;
    const overId = over.id as UniqueIdentifier;

    const activeContainer = (active.data.current as any)?.containerId as string | undefined;
    let overContainer = (over.data.current as any)?.containerId as string | undefined;

    if (!overContainer) {
      const overPage = findPageByItemId(overId) || pages.find(p => p.id === overId);
      overContainer = overPage?.id;
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const sourcePageIndex = pages.findIndex(p => p.id === activeContainer);
    const targetPageIndex = pages.findIndex(p => p.id === overContainer);
    if (sourcePageIndex === -1 || targetPageIndex === -1) return;

    const sourcePage = pages[sourcePageIndex];
    const targetPage = pages[targetPageIndex];
    const activeIndex = sourcePage.items.findIndex(i => i.id === activeItemId);

    let targetIndex = targetPage.items.findIndex(i => i.id === overId);
    if (targetIndex === -1) targetIndex = targetPage.items.length;

    const movingItem: SitemapItem | undefined = sourcePage.items[activeIndex];
    if (!movingItem) return;

    const newSourceItems = sourcePage.items.filter(i => i.id !== activeItemId);
    const newTargetItems = [
      ...targetPage.items.slice(0, targetIndex),
      movingItem,
      ...targetPage.items.slice(targetIndex)
    ];

    const nextPages = pages.map(p => {
      if (p.id === sourcePage.id) return { ...p, items: newSourceItems };
      if (p.id === targetPage.id) return { ...p, items: newTargetItems };
      return p;
    });
    actions.setPages(nextPages);
  }, [activeDragType, actions, findPageByItemId, pages]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);
    if (!over) return;

    if ((active.data.current as any)?.type === 'page') {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const next = arrayMove(pages, oldIndex, newIndex);
      actions.setPages(next);
      return;
    }

    if ((active.data.current as any)?.type === 'item') {
      const activeContainer = (active.data.current as any)?.containerId as string | undefined;
      const overContainer = (over.data.current as any)?.containerId as string | undefined;

      const sourcePage = pages.find(p => p.id === activeContainer);
      const targetPage = pages.find(p => p.id === overContainer) || findPageByItemId(over.id as UniqueIdentifier);
      if (!sourcePage || !targetPage) return;

      const activeIndex = sourcePage.items.findIndex(i => i.id === active.id);
      let overIndex = targetPage.items.findIndex(i => i.id === over.id);
      if (overIndex === -1) overIndex = targetPage.items.length;

      if (sourcePage.id === targetPage.id) {
        const updatedItems = arrayMove(sourcePage.items, activeIndex, overIndex);
        actions.updatePageItems(sourcePage.id, updatedItems);
      } else {
        const nextPages = pages.map(p => {
          if (p.id === sourcePage.id) {
            return { ...p, items: p.items.filter(i => i.id !== active.id) };
          }
          if (p.id === targetPage.id) {
            const exists = p.items.some(i => i.id === active.id);
            if (exists) return p;
            const movingItem = sourcePage.items[activeIndex];
            const newItems = [
              ...p.items.slice(0, overIndex),
              movingItem,
              ...p.items.slice(overIndex)
            ];
            return { ...p, items: newItems };
          }
          return p;
        });
        actions.setPages(nextPages);
      }
    }
  }, [actions, findPageByItemId, pages]);

  const handleShowAllItems = useCallback(() => {
    actions.setShowItems(true);
  }, [actions]);

  const handleHideAllItems = useCallback(() => {
    actions.setShowItems(false);
  }, [actions]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div
        className="app__page-container mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: isCompactMode ? '0.5rem' : '1rem',
        }}
      >
        <div className="app__page-filter flex items-center gap-2 mb-2" style={{
          background: 'var(--filter-bg, #f8fafc)',
          border: '1px solid var(--filter-border, #e2e8f0)',
          borderRadius: 8,
          padding: '8px 10px'
        }}>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="Filter by page title, model, or query…"
            aria-label="Filter sitemap"
          />
          {filterText && (
            <button
              className="border rounded px-2 py-1 text-xs"
              onClick={() => setFilterText('')}
              aria-label="Clear filter"
            >
              Clear
            </button>
          )}
          <div className="app__page-filter-controls" role="group" aria-label="Toggle item visibility globally" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <button
              className={`app__filter-button ${showItems ? 'app__filter-button--active' : ''}`}
              onClick={handleShowAllItems}
              aria-pressed={showItems}
              aria-label="Show all items (Item Mode)"
              tabIndex={0}
            >
              Show All Items
            </button>
            <button
              className={`app__filter-button ${!showItems ? 'app__filter-button--active' : ''}`}
              onClick={handleHideAllItems}
              aria-pressed={!showItems}
              aria-label="Hide all items (Page Mode)"
              tabIndex={0}
            >
              Hide All Items
            </button>
          </div>
        </div>
        <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
          {filteredPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              index={pages.findIndex(p => p.id === page.id)}
              showItemNumbers={true}
              showPageIds={true}
              showDeleteButtons={true}
              showSelect={true}
              showTextarea={true}
              isCompactMode={isCompactMode}
            />
          ))}
        </SortableContext>
        <button
          className="app__add-page-button bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
          onClick={addPage}
          aria-label="Add Page"
          tabIndex={0}
        >
          Add Page
        </button>
      </div>
    </DndContext>
  );
};

export default PageList; 