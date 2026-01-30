/**
 * Sanitizes scraped content before using it as practice context.
 * Removes noise that isn't useful for AI content generation:
 * - Inline SVG data URIs
 * - Google Maps tiles and map controls
 * - JavaScript code blocks
 * - Navigation/UI hint text
 * - Base64 encoded images
 */

/**
 * Patterns to remove from scraped content
 */
const REMOVAL_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  // Inline SVG data URIs in markdown images
  {
    pattern: /!\[Image\]\(data:image\/svg\+xml[^)]+\)\n?/g,
    description: 'Inline SVG data URIs',
  },
  // Base64 encoded images
  {
    pattern: /!\[Image\]\(data:image\/[a-z]+;base64[^)]+\)\n?/g,
    description: 'Base64 encoded images',
  },
  // Google Maps tile images
  {
    pattern: /!\[Image\]\(https:\/\/maps\.googleapis\.com\/maps\/vt[^)]+\)\n?/g,
    description: 'Google Maps tiles',
  },
  // Google static map images
  {
    pattern: /!\[Image\]\(https:\/\/maps\.gstatic\.com[^)]+\)\n?/g,
    description: 'Google static map images',
  },
  // JavaScript variable declarations and function calls for maps
  {
    pattern: /var\s+map_[a-z0-9_]+[\s\S]*?(?=\n[A-Z]|\n#|\n\n[A-Z]|$)/gi,
    description: 'Map JavaScript variables',
  },
  // Map initialization JavaScript
  {
    pattern: /function\s+(fusion_run_map|awbMapInit)[^}]+\}[^}]*\}/g,
    description: 'Map initialization functions',
  },
  // Google Maps event listeners
  {
    pattern: /google\.maps\.event\.addDomListener[^;]+;/g,
    description: 'Google Maps event listeners',
  },
  // CDATA blocks
  {
    pattern: /\/\*\s*<!\[CDATA\[\s*\*\/[\s\S]*?\/\/[^\n]*\n?\s*\/\*\s*\]\]>\s*\*\//g,
    description: 'CDATA blocks',
  },
  // Map control navigation hints
  {
    pattern: /^[←→↑↓]\n.+\n?/gm,
    description: 'Arrow navigation hints',
  },
  // Map zoom/navigation shortcuts
  {
    pattern: /^(\+|-|Home|End|Page Up|Page Down)\n.+(\n|$)/gm,
    description: 'Map keyboard shortcuts',
  },
  // Map type labels (standalone)
  {
    pattern: /^(Map|Terrain|Satellite|Labels)$/gm,
    description: 'Map type labels',
  },
  // Click instructions for maps
  {
    pattern: /Click to toggle between metric and imperial units\n?/g,
    description: 'Map click instructions',
  },
  // Map data attribution (keep if meaningful, remove if standalone)
  {
    pattern: /^Map Data\n?Map data ©\d{4} Google\n?Map data ©\d{4} Google\n?/gm,
    description: 'Duplicate map attribution',
  },
  // fusionMapNonce and other nonce variables
  {
    pattern: /var\s+fusionMapNonce\s*=\s*'[^']+';?\n?/g,
    description: 'Map nonce variables',
  },
  // Markers and counter variables
  {
    pattern: /var\s+(markers|counter)\s*=\s*[^;]+;\n?/g,
    description: 'Map marker variables',
  },
  // Empty or near-empty fusion-* class references
  {
    pattern: /^fusion-(columns|row)\s*$/gm,
    description: 'Empty fusion class references',
  },
];

/**
 * Lines that should be removed when they appear alone
 */
const STANDALONE_REMOVALS = [
  'Move left',
  'Move right',
  'Move up',
  'Move down',
  'Zoom in',
  'Zoom out',
  'Jump left by 75%',
  'Jump right by 75%',
  'Jump up by 75%',
  'Jump down by 75%',
];

/**
 * Sanitize markdown content by removing noisy elements
 * @param content - Raw markdown content from scraping
 * @returns Cleaned markdown content
 */
export function sanitizePracticeContext(content: string): string {
  if (!content) return '';

  let sanitized = content;

  // Apply regex removal patterns
  for (const { pattern } of REMOVAL_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove standalone navigation hints (line by line)
  const lines = sanitized.split('\n');
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !STANDALONE_REMOVALS.includes(trimmed);
  });
  sanitized = filteredLines.join('\n');

  // Clean up excessive blank lines (more than 2 consecutive)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Trim leading/trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize all pages in a scraped content object
 * @param scrapedContent - Object with pages keyed by URL
 * @returns New object with sanitized page content
 */
export function sanitizeScrapedPages(
  pages: Record<string, string>
): Record<string, string> {
  const sanitizedPages: Record<string, string> = {};

  for (const [url, markdown] of Object.entries(pages)) {
    sanitizedPages[url] = sanitizePracticeContext(markdown);
  }

  return sanitizedPages;
}

/**
 * Get statistics about what was removed
 * @param original - Original content
 * @param sanitized - Sanitized content
 * @returns Object with removal statistics
 */
export function getSanitizationStats(
  original: string,
  sanitized: string
): {
  originalLength: number;
  sanitizedLength: number;
  removedChars: number;
  removedPercent: number;
} {
  const originalLength = original.length;
  const sanitizedLength = sanitized.length;
  const removedChars = originalLength - sanitizedLength;
  const removedPercent =
    originalLength > 0 ? Math.round((removedChars / originalLength) * 100) : 0;

  return {
    originalLength,
    sanitizedLength,
    removedChars,
    removedPercent,
  };
}
