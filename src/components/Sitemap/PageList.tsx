import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, KeyboardSensor, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSitemap } from '../../contexts/SitemapProvider';
import PageCard from './PageCard';
import PageListTOCItem from './PageListTOC';
import { SitemapItem, SitemapSection, StoredSitemap } from '../../types/SitemapTypes';
import './PageList.sass';

type ActiveDragType = 'page' | 'item' | null;

interface PageListProps {
  headerControls?: React.ReactNode;
  contentSourceInfo?: {
    domain: string;
    pagesCount: number;
  };
  additionalActions?: React.ReactNode;
  exportImportControls?: React.ReactNode;
}

const LOCAL_STORAGE_KEY = 'generatedSitemaps';

const getStoredSitemaps = (): StoredSitemap[] => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredSitemap[];
  } catch {
    return [];
  }
};

const PageList: React.FC<PageListProps> = ({
  headerControls,
  contentSourceInfo,
  additionalActions,
  exportImportControls
}) => {
  const { state, actions } = useSitemap();
  const [activeDragType, setActiveDragType] = useState<ActiveDragType>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [hasAttemptedAutoLoad, setHasAttemptedAutoLoad] = useState<boolean>(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-load the most recent sitemap if none is loaded
  useEffect(() => {
    if (!state.sitemapSource && !hasAttemptedAutoLoad) {
      const storedSitemaps = getStoredSitemaps();
      if (storedSitemaps.length > 0) {
        // Sort by creation date (most recent first) and load the first one
        const mostRecent = storedSitemaps.sort((a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
        )[0];

        actions.handleSelectStoredSitemap(mostRecent);
      }
      setHasAttemptedAutoLoad(true);
    }
  }, [state.sitemapSource, hasAttemptedAutoLoad, actions]);

  const { pages, viewMode, showItems, sitemapSource, layoutType } = state;

  const { addPage, toggleLayoutType } = actions;
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

  // Show loading state while attempting auto-load
  if (!sitemapSource && !hasAttemptedAutoLoad) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading sitemap...</p>
      </div>
    );
  }

  // Show empty state only if no sitemap exists at all after auto-load attempt
  if (!sitemapSource || pages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No sitemaps available. Generate your first sitemap to get started.</p>
      </div>
    );
  }

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
        <div className="app__page-filter flex items-center gap-2 mb-2">

          {/* Header Controls Row: Template Selector + Generate + Load */}
          {headerControls && (
            <div className="page-list__header-controls">
              {headerControls}
            </div>
          )}

          {/* Additional Actions */}
          {additionalActions && (
            <div className="">
              {additionalActions}
            </div>
          )}

          {/* Filter + Show/Hide Controls */}
          <div className="app__page-filter-controls" role="group" aria-label="Toggle item visibility globally">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
              placeholder="Filter by page title, model, or query…"
              aria-label="Filter sitemap"
              style={{ minWidth: 200 }}
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
            <button
              className={`app__filter-button ${layoutType === 'toc' ? 'app__filter-button--active' : ''}`}
              onClick={toggleLayoutType}
              aria-pressed={layoutType === 'toc'}
              aria-label="Toggle TOC view"
              tabIndex={0}
            >
              {layoutType === 'toc' ? '📋 TOC View' : '📄 Standard View'}
            </button>
            {layoutType === 'standard' && (
              <>
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
              </>
            )}
          </div>

          {/* Export/Import Controls */}
          {exportImportControls && (
            <div className="page-list__export-import" style={{ paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
              {exportImportControls}
            </div>
          )}

          <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
            {layoutType === 'toc' ? (
              // TOC View - compact table of contents style
              filteredPages.map((page) => (
                <PageListTOCItem
                  key={page.id}
                  page={page}
                  index={pages.findIndex(p => p.id === page.id)}
                />
              ))
            ) : (
              // Standard View - original PageCard layout
              filteredPages.map((page) => (
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
              ))
            )}
          </SortableContext>
          <button
            className="primary-button"
            onClick={addPage}
            aria-label="Add Page"
            tabIndex={0}
          >
            Add Page
          </button>
        </div>
      </div>
    </DndContext>
  );
};

export default PageList; 
