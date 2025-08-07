import { useState } from 'react'
import { SitemapSection, StoredSitemap } from '../types/SitemapTypes'

const LOCAL_STORAGE_KEY = 'generatedSitemaps'

const mapImportedPages = (pagesObj: Record<string, any>): SitemapSection[] => {
  if (!pagesObj || typeof pagesObj !== 'object') return []
  return Object.entries(pagesObj).map(([title, pageData]) => {
    const { internal_id, page_id, model_query_pairs } = pageData as any
    return {
      id: internal_id,
      title,
      wordpress_id: page_id || '',
      items: model_query_pairs.map((item: any) => ({
        model: item.model,
        query: item.query,
        id: item.internal_id,
        useDefault: Boolean(item.use_default),
      })),
    }
  })
}

const useSitemapImport = () => {
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const importPagesFromJson = (jsonData: string): SitemapSection[] | null => {
    try {
      const importedData = JSON.parse(jsonData)
      if (importedData.pages) {
        const pages = mapImportedPages(importedData.pages)
        setLastSaved(new Date().toISOString())
        return pages
      }
      return null
    } catch (error) {
      throw new Error('Error importing JSON: Invalid format')
    }
  }

  const handleGeneratedSitemap = (sitemapData: unknown): SitemapSection[] | null => {
    if (!sitemapData || typeof sitemapData !== 'object' || !(sitemapData as any).pages) {
      return null
    }

    const newPages = mapImportedPages((sitemapData as any).pages)
    const name = prompt('Enter a name for this sitemap:', `Sitemap ${new Date().toLocaleString()}`) 
      || `Sitemap ${new Date().toLocaleString()}`

    const stored: StoredSitemap = {
      name,
      created: new Date().toISOString(),
      sitemap: sitemapData,
    }

    // Store in localStorage
    const prev = localStorage.getItem(LOCAL_STORAGE_KEY)
    let arr: StoredSitemap[] = []
    if (prev) {
      try {
        arr = JSON.parse(prev) as StoredSitemap[]
      } catch {}
    }
    arr.push(stored)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr))

    setLastSaved(new Date().toISOString())
    return newPages
  }

  const handleSelectStoredSitemap = (stored: StoredSitemap): SitemapSection[] | null => {
    if (stored && stored.sitemap && (stored.sitemap as any).pages) {
      setLastSaved(stored.created)
      return mapImportedPages((stored.sitemap as any).pages)
    }
    return null
  }

  return {
    lastSaved,
    importPagesFromJson,
    handleGeneratedSitemap,
    handleSelectStoredSitemap
  }
}

export default useSitemapImport