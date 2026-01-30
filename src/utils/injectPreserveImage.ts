/**
 * Utility functions for injecting preserve_image into generated content
 */

export interface SitemapPage {
  id: string;
  title: string;
  wordpress_id?: string;
  items: Array<{
    id: string;
    model: string;
    query: string;
    preserve_image?: boolean;
  }>;
}

export interface GeneratedComponent {
  acf_fc_layout?: string;
  preserve_image?: boolean;
  [key: string]: unknown;
}

export type PreserveImageMap = Map<string, Map<number, boolean>>;

/**
 * Creates a preserve_image map from sitemap pages.
 * Maps page key (title/wordpress_id/id) -> component index -> preserve_image value
 */
export function createPreserveImageMap(pages: SitemapPage[]): PreserveImageMap {
  const preserveImageMap = new Map<string, Map<number, boolean>>();

  pages.forEach(page => {
    const pageKey = page.title || page.wordpress_id || page.id;
    const itemMap = new Map<number, boolean>();

    page.items.forEach((item, index) => {
      if (item.preserve_image !== undefined) {
        itemMap.set(index, item.preserve_image);
      }
    });

    if (itemMap.size > 0) {
      preserveImageMap.set(pageKey, itemMap);
    }
  });

  return preserveImageMap;
}

/**
 * Injects preserve_image values into generated content based on the preserve_image map.
 * Matches by page key and component index.
 */
export function injectPreserveImageIntoContent(
  generatedContent: Record<string, GeneratedComponent[]>,
  preserveImageMap: PreserveImageMap
): Record<string, GeneratedComponent[]> {
  const result: Record<string, GeneratedComponent[]> = {};

  for (const [pageKey, pageComponents] of Object.entries(generatedContent)) {
    if (!Array.isArray(pageComponents)) {
      result[pageKey] = pageComponents;
      continue;
    }

    // Find matching preserve_image map by page key
    const itemMap = preserveImageMap.get(pageKey);

    if (!itemMap || itemMap.size === 0) {
      result[pageKey] = pageComponents;
      continue;
    }

    // Inject preserve_image into each component based on index
    const componentsWithPreserveImage = pageComponents.map((component, index) => {
      const shouldPreserve = itemMap.get(index);
      if (shouldPreserve) {
        return { ...component, preserve_image: true };
      }
      return component;
    });

    result[pageKey] = componentsWithPreserveImage;
  }

  return result;
}

/**
 * Alternative function that directly takes sitemap pages instead of a pre-built map.
 * Useful for one-shot injection without storing the map.
 */
export function injectPreserveImageFromSitemap(
  generatedContent: Record<string, GeneratedComponent[]>,
  sitemapPages: SitemapPage[]
): Record<string, GeneratedComponent[]> {
  const preserveImageMap = createPreserveImageMap(sitemapPages);
  return injectPreserveImageIntoContent(generatedContent, preserveImageMap);
}
