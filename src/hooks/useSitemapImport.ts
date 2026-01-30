import { useState, useRef } from 'react'
import { SitemapSection, StoredSitemap } from '../types/SitemapTypes'
import { importSitemapJson, hasNestedChildren } from '../utils/flattenSitemapPages'

const LOCAL_STORAGE_KEY = 'generatedSitemaps'

/**
 * Maps imported pages from various formats to SitemapSection array.
 * Now supports nested children via flattenSitemapPages utility.
 */
const mapImportedPages = (pagesObj: Record<string, any> | any[], fullSitemapJson?: any): SitemapSection[] => {
  if (!pagesObj) return []

  // Handle new array format (exported from updated exportJson)
  if (Array.isArray(pagesObj)) {
    console.log('📋 Detected array format pages, mapping directly...')
    return pagesObj.map((page: any) => ({
      id: page.id || page.internal_id,
      title: page.title,
      wordpress_id: page.wordpress_id || page.page_id || '',
      items: (page.items || page.model_query_pairs || []).map((item: any) => ({
        model: item.model,
        query: item.query,
        id: item.id || item.internal_id,
        useDefault: Boolean(item.useDefault || item.use_default),
        preserve_image: item.preserve_image,
      })),
      // Preserve all optional fields
      ...(page.allocated_markdown && { allocated_markdown: page.allocated_markdown }),
      ...(page.allocation_confidence !== undefined && { allocation_confidence: page.allocation_confidence }),
      ...(page.source_location && { source_location: page.source_location }),
      ...(page.mapped_scraped_page && { mapped_scraped_page: page.mapped_scraped_page }),
      ...(page.slug && { slug: page.slug }),
      ...(page.parent_slug && { parent_slug: page.parent_slug }),
      ...(page.depth !== undefined && { depth: page.depth }),
      ...(page.description && { description: page.description }),
    }))
  }

  if (typeof pagesObj !== 'object') return []

  // Check if any page has nested children - if so, use the flattening utility
  const hasChildren = Object.values(pagesObj).some(
    (pageData: any) => pageData?.children && Object.keys(pageData.children).length > 0
  )

  if (hasChildren) {
    console.log('📁 Detected nested children in sitemap, flattening hierarchy...')
    const sitemapData = fullSitemapJson || { pages: pagesObj }
    const flattened = importSitemapJson(sitemapData)
    console.log(`✅ Flattened ${flattened.length} pages (including children)`)
    return flattened
  }

  // Legacy handling for flat object structures
  return Object.entries(pagesObj).map(([title, pageData]) => {
    // Handle array-based page data (generated content format)
    if (Array.isArray(pageData)) {
      console.log(`📄 Converting generated content array for page: ${title}`)
      return {
        id: `page-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        title,
        wordpress_id: '',
        items: pageData
          .filter((component: any) => component && component.acf_fc_layout)
          .map((component: any, index: number) => ({
            model: component.acf_fc_layout || 'content',
            query: component.title || `${component.acf_fc_layout} section`,
            id: `${title.toLowerCase().replace(/\s+/g, '-')}-${component.acf_fc_layout}-${index}-${Date.now()}`,
            useDefault: false,
          })),
        depth: 0,
      }
    }

    // Handle object-based page data (traditional sitemap format)
    const {
      internal_id,
      page_id,
      slug,
      description,
      model_query_pairs,
      allocated_markdown,
      allocation_confidence,
      source_location,
      mapped_scraped_page
    } = pageData as any
    return {
      id: internal_id,
      title,
      wordpress_id: page_id || '',
      slug,
      description,
      depth: 0,
      items: (model_query_pairs || []).map((item: any) => ({
        model: item.model,
        query: item.query,
        id: item.internal_id,
        useDefault: Boolean(item.use_default),
        preserve_image: item.preserve_image,
      })),
      // Preserve allocation fields if they exist
      ...(allocated_markdown && { allocated_markdown }),
      ...(allocation_confidence !== undefined && { allocation_confidence }),
      ...(source_location && { source_location }),
      ...(mapped_scraped_page && { mapped_scraped_page }),
    }
  })
}

const useSitemapImport = (siteType?: string) => {
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [sitemapSource, setSitemapSource] = useState<'loaded' | 'generated' | null>(null)
  const [sitemapName, setSitemapName] = useState<string | null>(null)
  const isProcessingRef = useRef<boolean>(false)

  const importPagesFromJson = (jsonData: string): SitemapSection[] | null => {
    try {
      const importedData = JSON.parse(jsonData)
      if (importedData.pages) {
        const pages = mapImportedPages(importedData.pages, importedData)
        setLastSaved(new Date().toISOString())
        setSitemapSource('loaded')
        setSitemapName(null) // Reset to default when importing JSON
        return pages
      }
      return null
    } catch {
      throw new Error('Error importing JSON: Invalid format')
    }
  }

  const resetToDefault = (): void => {
    setLastSaved(null)
    setSitemapSource(null)
    setSitemapName(null)
  }

  const handleGeneratedSitemap = (sitemapData: unknown, siteTypeOverride?: string): SitemapSection[] | null => {
    if (!sitemapData || typeof sitemapData !== 'object' || !(sitemapData as any).pages) {
      return null
    }

    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.warn('Sitemap processing already in progress, skipping duplicate call');
      return null;
    }
    
    isProcessingRef.current = true;

    try {
      const newPages = mapImportedPages((sitemapData as any).pages, sitemapData)
      
      // Handle the prompt more carefully
      let name: string;
      try {
        const userInput = prompt('Enter a name for this sitemap:', `Sitemap ${new Date().toLocaleString()}`);
        name = userInput !== null && userInput.trim() !== ''
          ? userInput.trim()
          : `Sitemap ${new Date().toLocaleString()}`;
      } catch {
        // Fallback in case prompt fails
        name = `Sitemap ${new Date().toLocaleString()}`;
      }

      const stored: StoredSitemap = {
        name,
        created: new Date().toISOString(),
        sitemap: sitemapData,
        siteType: siteTypeOverride || siteType,
      }

      // Store in localStorage with automatic cleanup
      const prev = localStorage.getItem(LOCAL_STORAGE_KEY)
      let arr: StoredSitemap[] = []
      if (prev) {
        try {
          arr = JSON.parse(prev) as StoredSitemap[]
        } catch {
          // Ignore parsing errors, use empty array
        }
      }
      arr.push(stored)

      // Keep only the 20 most recent sitemaps to prevent localStorage from growing too large
      if (arr.length > 20) {
        // Sort by creation date (newest first) and keep only the most recent 20
        arr.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
        arr = arr.slice(0, 20)
        console.log(`🗑️  Cleaned up old sitemaps, keeping 20 most recent`)
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr))

      setLastSaved(new Date().toISOString())
      setSitemapSource('generated')
      setSitemapName(name)
      return newPages
    } finally {
      // Always reset the processing flag
      isProcessingRef.current = false;
    }
  }

  const handleSelectStoredSitemap = (stored: StoredSitemap): SitemapSection[] | null => {
    if (stored && stored.sitemap && (stored.sitemap as any).pages) {
      setLastSaved(stored.created)
      setSitemapSource('loaded')
      setSitemapName(stored.name)
      return mapImportedPages((stored.sitemap as any).pages, stored.sitemap)
    }
    return null
  }

  return {
    lastSaved,
    sitemapSource,
    sitemapName,
    importPagesFromJson,
    handleGeneratedSitemap,
    handleSelectStoredSitemap,
    resetToDefault
  }
}

export default useSitemapImport
