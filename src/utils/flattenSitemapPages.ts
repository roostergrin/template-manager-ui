import { SitemapSection, SitemapItem } from '../types/SitemapTypes';

/**
 * Represents a page from the RAG-generated sitemap JSON structure.
 * Pages can have nested children with the same structure.
 */
interface RagPageData {
  internal_id: string;
  page_id?: string;
  slug?: string;
  description?: string;
  model_query_pairs?: Array<{
    model: string;
    query: string;
    internal_id: string;
    use_default?: boolean;
  }>;
  allocated_markdown?: string;
  allocation_confidence?: number;
  source_location?: string;
  mapped_scraped_page?: string;
  children?: Record<string, RagPageData>;
}

/**
 * Represents the root sitemap JSON structure from RAG generator.
 */
interface RagSitemapJson {
  pages: Record<string, RagPageData>;
}

/**
 * Recursively flattens a nested sitemap structure into a flat array of SitemapSection.
 * Preserves hierarchy information via slug, parent_slug, and depth fields.
 * 
 * @param pagesObj - The pages object from the RAG sitemap JSON (can have nested children)
 * @param parentSlug - The parent page's slug (for hierarchy tracking)
 * @param depth - Current nesting depth (0 = top-level)
 * @returns Flat array of SitemapSection with hierarchy fields populated
 */
export function flattenSitemapPages(
  pagesObj: Record<string, RagPageData>,
  parentSlug: string | null = null,
  depth: number = 0
): SitemapSection[] {
  const result: SitemapSection[] = [];

  for (const [pageTitle, pageData] of Object.entries(pagesObj)) {
    // Convert model_query_pairs to SitemapItem array
    const items: SitemapItem[] = (pageData.model_query_pairs || []).map((pair) => ({
      id: pair.internal_id || `item-${Date.now()}-${Math.random()}`,
      model: pair.model,
      query: pair.query,
      useDefault: pair.use_default || false,
    }));

    // Create the flattened page
    const flattenedPage: SitemapSection = {
      id: pageData.internal_id || `page-${Date.now()}-${Math.random()}`,
      title: pageTitle,
      items,
      wordpress_id: pageData.page_id,
      slug: pageData.slug,
      description: pageData.description,
      parent_slug: parentSlug || undefined,
      depth,
      // Allocation fields
      allocated_markdown: pageData.allocated_markdown,
      allocation_confidence: pageData.allocation_confidence,
      source_location: pageData.source_location,
      mapped_scraped_page: pageData.mapped_scraped_page,
    };

    result.push(flattenedPage);

    // Recursively process children
    if (pageData.children && Object.keys(pageData.children).length > 0) {
      const childPages = flattenSitemapPages(
        pageData.children,
        pageData.slug || null,
        depth + 1
      );
      result.push(...childPages);
    }
  }

  return result;
}

/**
 * Checks if a sitemap JSON object has nested children that need flattening.
 * 
 * @param sitemapJson - The sitemap JSON to check
 * @returns true if any page has children
 */
export function hasNestedChildren(sitemapJson: RagSitemapJson): boolean {
  if (!sitemapJson?.pages) return false;

  for (const pageData of Object.values(sitemapJson.pages)) {
    if (pageData.children && Object.keys(pageData.children).length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Converts a RAG sitemap JSON (potentially nested) into a flat array of SitemapSection.
 * This is the main entry point for importing sitemaps.
 * 
 * @param sitemapJson - The raw sitemap JSON from RAG generator or storage
 * @returns Flat array of SitemapSection ready for use in the UI
 */
export function importSitemapJson(sitemapJson: RagSitemapJson | unknown): SitemapSection[] {
  // Handle null/undefined
  if (!sitemapJson || typeof sitemapJson !== 'object') {
    return [];
  }

  // Check if it has the expected 'pages' structure
  const json = sitemapJson as RagSitemapJson;
  if (!json.pages || typeof json.pages !== 'object') {
    // Try to handle if it's already an array
    if (Array.isArray(sitemapJson)) {
      return sitemapJson as SitemapSection[];
    }
    return [];
  }

  return flattenSitemapPages(json.pages);
}

/**
 * Gets the parent page title for a given page (based on parent_slug).
 * Useful for displaying breadcrumb-style hierarchy indicators.
 * 
 * @param page - The page to find parent for
 * @param allPages - All pages in the sitemap
 * @returns Parent page title or undefined if no parent
 */
export function getParentPageTitle(
  page: SitemapSection,
  allPages: SitemapSection[]
): string | undefined {
  if (!page.parent_slug) return undefined;
  
  const parent = allPages.find(p => p.slug === page.parent_slug);
  return parent?.title;
}

/**
 * Gets the full breadcrumb path for a page.
 * 
 * @param page - The page to get breadcrumb for
 * @param allPages - All pages in the sitemap
 * @returns Array of page titles from root to current page
 */
export function getPageBreadcrumb(
  page: SitemapSection,
  allPages: SitemapSection[]
): string[] {
  const breadcrumb: string[] = [];
  let current: SitemapSection | undefined = page;
  
  while (current) {
    breadcrumb.unshift(current.title);
    if (current.parent_slug) {
      current = allPages.find(p => p.slug === current!.parent_slug);
    } else {
      break;
    }
  }
  
  return breadcrumb;
}








