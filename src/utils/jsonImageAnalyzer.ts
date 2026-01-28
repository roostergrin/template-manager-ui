/**
 * JSON Image Analyzer utilities
 * Ported from image-picker/src/app/json-analyzer/utils.ts
 * Used by the workflow to find and replace images in page content JSON
 */

export interface ImageSlot {
  id: string;
  path: string;
  src: string;
  webp: string;
  alt: string;
  needsImage: boolean;
  preserveImage: boolean;
  contextCategory?: string;
  sectionTitle?: string;
  sectionLayout?: string;
  sectionDescription?: string;
  rawSectionData?: Record<string, unknown>;
}

export interface ParsedSection {
  pageName: string;
  sectionIndex: number;
  layoutType: string;
  title?: string;
  imageSlots: ImageSlot[];
  imagesNeeded: number;
  imagesHave: number;
}

export interface ParsedPage {
  name: string;
  sections: ParsedSection[];
  totalImagesNeeded: number;
  totalImagesHave: number;
}

export interface ParsedJson {
  pages: ParsedPage[];
  totalImagesNeeded: number;
  totalImages: number;
  rawJson: Record<string, unknown>;
}

export interface ImageAgentResult {
  id: number;
  title: string;
  thumbnail_url: string;
  comp_url?: string;
  keywords: string[];
  is_licensed: boolean;
  adobe_also_selected: boolean;
  s3_url?: string;
  filename?: string;
}

export interface ImageAgentResponse {
  success: boolean;
  results?: {
    licensed_results: ImageAgentResult[];
    catalog_results: ImageAgentResult[];
    top_licensed_pick?: ImageAgentResult;
    top_catalog_pick?: ImageAgentResult;
    overlap_count: number;
  };
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImageObject(obj: Record<string, unknown>): boolean {
  if ('type' in obj && typeof obj.type === 'string') {
    return false;
  }
  const hasSrc = 'src' in obj;
  const hasWebp = 'webp' in obj;
  const hasAlt = 'alt' in obj;
  return hasWebp || (hasSrc && hasAlt);
}

function generateSlotId(path: string): string {
  return `slot-${path.replace(/[\[\].]/g, '-')}`;
}

function deepScanForImages(
  obj: unknown,
  currentPath: string,
  sectionContext: { title?: string; layout?: string; description?: string; preserveImage?: boolean },
  rawSectionData?: Record<string, unknown>
): ImageSlot[] {
  const slots: ImageSlot[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = `${currentPath}[${index}]`;
      const itemTitle = isObject(item) ? (item.title as string) : undefined;

      slots.push(...deepScanForImages(item, itemPath, {
        ...sectionContext,
        title: itemTitle || sectionContext.title
      }, rawSectionData));
    });
  } else if (isObject(obj)) {
    if (isImageObject(obj)) {
      const src = (obj.src as string) || '';
      const webp = (obj.webp as string) || '';
      const alt = (obj.alt as string) || '';
      const hints = obj.image_selection_hints as Record<string, unknown> | undefined;
      const contextCategory = hints?.context_category as string | undefined;

      slots.push({
        id: generateSlotId(currentPath),
        path: currentPath,
        src,
        webp,
        alt,
        needsImage: !src && !webp,
        preserveImage: sectionContext.preserveImage ?? false,
        contextCategory,
        sectionTitle: sectionContext.title,
        sectionLayout: sectionContext.layout,
        sectionDescription: sectionContext.description,
        rawSectionData,
      });
    }

    for (const [key, value] of Object.entries(obj)) {
      if (['seo', 'component_options', 'button', 'buttons', 'video'].includes(key)) {
        continue;
      }

      const newPath = currentPath ? `${currentPath}.${key}` : key;
      slots.push(...deepScanForImages(value, newPath, sectionContext, rawSectionData));
    }
  }

  return slots;
}

function extractParagraphText(sectionData: Record<string, unknown>): string | undefined {
  const paragraphs = sectionData.paragraphs as Array<{ text?: string }> | undefined;
  if (paragraphs && Array.isArray(paragraphs)) {
    const texts = paragraphs
      .map(p => p.text)
      .filter(Boolean)
      .join(' ');
    return texts || undefined;
  }
  return undefined;
}

function parseSection(
  pageName: string,
  sectionIndex: number,
  sectionData: Record<string, unknown>
): ParsedSection {
  const layoutType = (sectionData.acf_fc_layout as string) || 'unknown';
  const title = (sectionData.title as string) || undefined;
  const description = extractParagraphText(sectionData);
  const preserveImage = sectionData.preserve_image === true;

  console.log(`[parseSection] ${pageName}[${sectionIndex}] layout=${layoutType}, preserve_image=${preserveImage}`);

  const basePath = `${pageName}[${sectionIndex}]`;
  const imageSlots = deepScanForImages(sectionData, basePath, {
    title,
    layout: layoutType,
    description,
    preserveImage
  }, sectionData);

  console.log(`[parseSection] ${pageName}[${sectionIndex}] found ${imageSlots.length} image slots`);

  const uniqueSlots = imageSlots.filter((slot, index, self) => {
    return !self.some((other, otherIndex) =>
      otherIndex !== index && other.path.startsWith(slot.path + '.')
    );
  });

  const imagesNeeded = uniqueSlots.filter(s => s.needsImage).length;
  const imagesHave = uniqueSlots.filter(s => !s.needsImage).length;

  return {
    pageName,
    sectionIndex,
    layoutType,
    title,
    imageSlots: uniqueSlots,
    imagesNeeded,
    imagesHave,
  };
}

function parsePage(pathPrefix: string, pageData: unknown[], displayName?: string): ParsedPage {
  const sections: ParsedSection[] = [];

  pageData.forEach((sectionData, index) => {
    if (isObject(sectionData)) {
      if ('seo' in sectionData && !('acf_fc_layout' in sectionData)) {
        return;
      }
      sections.push(parseSection(pathPrefix, index, sectionData));
    }
  });

  const totalImagesNeeded = sections.reduce((sum, s) => sum + s.imagesNeeded, 0);
  const totalImagesHave = sections.reduce((sum, s) => sum + s.imagesHave, 0);

  return {
    name: displayName || pathPrefix,
    sections,
    totalImagesNeeded,
    totalImagesHave
  };
}

/**
 * Parse JSON structure to find all image slots
 */
export function parseJsonForImages(json: Record<string, unknown>): ParsedJson {
  const pages: ParsedPage[] = [];

  let pagesData: Record<string, unknown> = json;
  let hasWrapper = false;

  // Debug logging
  console.log('[parseJsonForImages] Input keys:', Object.keys(json));

  if ('pages' in json && isObject(json.pages)) {
    pagesData = json.pages as Record<string, unknown>;
    hasWrapper = true;
    console.log('[parseJsonForImages] Found pages wrapper, inner keys:', Object.keys(pagesData));
  }

  for (const [key, value] of Object.entries(pagesData)) {
    console.log(`[parseJsonForImages] Processing key "${key}", isArray: ${Array.isArray(value)}, type: ${typeof value}`);
    if (Array.isArray(value)) {
      const pathPrefix = hasWrapper ? `pages.${key}` : key;
      const parsedPage = parsePage(pathPrefix, value, key);
      console.log(`[parseJsonForImages] Page "${key}" has ${parsedPage.sections.length} sections, ${parsedPage.totalImagesNeeded + parsedPage.totalImagesHave} images`);
      pages.push(parsedPage);
    }
  }

  const totalImagesNeeded = pages.reduce((sum, p) => sum + p.totalImagesNeeded, 0);
  const totalImages = pages.reduce((sum, p) => sum + p.totalImagesNeeded + p.totalImagesHave, 0);

  return {
    pages,
    totalImagesNeeded,
    totalImages,
    rawJson: json
  };
}

/**
 * Update an image slot in the JSON with new URLs
 */
export function updateImageSlot(
  json: Record<string, unknown>,
  path: string,
  src: string,
  webp?: string
): Record<string, unknown> {
  const updated = JSON.parse(JSON.stringify(json));

  const parts = path.match(/([^[\].]+|\[\d+\])/g) || [];
  let current: unknown = updated;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    if (part.startsWith('[') && part.endsWith(']')) {
      const index = parseInt(part.slice(1, -1), 10);
      if (Array.isArray(current)) {
        if (isLast) {
          break;
        }
        current = current[index];
      }
    } else {
      if (isObject(current)) {
        if (isLast) {
          const imageObj = current[part] as Record<string, unknown>;
          if (imageObj) {
            imageObj.src = src;
            imageObj.webp = webp || src.replace(/f-jpg/, 'f-webp').replace(/\.jpg/, '.webp');
          }
        } else {
          current = current[part];
        }
      }
    }
  }

  return updated;
}

/**
 * CloudFront domain for stock images
 * Set via VITE_CLOUDFRONT_IMAGE_DOMAIN environment variable
 */
const CLOUDFRONT_IMAGE_DOMAIN = import.meta.env.VITE_CLOUDFRONT_IMAGE_DOMAIN || '';

/**
 * Get CloudFront URL for a stock image
 * For hero components, uses hero/ prefix (1920x1280)
 * For standard images, uses standard/ prefix (1000w)
 *
 * @deprecated Use getStockImageUrl for new code. This function name is kept for backward compatibility.
 */
export function getImageKitUrl(filename: string, isHero: boolean = false): { src: string; webp: string } {
  return getStockImageUrl(filename, isHero);
}

/**
 * Get CloudFront URL for a stock image
 * For hero components, uses hero/ prefix (1920x1280)
 * For standard images, uses standard/ prefix (1000w)
 */
export function getStockImageUrl(filename: string, isHero: boolean = false): { src: string; webp: string } {
  // Strip any existing path prefix and extension from filename
  const cleanFilename = filename.split('/').pop()?.replace(/\.[^/.]+$/, '') || filename;

  if (!CLOUDFRONT_IMAGE_DOMAIN) {
    // Fallback to ImageKit if CloudFront not configured
    const baseUrl = 'https://ik.imagekit.io/rooster';
    const transform = isHero ? 'tr:w-1920,h-1280' : 'tr:w-1000';
    const src = `${baseUrl}/${transform},f-jpg,q-auto,fo-auto/${filename}`;
    const webp = `${baseUrl}/${transform},f-webp,q-auto,fo-auto/${filename}`;
    return { src, webp };
  }

  const baseUrl = `https://${CLOUDFRONT_IMAGE_DOMAIN}`;
  const sizePrefix = isHero ? 'hero' : 'standard';

  const src = `${baseUrl}/${sizePrefix}/${cleanFilename}.jpg`;
  const webp = `${baseUrl}/${sizePrefix}/${cleanFilename}.webp`;
  return { src, webp };
}

/**
 * Get all image slots that need images (not preserved, needing replacement)
 */
export function getSlotsNeedingImages(parsedJson: ParsedJson, includeExisting: boolean = false): ImageSlot[] {
  const slots: ImageSlot[] = [];

  for (const page of parsedJson.pages) {
    for (const section of page.sections) {
      for (const slot of section.imageSlots) {
        // Skip preserved images
        if (slot.preserveImage) continue;
        // Include if needs image, or if we want to include existing images too
        if (slot.needsImage || includeExisting) {
          slots.push(slot);
        }
      }
    }
  }

  return slots;
}
