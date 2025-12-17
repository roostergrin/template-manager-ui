import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, KeyboardSensor, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Copy, Check } from 'lucide-react';
import { useSitemap } from '../../contexts/SitemapProvider';
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
  const [hasAttemptedAutoLoad, setHasAttemptedAutoLoad] = useState<boolean>(false);
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  const [copiedPageNames, setCopiedPageNames] = useState<boolean>(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { pages, sitemapSource } = state;
  const { addPage } = actions;

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

  // Initialize expanded state for new pages (all pages start expanded)
  useEffect(() => {
    setExpandedPageIds(prev => {
      const newSet = new Set(prev);
      pages.forEach(page => {
        if (!newSet.has(page.id)) {
          newSet.add(page.id);
        }
      });
      return newSet;
    });
  }, [pages]);

  const pageIds = useMemo(() => pages.map(p => p.id as UniqueIdentifier), [pages]);

  const togglePageExpanded = useCallback((pageId: string) => {
    setExpandedPageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  }, []);

  const copyPageNamesToClipboard = useCallback(() => {
    // Build hierarchical list with indentation based on depth
    const pageNames = pages.map(p => {
      const depth = p.depth || 0;
      const indent = '  '.repeat(depth); // 2 spaces per level
      return `${indent}${p.title}`;
    }).join('\n');
    
    navigator.clipboard.writeText(pageNames).then(() => {
      setCopiedPageNames(true);
      setTimeout(() => setCopiedPageNames(false), 2000);
    }).catch(err => {
      console.error('Failed to copy page names:', err);
    });
  }, [pages]);

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
      <div>
        {/* Header Controls Row: Template Selector + Generate + Load */}
        {headerControls && (
          <div className="mb-4">
            {headerControls}
          </div>
        )}

        {/* Additional Actions */}
        {additionalActions && (
          <div className="mb-4">
            {additionalActions}
          </div>
        )}

        {/* Export/Import Controls */}
        {exportImportControls && (
          <div className="mb-4" style={{ paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            {exportImportControls}
          </div>
        )}

        {/* Page List Toolbar */}
        <div className="page-list__toolbar">
          <span className="page-list__count">{pages.length} pages</span>
          <button
            className="page-list__copy-names-btn"
            onClick={copyPageNamesToClipboard}
            title="Copy all page names to clipboard"
          >
            {copiedPageNames ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Names</span>
              </>
            )}
          </button>
        </div>

        <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
          {pages.map((page) => (
            <PageListTOCItem
              key={page.id}
              page={page}
              index={pages.findIndex(p => p.id === page.id)}
              isExpanded={expandedPageIds.has(page.id)}
              onToggleExpanded={togglePageExpanded}
            />
          ))}
        </SortableContext>
        <button
          className="page-list-toc__add-page"
          onClick={addPage}
          aria-label="Add Page"
          tabIndex={0}
        >
          + Add Page
        </button>
      </div>
    </DndContext>
  );
};

export default PageList; 
