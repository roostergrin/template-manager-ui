import { useState, useCallback } from 'react';
import { SitemapSection, SitemapItem, StoredSitemap } from '../types/SitemapTypes';

const LOCAL_STORAGE_KEY = 'generatedSitemaps';

const usePages = () => {
  const [pages, setPages] = useState<SitemapSection[]>([]);

  const mapImportedPages = useCallback((pagesObj: Record<string, any>): SitemapSection[] => {
    if (!pagesObj || typeof pagesObj !== 'object') return [];
    return Object.entries(pagesObj).map(([title, pageData]) => {
      const { internal_id, page_id, model_query_pairs } = pageData as any;
      return {
        id: internal_id,
        title,
        wordpress_id: page_id || '',
        items: model_query_pairs.map((item: any) => ({
          model: item.model,
          query: item.query,
          id: item.internal_id,
        })),
      };
    });
  }, []);

  const addPage = useCallback(() => {
    setPages(prev => [
      ...prev,
      { id: Date.now().toString(), title: 'New Page', items: [], wordpress_id: '' },
    ]);
  }, []);

  const removePage = useCallback((pageId: string) => {
    setPages(prev => prev.filter(page => page.id !== pageId));
  }, []);

  const updatePageTitle = useCallback((pageId: string, newTitle: string) => {
    setPages(prev =>
      prev.map(page =>
        page.id === pageId ? { ...page, title: newTitle } : page
      )
    );
  }, []);

  const updatePageWordpressId = useCallback((pageId: string, newId: string) => {
    setPages(prev =>
      prev.map(page =>
        page.id === pageId ? { ...page, wordpress_id: newId } : page
      )
    );
  }, []);

  const updatePageItems = useCallback((pageId: string, newItems: SitemapItem[]) => {
    setPages(prev =>
      prev.map(page =>
        page.id === pageId ? { ...page, items: newItems } : page
      )
    );
  }, []);

  const importPagesFromJson = useCallback((jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.pages) {
        setPages(mapImportedPages(importedData.pages));
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
    }
  }, [mapImportedPages]);

  const handleGeneratedSitemap = useCallback((sitemapData: unknown) => {
    if (!sitemapData || typeof sitemapData !== 'object' || !(sitemapData as any).pages) {
      return;
    }
    const newPages = mapImportedPages((sitemapData as any).pages);
    setPages(newPages);
    const name = prompt('Enter a name for this sitemap:', `Sitemap ${new Date().toLocaleString()}`) || `Sitemap ${new Date().toLocaleString()}`;
    const stored: StoredSitemap = {
      name,
      created: new Date().toISOString(),
      sitemap: sitemapData,
    };
    const prev = localStorage.getItem(LOCAL_STORAGE_KEY);
    let arr: StoredSitemap[] = [];
    if (prev) {
      try {
        arr = JSON.parse(prev) as StoredSitemap[];
      } catch {}
    }
    arr.push(stored);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr));
  }, [mapImportedPages]);

  const handleSelectStoredSitemap = useCallback((stored: StoredSitemap) => {
    if (stored && stored.sitemap && (stored.sitemap as any).pages) {
      setPages(mapImportedPages((stored.sitemap as any).pages));
    }
  }, [mapImportedPages]);

  return {
    pages,
    addPage,
    removePage,
    updatePageTitle,
    updatePageWordpressId,
    updatePageItems,
    importPagesFromJson,
    handleGeneratedSitemap,
    handleSelectStoredSitemap,
  };
};

export default usePages; 