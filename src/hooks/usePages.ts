import { useState } from 'react'
import { SitemapSection, SitemapItem } from '../types/SitemapTypes'

const usePages = (initialPages: SitemapSection[] = []) => {
  const [pages, setPages] = useState<SitemapSection[]>(initialPages)

  const addPage = () => {
    const newPage: SitemapSection = {
      id: Date.now().toString(),
      title: 'New Page',
      items: [],
      wordpress_id: ''
    }
    setPages(prev => [...prev, newPage])
  }

  const removePage = (pageId: string) => {
    setPages(prev => prev.filter(page => page.id !== pageId))
  }

  const updatePageTitle = (pageId: string, newTitle: string) => {
    setPages(prev => prev.map(page =>
      page.id === pageId ? { ...page, title: newTitle } : page
    ))
  }

  const updatePageWordpressId = (pageId: string, newId: string) => {
    setPages(prev => prev.map(page =>
      page.id === pageId ? { ...page, wordpress_id: newId } : page
    ))
  }

  const updatePageItems = (pageId: string, newItems: SitemapItem[]) => {
    setPages(prev => prev.map(page =>
      page.id === pageId ? { ...page, items: newItems } : page
    ))
  }

  const setAllPages = (newPages: SitemapSection[]) => {
    setPages(newPages)
  }

  return {
    pages,
    addPage,
    removePage,
    updatePageTitle,
    updatePageWordpressId,
    updatePageItems,
    setPages: setAllPages
  }
}

export default usePages