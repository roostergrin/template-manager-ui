import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Palette,
  Type,
  Box,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Download
} from 'lucide-react';
import './DesignSystemViewer.sass';

// Design System types matching the backend Pydantic models
interface ButtonStyle {
  background?: string | null;
  text?: string | null;
  border?: string | null;
  border_radius?: string | null;
  hover_background?: string | null;
  hover_text?: string | null;
}

interface DesignSystemImages {
  logo?: string | null;
  favicon?: string | null;
}

interface DesignSystemComponents {
  buttons?: {
    primary?: ButtonStyle;
    secondary?: ButtonStyle;
  } | null;
}

interface DesignSystemColors {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  text?: string | null;
  bg_1?: string | null;
  bg_2?: string | null;
  topbar_light?: string | null;
  topbar_dark?: string | null;
}

interface FontWithCount {
  family: string;
  count: number;
}

interface FontStacks {
  body?: string[] | null;
  heading?: string[] | null;
  paragraph?: string[] | null;
}

interface FontFamilies {
  primary?: string | null;
  heading?: string | null;
}

interface DesignSystemTypography {
  primary?: string | null;
  heading?: string | null;
  h1?: string | null;
  h2?: string | null;
  h3?: string | null;
  h4?: string | null;
  h5?: string | null;
  h6?: string | null;
  body?: string | null;
  small?: string | null;
  font_families?: FontFamilies | null;
  font_stacks?: FontStacks | null;
}

interface DesignSystemSpacing {
  base_unit?: string | null;
  border_radius?: string | null;
}

interface RawColorData {
  color: string;
  count: number;
}

interface RawExtractedData {
  all_colors?: RawColorData[];
  brand_colors?: RawColorData[];  // Filtered on-brand colors
  all_fonts?: FontWithCount[];
  button_styles?: Record<string, unknown>;
  typography_sizes?: Record<string, unknown>;
  spacing_values?: Record<string, unknown>;
  logo_urls?: string[];
}

// Logo color analysis types
interface LogoColorEntry {
  hex: string;
  luminosity_percent: number;
  count: number;
}

interface LogoColors {
  colors: LogoColorEntry[];
  dominant_color: string;
  avg_luminosity: number;
  is_light: boolean;
}

interface LogoConfig {
  type: 'svg' | 'url';
  variant: 'dark' | 'light';
  url: string | null;
}

export interface DesignSystem {
  images?: DesignSystemImages;
  components?: DesignSystemComponents;
  colors?: DesignSystemColors;
  fonts?: FontWithCount[];
  typography?: DesignSystemTypography;
  spacing?: DesignSystemSpacing;
  raw?: RawExtractedData | null;
  // Logo analysis (from backend /generate-theme/ endpoint)
  logo_colors?: LogoColors | null;
  logo_config?: LogoConfig | null;
}

interface DesignSystemViewerProps {
  designSystem: DesignSystem;
}

const DesignSystemViewer: React.FC<DesignSystemViewerProps> = ({ designSystem }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Helper to convert hex to RGBA format for theme.json
  const hexToRgba = (hex: string): { red: number; green: number; blue: number; alpha: number } => {
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

  // Calculate relative luminance (WCAG formula)
  const getLuminance = (hex: string): number => {
    const rgba = hexToRgba(hex);
    const adjust = (c: number) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * adjust(rgba.red) + 0.7152 * adjust(rgba.green) + 0.0722 * adjust(rgba.blue);
  };

  // Calculate contrast ratio between two colors
  const getContrastRatio = (hex1: string, hex2: string): number => {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Get accessible text color (white or black) for a background
  const getAccessibleTextColor = (bgHex: string): { color: string; contrast: number } => {
    const whiteContrast = getContrastRatio(bgHex, '#ffffff');
    const blackContrast = getContrastRatio(bgHex, '#000000');
    return whiteContrast > blackContrast
      ? { color: '#ffffff', contrast: whiteContrast }
      : { color: '#000000', contrast: blackContrast };
  };

  // Get WCAG rating based on contrast ratio
  const getWcagRating = (contrast: number): { rating: string; class: string } => {
    if (contrast >= 7) return { rating: 'AAA', class: 'wcag-aaa' };
    if (contrast >= 4.5) return { rating: 'AA', class: 'wcag-aa' };
    if (contrast >= 3) return { rating: 'AA Large', class: 'wcag-aa-large' };
    return { rating: 'Fail', class: 'wcag-fail' };
  };

  // Format font stack for theme.json
  const formatFontStack = (fontFamily: string | null | undefined, type: 'body' | 'heading'): string => {
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

  // Determine logo config based on URL (basic client-side detection)
  // Full color analysis is done on the backend via /generate-theme/ endpoint
  const determineLogoConfig = (logoUrl: string | null | undefined) => {
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

  const handleDownloadTheme = () => {
    const colors = designSystem.colors || {};

    // Helper to build color entry with accessibility info
    const buildColorEntry = (label: string, hex: string) => {
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

    const logoUrl = designSystem.images?.logo || null;
    // Use backend-generated logo_config if available, otherwise use client-side detection
    const logoConfig = designSystem.logo_config || determineLogoConfig(logoUrl);

    // Build theme.json structure
    const themeJson = {
      default: {
        colors: [
          buildColorEntry('primary', colors.primary || '#1c79a0'),
          buildColorEntry('secondary', colors.secondary || '#13526e'),
          buildColorEntry('accent', colors.accent || '#ed6a40'),
          buildColorEntry('text', colors.text || '#272727'),
          buildColorEntry('bg-1', colors.bg_1 || '#ffffff'),
          buildColorEntry('bg-2', colors.bg_2 || '#f5f5f5'),
          buildColorEntry('topbar-light', colors.topbar_light || '#f2f2f2'),
          buildColorEntry('topbar-dark', colors.topbar_dark || '#1c79a0'),
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

    const blob = new Blob([JSON.stringify(themeJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const isValidColor = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#[0-9A-Fa-f]{3,8}$/;
    const rgbRegex = /^rgba?\([^)]+\)$/;
    return hexRegex.test(color) || rgbRegex.test(color);
  };

  const getBorderRadius = (radius: string | null | undefined): string => {
    if (!radius) return '4px';
    return radius;
  };

  const hasImages = designSystem.images?.logo || designSystem.images?.favicon;
  const hasColors = designSystem.colors && Object.values(designSystem.colors).some(v => v);
  const hasTypography = designSystem.typography && Object.entries(designSystem.typography).some(
    ([key, v]) => v && typeof v !== 'object'
  );
  const hasFonts = designSystem.fonts && Array.isArray(designSystem.fonts) && designSystem.fonts.length > 0;
  const hasSpacing = designSystem.spacing && Object.values(designSystem.spacing).some(v => v);
  const hasButtons = designSystem.components?.buttons &&
    (designSystem.components.buttons.primary || designSystem.components.buttons.secondary);
  const hasRaw = designSystem.raw && (
    (designSystem.raw.all_colors && designSystem.raw.all_colors.length > 0) ||
    (designSystem.raw.all_fonts && designSystem.raw.all_fonts.length > 0) ||
    (designSystem.raw.logo_urls && designSystem.raw.logo_urls.length > 0)
  );
  const hasLogoAnalysis = designSystem.logo_colors || designSystem.logo_config;

  if (!hasImages && !hasColors && !hasTypography && !hasFonts && !hasSpacing && !hasButtons) {
    return (
      <div className="design-system-viewer design-system-viewer--empty">
        <p>No design system data extracted</p>
      </div>
    );
  }

  return (
    <div className="design-system-viewer">
      {/* Download Theme Button */}
      {hasColors && (
        <div className="design-system-viewer__actions">
          <button
            className="design-system-viewer__download-btn"
            onClick={handleDownloadTheme}
          >
            <Download size={16} />
            Download theme.json
          </button>
        </div>
      )}

      {/* Images Section */}
      {hasImages && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <ImageIcon size={16} />
            <h4 className="design-system-viewer__section-title">Images</h4>
          </div>
          <div className="design-system-viewer__grid">
            {designSystem.images?.logo && (
              <div className="design-system-viewer__item">
                <span className="design-system-viewer__label">Logo</span>
                <div className="design-system-viewer__image-container">
                  <img
                    src={designSystem.images.logo}
                    alt="Logo"
                    className="design-system-viewer__image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="design-system-viewer__image-actions">
                    <button
                      className="design-system-viewer__action-btn"
                      onClick={() => handleCopy(designSystem.images!.logo!, 'logo')}
                      title="Copy URL"
                    >
                      {copiedItem === 'logo' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <a
                      href={designSystem.images.logo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="design-system-viewer__action-btn"
                      title="Open in new tab"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
            {designSystem.images?.favicon && (
              <div className="design-system-viewer__item">
                <span className="design-system-viewer__label">Favicon</span>
                <div className="design-system-viewer__image-container design-system-viewer__image-container--favicon">
                  <img
                    src={designSystem.images.favicon}
                    alt="Favicon"
                    className="design-system-viewer__image design-system-viewer__image--favicon"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    className="design-system-viewer__action-btn"
                    onClick={() => handleCopy(designSystem.images!.favicon!, 'favicon')}
                    title="Copy URL"
                  >
                    {copiedItem === 'favicon' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logo Analysis Section */}
      {hasLogoAnalysis && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <ImageIcon size={16} />
            <h4 className="design-system-viewer__section-title">Logo Analysis</h4>
            {designSystem.logo_config && (
              <span className={`design-system-viewer__badge design-system-viewer__badge--${designSystem.logo_config.variant}`}>
                {designSystem.logo_config.variant} variant
              </span>
            )}
          </div>

          {/* Logo Config Summary */}
          {designSystem.logo_config && (
            <div className="design-system-viewer__logo-config">
              <div className="design-system-viewer__logo-config-grid">
                <div className="design-system-viewer__logo-config-item">
                  <span className="design-system-viewer__label">Type</span>
                  <code className="design-system-viewer__value">{designSystem.logo_config.type}</code>
                </div>
                <div className="design-system-viewer__logo-config-item">
                  <span className="design-system-viewer__label">Variant</span>
                  <code className="design-system-viewer__value">{designSystem.logo_config.variant}</code>
                </div>
                <div className="design-system-viewer__logo-config-item">
                  <span className="design-system-viewer__label">Background Needed</span>
                  <code className="design-system-viewer__value">
                    {designSystem.logo_config.variant === 'dark' ? 'Dark background' : 'Light background'}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Logo Colors Analysis */}
          {designSystem.logo_colors && (
            <div className="design-system-viewer__logo-colors">
              <div className="design-system-viewer__logo-colors-summary">
                <div className="design-system-viewer__logo-colors-stat">
                  <span className="design-system-viewer__label">Dominant Color</span>
                  <div className="design-system-viewer__logo-dominant">
                    <div
                      className="design-system-viewer__color-swatch design-system-viewer__color-swatch--small"
                      style={{ backgroundColor: designSystem.logo_colors.dominant_color }}
                    />
                    <code>{designSystem.logo_colors.dominant_color}</code>
                    <button
                      className="design-system-viewer__copy-btn"
                      onClick={() => handleCopy(designSystem.logo_colors!.dominant_color, 'dominant-color')}
                      title="Copy color"
                    >
                      {copiedItem === 'dominant-color' ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  </div>
                </div>
                <div className="design-system-viewer__logo-colors-stat">
                  <span className="design-system-viewer__label">Avg Luminosity</span>
                  <div className="design-system-viewer__luminosity-bar">
                    <div
                      className="design-system-viewer__luminosity-fill"
                      style={{ width: `${designSystem.logo_colors.avg_luminosity}%` }}
                    />
                    <span className="design-system-viewer__luminosity-value">
                      {designSystem.logo_colors.avg_luminosity.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="design-system-viewer__logo-colors-stat">
                  <span className="design-system-viewer__label">Classification</span>
                  <span className={`design-system-viewer__classification design-system-viewer__classification--${designSystem.logo_colors.is_light ? 'light' : 'dark'}`}>
                    {designSystem.logo_colors.is_light ? 'Light/Bright Logo' : 'Dark Logo'}
                  </span>
                </div>
              </div>

              {/* Color Palette */}
              <div className="design-system-viewer__logo-palette">
                <span className="design-system-viewer__label">Extracted Colors</span>
                <div className="design-system-viewer__logo-colors-grid">
                  {designSystem.logo_colors.colors.slice(0, 8).map((color, index) => (
                    <div key={index} className="design-system-viewer__logo-color-item">
                      <div
                        className="design-system-viewer__color-swatch design-system-viewer__color-swatch--small"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.hex} - L: ${color.luminosity_percent}%`}
                      />
                      <div className="design-system-viewer__logo-color-info">
                        <code>{color.hex}</code>
                        <span className="design-system-viewer__logo-color-meta">
                          L: {color.luminosity_percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {hasColors && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <Palette size={16} />
            <h4 className="design-system-viewer__section-title">Theme Colors</h4>
          </div>
          <div className="design-system-viewer__colors-grid">
            {Object.entries(designSystem.colors || {}).map(([key, value]) => {
              if (!value || !isValidColor(value)) return null;
              const label = key.replace(/_/g, '-');
              const colorId = `color-${key}`;
              const luminance = getLuminance(value);
              const accessibleText = getAccessibleTextColor(value);
              const wcag = getWcagRating(accessibleText.contrast);

              return (
                <div key={key} className="design-system-viewer__color-item">
                  <div
                    className="design-system-viewer__color-swatch"
                    style={{ backgroundColor: value }}
                  >
                    <span
                      className="design-system-viewer__swatch-text"
                      style={{ color: accessibleText.color }}
                    >
                      Aa
                    </span>
                  </div>
                  <div className="design-system-viewer__color-info">
                    <span className="design-system-viewer__color-label">{label}</span>
                    <code className="design-system-viewer__color-value">{value}</code>
                    <div className="design-system-viewer__color-meta">
                      <span className="design-system-viewer__luminance">
                        L: {(luminance * 100).toFixed(0)}%
                      </span>
                      <span className={`design-system-viewer__wcag ${wcag.class}`}>
                        {wcag.rating}
                      </span>
                      <span
                        className="design-system-viewer__text-color"
                        style={{ backgroundColor: accessibleText.color }}
                        title={`Use ${accessibleText.color === '#ffffff' ? 'white' : 'black'} text (${accessibleText.contrast.toFixed(1)}:1)`}
                      />
                    </div>
                  </div>
                  <button
                    className="design-system-viewer__copy-btn"
                    onClick={() => handleCopy(value, colorId)}
                    title="Copy color"
                  >
                    {copiedItem === colorId ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fonts Section */}
      {hasFonts && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <Type size={16} />
            <h4 className="design-system-viewer__section-title">Fonts</h4>
            <span className="design-system-viewer__badge">{designSystem.fonts?.length || 0} fonts</span>
          </div>
          <div className="design-system-viewer__list">
            {(designSystem.fonts || []).slice(0, 8).map((font, index) => (
              <div key={index} className="design-system-viewer__list-item">
                <span
                  className="design-system-viewer__list-value"
                  style={{ fontFamily: font.family }}
                >
                  {font.family}
                </span>
                <span className="design-system-viewer__list-label">
                  {font.count}×
                </span>
              </div>
            ))}
          </div>
          {/* Font Stacks if available */}
          {designSystem.typography?.font_stacks && (
            <div className="design-system-viewer__font-stacks">
              {designSystem.typography.font_stacks.body && designSystem.typography.font_stacks.body.length > 0 && (
                <div className="design-system-viewer__font-stack">
                  <span className="design-system-viewer__font-stack-label">Body:</span>
                  <code className="design-system-viewer__font-stack-value">
                    {designSystem.typography.font_stacks.body.join(', ')}
                  </code>
                </div>
              )}
              {designSystem.typography.font_stacks.heading && designSystem.typography.font_stacks.heading.length > 0 && (
                <div className="design-system-viewer__font-stack">
                  <span className="design-system-viewer__font-stack-label">Heading:</span>
                  <code className="design-system-viewer__font-stack-value">
                    {designSystem.typography.font_stacks.heading.join(', ')}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Typography Section */}
      {hasTypography && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <Type size={16} />
            <h4 className="design-system-viewer__section-title">Typography</h4>
          </div>
          <div className="design-system-viewer__list">
            {Object.entries(designSystem.typography || {}).map(([key, value]) => {
              // Skip null values and nested objects (font_families, font_stacks)
              if (!value || typeof value === 'object') return null;
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

              return (
                <div key={key} className="design-system-viewer__list-item">
                  <span className="design-system-viewer__list-label">{label}</span>
                  <span className="design-system-viewer__list-value">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacing Section */}
      {hasSpacing && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <Box size={16} />
            <h4 className="design-system-viewer__section-title">Spacing</h4>
          </div>
          <div className="design-system-viewer__list">
            {designSystem.spacing?.base_unit && (
              <div className="design-system-viewer__list-item">
                <span className="design-system-viewer__list-label">Base Unit</span>
                <span className="design-system-viewer__list-value">{designSystem.spacing.base_unit}</span>
              </div>
            )}
            {designSystem.spacing?.border_radius && (
              <div className="design-system-viewer__list-item">
                <span className="design-system-viewer__list-label">Border Radius</span>
                <span className="design-system-viewer__list-value">{designSystem.spacing.border_radius}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Components/Buttons Section */}
      {hasButtons && (
        <div className="design-system-viewer__section">
          <div className="design-system-viewer__section-header">
            <Layers size={16} />
            <h4 className="design-system-viewer__section-title">Components</h4>
          </div>
          <div className="design-system-viewer__subsection">
            <h5 className="design-system-viewer__subsection-title">Buttons</h5>
            <div className="design-system-viewer__buttons-grid">
              {designSystem.components?.buttons?.primary && (
                <div className="design-system-viewer__button-item">
                  <span className="design-system-viewer__button-label">Primary</span>
                  <div
                    className="design-system-viewer__button-preview"
                    style={{
                      backgroundColor: designSystem.components.buttons.primary.background || '#1a73e8',
                      color: designSystem.components.buttons.primary.text || '#fff',
                      borderRadius: getBorderRadius(designSystem.components.buttons.primary.border_radius),
                    }}
                  >
                    Button
                  </div>
                  <div className="design-system-viewer__button-details">
                    {designSystem.components.buttons.primary.background && (
                      <div className="design-system-viewer__button-detail">
                        <span>BG:</span>
                        <code>{designSystem.components.buttons.primary.background}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.primary.text && (
                      <div className="design-system-viewer__button-detail">
                        <span>Text:</span>
                        <code>{designSystem.components.buttons.primary.text}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.primary.border_radius && (
                      <div className="design-system-viewer__button-detail">
                        <span>Radius:</span>
                        <code>{designSystem.components.buttons.primary.border_radius}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.primary.hover_background && (
                      <div className="design-system-viewer__button-detail design-system-viewer__button-detail--hover">
                        <span>Hover BG:</span>
                        <code>{designSystem.components.buttons.primary.hover_background}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.primary.hover_text && (
                      <div className="design-system-viewer__button-detail design-system-viewer__button-detail--hover">
                        <span>Hover Text:</span>
                        <code>{designSystem.components.buttons.primary.hover_text}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {designSystem.components?.buttons?.secondary && (
                <div className="design-system-viewer__button-item">
                  <span className="design-system-viewer__button-label">Secondary</span>
                  <div
                    className="design-system-viewer__button-preview design-system-viewer__button-preview--secondary"
                    style={{
                      backgroundColor: designSystem.components.buttons.secondary.background || '#fff',
                      color: designSystem.components.buttons.secondary.text || '#1a73e8',
                      borderRadius: getBorderRadius(designSystem.components.buttons.secondary.border_radius),
                      border: `1px solid ${designSystem.components.buttons.secondary.text || '#1a73e8'}`,
                    }}
                  >
                    Button
                  </div>
                  <div className="design-system-viewer__button-details">
                    {designSystem.components.buttons.secondary.background && (
                      <div className="design-system-viewer__button-detail">
                        <span>BG:</span>
                        <code>{designSystem.components.buttons.secondary.background}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.secondary.text && (
                      <div className="design-system-viewer__button-detail">
                        <span>Text:</span>
                        <code>{designSystem.components.buttons.secondary.text}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.secondary.border_radius && (
                      <div className="design-system-viewer__button-detail">
                        <span>Radius:</span>
                        <code>{designSystem.components.buttons.secondary.border_radius}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.secondary.hover_background && (
                      <div className="design-system-viewer__button-detail design-system-viewer__button-detail--hover">
                        <span>Hover BG:</span>
                        <code>{designSystem.components.buttons.secondary.hover_background}</code>
                      </div>
                    )}
                    {designSystem.components.buttons.secondary.hover_text && (
                      <div className="design-system-viewer__button-detail design-system-viewer__button-detail--hover">
                        <span>Hover Text:</span>
                        <code>{designSystem.components.buttons.secondary.hover_text}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw Extracted Data Section */}
      {hasRaw && (
        <details className="design-system-viewer__raw-section">
          <summary className="design-system-viewer__raw-header">
            <Box size={16} />
            <span>Raw Extracted Data</span>
          </summary>
          <div className="design-system-viewer__raw-content">
            {/* All Logo URLs */}
            {designSystem.raw?.logo_urls && designSystem.raw.logo_urls.length > 0 && (
              <div className="design-system-viewer__raw-group">
                <h5 className="design-system-viewer__raw-group-title">
                  Logo URLs ({designSystem.raw.logo_urls.length})
                </h5>
                <div className="design-system-viewer__raw-list">
                  {designSystem.raw.logo_urls.map((url, index) => (
                    <div key={index} className="design-system-viewer__raw-item">
                      <img
                        src={url}
                        alt={`Logo ${index + 1}`}
                        className="design-system-viewer__raw-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <code className="design-system-viewer__raw-url">
                        {url.length > 60 ? url.substring(0, 60) + '...' : url}
                      </code>
                      <button
                        className="design-system-viewer__copy-btn"
                        onClick={() => handleCopy(url, `logo-raw-${index}`)}
                        title="Copy URL"
                      >
                        {copiedItem === `logo-raw-${index}` ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Colors */}
            {designSystem.raw?.all_colors && designSystem.raw.all_colors.length > 0 && (
              <div className="design-system-viewer__raw-group">
                <h5 className="design-system-viewer__raw-group-title">
                  All Colors ({designSystem.raw.all_colors.length})
                </h5>
                <div className="design-system-viewer__raw-colors">
                  {designSystem.raw.all_colors.map((colorData, index) => (
                    <div key={index} className="design-system-viewer__raw-color">
                      <div
                        className="design-system-viewer__raw-swatch"
                        style={{
                          backgroundColor: isValidColor(colorData.color) ? colorData.color : '#ccc'
                        }}
                      />
                      <code>{colorData.color}</code>
                      <span className="design-system-viewer__raw-count">{colorData.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Fonts */}
            {designSystem.raw?.all_fonts && designSystem.raw.all_fonts.length > 0 && (
              <div className="design-system-viewer__raw-group">
                <h5 className="design-system-viewer__raw-group-title">
                  All Fonts ({designSystem.raw.all_fonts.length})
                </h5>
                <div className="design-system-viewer__raw-fonts">
                  {designSystem.raw.all_fonts.map((font, index) => (
                    <div key={index} className="design-system-viewer__raw-font">
                      <span style={{ fontFamily: font.family }}>{font.family}</span>
                      <span className="design-system-viewer__raw-count">{font.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default DesignSystemViewer;
