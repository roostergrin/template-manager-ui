/**
 * Theme Builder Utility
 *
 * Builds theme.json from design system data with accessibility information.
 * Extracted from DesignSystemViewer for reuse in unified workflow.
 */

import { DesignSystemData, LogoConfig } from '../types/APIServiceTypes';

export interface ThemeColorEntry {
  label: string;
  color: { red: number; green: number; blue: number; alpha: number };
  hex: string;
  accessibility: {
    luminance: number;
    luminancePercent: string;
    recommendedTextColor: string;
    contrastRatio: number;
    wcagRating: string;
  };
}

export interface ThemeTypographyEntry {
  label: string;
  font: string;
}

export interface ThemeDefault {
  colors: ThemeColorEntry[];
  typography: ThemeTypographyEntry[];
  logo_url: string | null;
  logo_config: LogoConfig | null;
  logo_colors: {
    colors: Array<{ hex: string; luminosity_percent: number; count: number }>;
    dominant_color: string;
    avg_luminosity: number;
    is_light: boolean;
  } | null;
  favicon_url: string | null;
}

export interface ThemeJson {
  default: ThemeDefault;
}

/**
 * Check if a string is a valid hex color
 */
export const isValidHex = (hex: string | null | undefined): boolean => {
  if (!hex || typeof hex !== 'string') return false;
  const cleanHex = hex.replace('#', '');
  // Valid hex colors are 3, 6, or 8 characters (8 includes alpha)
  if (![3, 6, 8].includes(cleanHex.length)) return false;
  // Must only contain valid hex characters
  return /^[0-9a-fA-F]+$/.test(cleanHex);
};

/**
 * Ensure a hex color is valid, returning fallback if not
 */
export const ensureValidHex = (hex: string | null | undefined, fallback: string): string => {
  return isValidHex(hex) ? hex! : fallback;
};

/**
 * Convert hex color to RGBA format for theme.json
 */
export const hexToRgba = (hex: string): { red: number; green: number; blue: number; alpha: number } => {
  // Validate input to prevent NaN issues
  if (!isValidHex(hex)) {
    console.warn(`Invalid hex color: ${hex}, using fallback #000000`);
    hex = '#000000';
  }
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  return {
    red: parseInt(fullHex.substring(0, 2), 16),
    green: parseInt(fullHex.substring(2, 4), 16),
    blue: parseInt(fullHex.substring(4, 6), 16),
    alpha: 1
  };
};

/**
 * Calculate relative luminance (WCAG formula)
 */
export const getLuminance = (hex: string): number => {
  const rgba = hexToRgba(hex);
  const adjust = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * adjust(rgba.red) + 0.7152 * adjust(rgba.green) + 0.0722 * adjust(rgba.blue);
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Get accessible text color (white or black) for a background
 */
export const getAccessibleTextColor = (bgHex: string): { color: string; contrast: number } => {
  const whiteContrast = getContrastRatio(bgHex, '#ffffff');
  const blackContrast = getContrastRatio(bgHex, '#000000');
  return whiteContrast > blackContrast
    ? { color: '#ffffff', contrast: whiteContrast }
    : { color: '#000000', contrast: blackContrast };
};

/**
 * Get WCAG rating based on contrast ratio
 */
export const getWcagRating = (contrast: number): { rating: string; class: string } => {
  if (contrast >= 7) return { rating: 'AAA', class: 'wcag-aaa' };
  if (contrast >= 4.5) return { rating: 'AA', class: 'wcag-aa' };
  if (contrast >= 3) return { rating: 'AA Large', class: 'wcag-aa-large' };
  return { rating: 'Fail', class: 'wcag-fail' };
};

/**
 * Format font stack for theme.json
 */
export const formatFontStack = (fontFamily: string | null | undefined, type: 'body' | 'heading'): string => {
  const defaultBody = "'Open Sans', helvetica, arial, sans-serif";
  const defaultHeading = "'Archivo', sans-serif";

  if (!fontFamily) return type === 'body' ? defaultBody : defaultHeading;

  const font = fontFamily.trim();
  if (font.includes(',')) return font;

  const quotedFont = font.startsWith("'") || font.startsWith('"') ? font : `'${font}'`;
  return type === 'body'
    ? `${quotedFont}, helvetica, arial, sans-serif`
    : `${quotedFont}, sans-serif`;
};

/**
 * Determine logo config based on URL (basic client-side detection)
 * Full color analysis is done on the backend via /generate-theme/ endpoint
 */
export const determineLogoConfig = (logoUrl: string | null | undefined): LogoConfig | null => {
  if (!logoUrl) return null;

  const urlLower = logoUrl.toLowerCase();
  const isSvg = (
    urlLower.startsWith('data:image/svg') ||
    urlLower.endsWith('.svg') ||
    urlLower.includes('.svg?') ||
    urlLower.includes('.svg#')
  );

  // Default to 'dark' variant (most logos are designed for light backgrounds)
  // Backend analysis will provide accurate variant based on actual color analysis
  return {
    type: isSvg ? 'svg' : 'url',
    variant: 'dark',
    url: isSvg ? null : logoUrl
  };
};

/**
 * Build a color entry with accessibility information
 */
export const buildColorEntry = (label: string, hex: string): ThemeColorEntry => {
  const luminance = getLuminance(hex);
  const accessibleText = getAccessibleTextColor(hex);
  const wcag = getWcagRating(accessibleText.contrast);
  return {
    label,
    color: hexToRgba(hex),
    hex,
    accessibility: {
      luminance: Math.round(luminance * 100) / 100,
      luminancePercent: `${Math.round(luminance * 100)}%`,
      recommendedTextColor: accessibleText.color,
      contrastRatio: Math.round(accessibleText.contrast * 100) / 100,
      wcagRating: wcag.rating
    }
  };
};

/**
 * Extended design system interface for theme building
 */
interface ExtendedDesignSystem extends DesignSystemData {
  logo_config?: LogoConfig | null;
  logo_colors?: {
    colors: Array<{ hex: string; luminosity_percent: number; count: number }>;
    dominant_color: string;
    avg_luminosity: number;
    is_light: boolean;
  } | null;
  raw?: {
    all_colors?: Array<{ color: string; count: number }>;
    brand_colors?: Array<{ color: string; count: number }>;
    [key: string]: unknown;
  };
}

/**
 * Check if a color is a "vibrant" brand color (not white/black/gray)
 */
const isVibrantColor = (hex: string): boolean => {
  const rgba = hexToRgba(hex);
  const { red, green, blue } = rgba;

  // Check if it's grayscale (r ≈ g ≈ b)
  const maxDiff = Math.max(
    Math.abs(red - green),
    Math.abs(green - blue),
    Math.abs(red - blue)
  );

  // If max difference is small, it's grayscale
  if (maxDiff < 30) return false;

  // Check luminance - not too dark or too light
  const luminance = getLuminance(hex);
  if (luminance < 0.05 || luminance > 0.85) return false;

  return true;
};

/**
 * Calculate color distance using simple Euclidean distance in RGB space
 * Returns a value from 0 (identical) to ~441 (max difference black to white)
 */
const getColorDistance = (hex1: string, hex2: string): number => {
  const c1 = hexToRgba(hex1);
  const c2 = hexToRgba(hex2);
  return Math.sqrt(
    Math.pow(c1.red - c2.red, 2) +
    Math.pow(c1.green - c2.green, 2) +
    Math.pow(c1.blue - c2.blue, 2)
  );
};

/**
 * Check if two colors are visually similar (distance < threshold)
 * Threshold of 30 catches near-duplicates like #99ca3c vs #99c93c
 */
const areColorsSimilar = (hex1: string, hex2: string, threshold = 30): boolean => {
  return getColorDistance(hex1, hex2) < threshold;
};

/**
 * Darken a color by a factor (0-1, where 0.7 = 30% darker)
 */
const darkenColor = (hex: string, factor = 0.6): string => {
  const rgba = hexToRgba(hex);
  const darken = (c: number) => Math.round(c * factor);
  const r = darken(rgba.red).toString(16).padStart(2, '0');
  const g = darken(rgba.green).toString(16).padStart(2, '0');
  const b = darken(rgba.blue).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

/**
 * Check if a color is "dark" (luminance < 0.3)
 */
const isDarkColor = (hex: string): boolean => {
  return getLuminance(hex) < 0.3;
};

/**
 * Check if a color is "light" (luminance > threshold)
 */
export const isLightColor = (hex: string, threshold = 0.7): boolean => {
  return getLuminance(hex) > threshold;
};

// ============================================================================
// COLOR SLOT VALIDATION SYSTEM
// ============================================================================

/**
 * Color slot specification defining luminance requirements
 */
export interface ColorSlotSpec {
  name: string;
  label: string;
  minLuminance: number;
  maxLuminance: number;
  defaultColor: string;
  description: string;
  requirement: 'dark' | 'light' | 'medium';
}

/**
 * Complete color slot specifications with luminance bounds
 * - Dark slots: luminance 0-0.4 (readable on light backgrounds)
 * - Light slots: luminance 0.7-1.0 (suitable for backgrounds)
 */
export const COLOR_SLOT_SPECS: Record<string, ColorSlotSpec> = {
  primary: {
    name: 'primary',
    label: 'Primary',
    minLuminance: 0,
    maxLuminance: 0.4,
    defaultColor: '#1c79a0',
    description: 'Brand buttons, links - must be dark for readability on white',
    requirement: 'dark'
  },
  secondary: {
    name: 'secondary',
    label: 'Secondary',
    minLuminance: 0,
    maxLuminance: 0.4,
    defaultColor: '#13526e',
    description: 'Secondary brand elements - must be dark',
    requirement: 'dark'
  },
  accent: {
    name: 'accent',
    label: 'Accent',
    minLuminance: 0,
    maxLuminance: 0.4,
    defaultColor: '#ed6a40',
    description: 'CTA buttons, highlights - must be dark',
    requirement: 'dark'
  },
  text: {
    name: 'text',
    label: 'Text',
    minLuminance: 0,
    maxLuminance: 0.25,
    defaultColor: '#272727',
    description: 'Main body text - must be very dark',
    requirement: 'dark'
  },
  'bg-1': {
    name: 'bg-1',
    label: 'Background 1',
    minLuminance: 0.85,
    maxLuminance: 1.0,
    defaultColor: '#ffffff',
    description: 'Primary background - must be very light',
    requirement: 'light'
  },
  'bg-2': {
    name: 'bg-2',
    label: 'Background 2',
    minLuminance: 0.7,
    maxLuminance: 1.0,
    defaultColor: '#f5f5f5',
    description: 'Secondary background/cards',
    requirement: 'light'
  },
  'topbar-light': {
    name: 'topbar-light',
    label: 'Topbar Light',
    minLuminance: 0.7,
    maxLuminance: 1.0,
    defaultColor: '#f2f2f2',
    description: 'Light header variant',
    requirement: 'light'
  },
  'topbar-dark': {
    name: 'topbar-dark',
    label: 'Topbar Dark',
    minLuminance: 0,
    maxLuminance: 0.3,
    defaultColor: '#1a1a1a',
    description: 'Dark header variant',
    requirement: 'dark'
  }
};

/**
 * Lighten a color by mixing it with white
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-1, where 0.5 = 50% lighter)
 */
export const lightenColor = (hex: string, amount = 0.5): string => {
  const rgba = hexToRgba(hex);
  const lighten = (c: number) => Math.round(c + (255 - c) * amount);
  const r = Math.min(255, lighten(rgba.red)).toString(16).padStart(2, '0');
  const g = Math.min(255, lighten(rgba.green)).toString(16).padStart(2, '0');
  const b = Math.min(255, lighten(rgba.blue)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

/**
 * Adjust color luminance to target value while preserving hue
 * Uses iterative approach for precision
 */
export const adjustLuminance = (
  hex: string,
  targetLuminance: number,
  maxIterations = 10
): string => {
  let currentHex = hex;
  let currentLuminance = getLuminance(currentHex);

  for (let i = 0; i < maxIterations; i++) {
    const diff = targetLuminance - currentLuminance;
    if (Math.abs(diff) < 0.02) break; // Close enough

    if (diff > 0) {
      // Need to lighten
      currentHex = lightenColor(currentHex, Math.min(0.3, diff * 2));
    } else {
      // Need to darken
      currentHex = darkenColor(currentHex, Math.max(0.7, 1 + diff * 2));
    }
    currentLuminance = getLuminance(currentHex);
  }

  return currentHex;
};

/**
 * Correction result with metadata for logging
 */
export interface ColorCorrectionResult {
  originalColor: string;
  correctedColor: string;
  wasCorrected: boolean;
  reason?: string;
  originalLuminance: number;
  correctedLuminance: number;
}

/**
 * Correct a color to meet slot requirements while preserving brand identity
 */
export const correctColorForSlot = (
  hex: string,
  spec: ColorSlotSpec
): ColorCorrectionResult => {
  const originalLuminance = getLuminance(hex);

  // Check if color already meets requirements
  if (originalLuminance >= spec.minLuminance && originalLuminance <= spec.maxLuminance) {
    return {
      originalColor: hex,
      correctedColor: hex,
      wasCorrected: false,
      originalLuminance,
      correctedLuminance: originalLuminance
    };
  }

  // Determine target luminance (aim for middle of range, biased toward original)
  let targetLuminance: number;
  let reason: string;

  if (originalLuminance < spec.minLuminance) {
    // Too dark - need to lighten
    targetLuminance = spec.minLuminance + 0.05;
    reason = `Color too dark (${(originalLuminance * 100).toFixed(0)}%) for ${spec.label} slot (requires >${(spec.minLuminance * 100).toFixed(0)}%)`;
  } else {
    // Too light - need to darken
    targetLuminance = spec.maxLuminance - 0.05;
    reason = `Color too light (${(originalLuminance * 100).toFixed(0)}%) for ${spec.label} slot (requires <${(spec.maxLuminance * 100).toFixed(0)}%)`;
  }

  const correctedColor = adjustLuminance(hex, targetLuminance);
  const correctedLuminance = getLuminance(correctedColor);

  return {
    originalColor: hex,
    correctedColor,
    wasCorrected: true,
    reason,
    originalLuminance,
    correctedLuminance
  };
};

/**
 * Validation result for a single color slot
 */
export interface SlotValidationResult {
  slot: string;
  inputColor: string;
  outputColor: string;
  isValid: boolean;
  wasCorrected: boolean;
  luminance: number;
  requiredRange: { min: number; max: number };
  message?: string;
}

/**
 * Complete theme validation result
 */
export interface ThemeValidationResult {
  isValid: boolean;
  corrections: SlotValidationResult[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate a single color against its slot specification
 */
export const validateColorSlot = (
  color: string | null | undefined,
  slotName: string
): SlotValidationResult => {
  const spec = COLOR_SLOT_SPECS[slotName];

  if (!spec) {
    return {
      slot: slotName,
      inputColor: color || '',
      outputColor: color || '',
      isValid: false,
      wasCorrected: false,
      luminance: 0,
      requiredRange: { min: 0, max: 1 },
      message: `Unknown color slot: ${slotName}`
    };
  }

  // Use default if no color provided
  const inputColor = color || spec.defaultColor;
  const correction = correctColorForSlot(inputColor, spec);

  return {
    slot: slotName,
    inputColor,
    outputColor: correction.correctedColor,
    isValid: !correction.wasCorrected,
    wasCorrected: correction.wasCorrected,
    luminance: correction.correctedLuminance,
    requiredRange: { min: spec.minLuminance, max: spec.maxLuminance },
    message: correction.reason
  };
};

/**
 * Color input map for theme validation
 */
export interface ThemeColorInputs {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  text?: string | null;
  'bg-1'?: string | null;
  'bg-2'?: string | null;
  'topbar-light'?: string | null;
  'topbar-dark'?: string | null;
}

/**
 * Validated and corrected color outputs
 */
export interface ValidatedThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  'bg-1': string;
  'bg-2': string;
  'topbar-light': string;
  'topbar-dark': string;
}

/**
 * Validate and correct all theme colors
 */
export const validateThemeColors = (
  inputs: ThemeColorInputs
): { colors: ValidatedThemeColors; validation: ThemeValidationResult } => {
  const slotNames = Object.keys(COLOR_SLOT_SPECS);
  const corrections: SlotValidationResult[] = [];
  const warnings: string[] = [];
  const colors: Record<string, string> = {};

  for (const slotName of slotNames) {
    const inputKey = slotName as keyof ThemeColorInputs;
    const result = validateColorSlot(inputs[inputKey], slotName);
    corrections.push(result);
    colors[slotName] = result.outputColor;

    if (result.wasCorrected && result.message) {
      warnings.push(`[${slotName}] ${result.message} - Auto-corrected from ${result.inputColor} to ${result.outputColor}`);
    }
  }

  const isValid = corrections.every(c => c.isValid);

  return {
    colors: colors as ValidatedThemeColors,
    validation: {
      isValid,
      corrections,
      warnings,
      errors: []
    }
  };
};

/**
 * Find prominent brand colors from raw data that aren't already in the theme
 */
const findMissingProminentColors = (
  raw: ExtendedDesignSystem['raw'],
  usedColors: string[]
): string[] => {
  if (!raw?.brand_colors?.length) return [];

  const usedColorsLower = usedColors.filter(c => c).map(c => c.toLowerCase());
  const prominent: string[] = [];

  // Look for vibrant colors in top brand colors that aren't used
  for (const colorData of raw.brand_colors.slice(0, 30)) {
    const color = colorData.color?.toLowerCase();
    if (!color) continue;

    // Skip if already used (exact match)
    if (usedColorsLower.includes(color)) continue;

    // Skip if it's visually similar to any used color (using proper color distance)
    const isSimilarToUsed = usedColorsLower.some(used => areColorsSimilar(color, used));
    if (isSimilarToUsed) continue;

    // Skip if it's similar to any prominent color we've already found
    const isSimilarToProminent = prominent.some(p => areColorsSimilar(color, p));
    if (isSimilarToProminent) continue;

    // Check if it's a vibrant color worth including
    if (isVibrantColor(color)) {
      prominent.push(color);
    }
  }

  return prominent;
};

/**
 * Build a complete theme.json from design system data
 */
export const buildThemeFromDesignSystem = (designSystem: ExtendedDesignSystem): ThemeJson => {
  const colors = designSystem.colors || {};
  const raw = designSystem.raw;

  const logoUrl = designSystem.images?.logo || null;
  // Use backend-generated logo_config if available, otherwise use client-side detection
  const logoConfig = designSystem.logo_config || determineLogoConfig(logoUrl);

  // Get the semantic colors from design system (correct mappings)
  // Use ensureValidHex to prevent NaN issues from invalid color values
  const primaryColor = ensureValidHex(colors.primary, '#1c79a0');
  const secondaryColor = ensureValidHex(colors.secondary, '#13526e');
  const accentColor = ensureValidHex(colors.accent, '#ed6a40');
  const textColor = ensureValidHex(colors.text || colors.text_primary, '#272727');
  const bg1Color = ensureValidHex(colors.bg_1 || colors.background, '#ffffff');
  const bg2Color = ensureValidHex(colors.bg_2, '#f5f5f5');
  const topbarLightColor = ensureValidHex(colors.topbar_light, '#f2f2f2');

  // Initial colors to check for missing prominent ones
  const initialColors = [primaryColor, secondaryColor, accentColor];

  // Find prominent colors from raw.brand_colors that aren't in the theme
  const missingProminent = findMissingProminentColors(raw, initialColors);

  // --- STEP 1: Ensure secondary is different from primary ---
  let finalSecondary = secondaryColor;
  if (areColorsSimilar(secondaryColor, primaryColor)) {
    // Secondary is too similar to primary, find a different color
    if (missingProminent.length > 0) {
      finalSecondary = missingProminent[0];
      console.log(`Secondary was similar to primary, replaced with: ${finalSecondary}`);
    } else {
      // No prominent colors available, use a default contrasting color
      finalSecondary = '#13526e';
      console.log(`Secondary was similar to primary, using default: ${finalSecondary}`);
    }
  }

  // --- STEP 2: Ensure accent is different from primary AND secondary ---
  let finalAccent = accentColor;
  if (areColorsSimilar(accentColor, primaryColor) || areColorsSimilar(accentColor, finalSecondary)) {
    // Accent is too similar to primary or secondary, find a different color
    const availableProminent = missingProminent.filter(
      c => !areColorsSimilar(c, primaryColor) && !areColorsSimilar(c, finalSecondary)
    );
    if (availableProminent.length > 0) {
      finalAccent = availableProminent[0];
      console.log(`Accent was similar to primary/secondary, replaced with: ${finalAccent}`);
    } else if (!areColorsSimilar(finalSecondary, primaryColor)) {
      // Use secondary as accent if it's different from primary
      finalAccent = finalSecondary;
      console.log(`Accent was similar, using secondary as accent: ${finalAccent}`);
    } else {
      // Fallback to a default accent
      finalAccent = '#ed6a40';
      console.log(`Accent was similar, using default: ${finalAccent}`);
    }
  }

  // --- STEP 3: Ensure topbar-dark is actually DARK ---
  let finalTopbarDark = ensureValidHex(colors.topbar_dark, primaryColor);
  if (!isDarkColor(finalTopbarDark)) {
    // topbar-dark is not dark enough, find or create a dark color
    // Priority: 1) secondary if dark, 2) darken primary, 3) find dark from brand colors
    if (isDarkColor(finalSecondary)) {
      finalTopbarDark = finalSecondary;
      console.log(`topbar-dark was not dark, using secondary: ${finalTopbarDark}`);
    } else {
      // Darken the primary color
      finalTopbarDark = darkenColor(primaryColor, 0.5);
      console.log(`topbar-dark was not dark, darkened primary to: ${finalTopbarDark}`);
    }
  }

  // --- STEP 4: Validate ALL colors meet luminance requirements ---
  // This guarantees dark slots are dark, light slots are light
  const { colors: validatedColors, validation } = validateThemeColors({
    primary: primaryColor,
    secondary: finalSecondary,
    accent: finalAccent,
    text: textColor,
    'bg-1': bg1Color,
    'bg-2': bg2Color,
    'topbar-light': topbarLightColor,
    'topbar-dark': finalTopbarDark
  });

  // Log any corrections made
  if (validation.warnings.length > 0) {
    console.group('Theme Color Luminance Corrections');
    validation.warnings.forEach(warning => {
      console.warn(warning);
    });
    console.groupEnd();
  }

  // Build theme.json structure with validated colors
  const themeJson: ThemeJson = {
    default: {
      colors: [
        buildColorEntry('primary', validatedColors.primary),
        buildColorEntry('secondary', validatedColors.secondary),
        buildColorEntry('accent', validatedColors.accent),
        buildColorEntry('text', validatedColors.text),
        buildColorEntry('bg-1', validatedColors['bg-1']),
        buildColorEntry('bg-2', validatedColors['bg-2']),
        buildColorEntry('topbar-light', validatedColors['topbar-light']),
        buildColorEntry('topbar-dark', validatedColors['topbar-dark']),
      ],
      typography: [
        { label: 'font', font: formatFontStack(designSystem.typography?.font_families?.primary, 'body') },
        { label: 'font-title', font: formatFontStack(designSystem.typography?.font_families?.heading || designSystem.typography?.font_families?.primary, 'heading') },
      ],
      logo_url: logoUrl,
      logo_config: logoConfig,
      logo_colors: designSystem.logo_colors || null,
      favicon_url: designSystem.images?.favicon || null,
    }
  };

  return themeJson;
};

/**
 * Merge backend theme response with design system data
 * Ensures logo and favicon data is always present in the theme
 */
export const mergeThemeWithDesignSystem = (
  backendTheme: Record<string, unknown>,
  designSystem: ExtendedDesignSystem
): Record<string, unknown> => {
  const themeDefault = (backendTheme.default as Record<string, unknown>) || {};

  // Get logo data from design system
  const logoUrl = designSystem.images?.logo || null;
  const logoConfig = designSystem.logo_config || determineLogoConfig(logoUrl);
  const faviconUrl = designSystem.images?.favicon || null;

  // Merge logo data if not present in backend response
  if (!themeDefault.logo_url && logoUrl) {
    themeDefault.logo_url = logoUrl;
  }
  if (!themeDefault.logo_config && logoConfig) {
    themeDefault.logo_config = logoConfig;
  }
  if (!themeDefault.logo_colors && designSystem.logo_colors) {
    themeDefault.logo_colors = designSystem.logo_colors;
  }
  if (!themeDefault.favicon_url && faviconUrl) {
    themeDefault.favicon_url = faviconUrl;
  }

  return {
    ...backendTheme,
    default: themeDefault
  };
};
