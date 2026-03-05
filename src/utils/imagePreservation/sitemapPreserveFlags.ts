/**
 * Mirrors the backend's _should_preserve_image() logic from rag_sitemap_generator.py
 * so the frontend sitemap has preserve_image flags without needing a separate copy.
 *
 * If backend's _should_preserve_image() changes, update this function to match.
 */
export function injectPreserveImageFlags<T extends {
  pages: Record<string, { model_query_pairs: Array<{ model: string; query: string; preserve_image?: boolean }> }>
}>(sitemap: T): T {
  const result = JSON.parse(JSON.stringify(sitemap)) as T;
  for (const [pageKey, page] of Object.entries(result.pages)) {
    const pageLower = pageKey.toLowerCase();
    for (const pair of page.model_query_pairs) {
      const modelLower = pair.model.toLowerCase();
      const queryLower = pair.query.toLowerCase();

      // Doctor/provider photos on home or about-like pages
      if (['home', 'about', 'about us', 'meet the team', 'our team'].includes(pageLower)) {
        if (['image text', 'tabs'].includes(modelLower)) {
          if (['doctor', 'dr.', 'meet the', 'headshot', 'photo', 'provider', 'orthodontist', 'dentist'].some(k => queryLower.includes(k))) {
            pair.preserve_image = true;
            continue;
          }
        }

        // Team photos and office tour on about-like pages only
        if (pageLower.includes('about') || pageLower.includes('team')) {
          if (modelLower === 'block grid') {
            if (['team', 'staff', 'member', 'profile'].some(k => queryLower.includes(k))) {
              pair.preserve_image = true;
              continue;
            }
          }
          if (modelLower === 'single image slider') {
            if (['office', 'tour', 'facility', 'gallery'].some(k => queryLower.includes(k))) {
              pair.preserve_image = true;
              continue;
            }
          }
        }
      }
    }
  }
  return result;
}
