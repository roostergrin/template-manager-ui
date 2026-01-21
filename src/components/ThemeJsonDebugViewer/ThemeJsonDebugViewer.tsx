import React, { useState, useMemo } from 'react';
import {
  Download,
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  Image as ImageIcon,
  Copy,
  Check,
  Eye,
  Code
} from 'lucide-react';
import { DesignSystem } from '../DesignSystemViewer';
import {
  buildThemeFromDesignSystem,
  ThemeJson
} from '../../utils/themeBuilder';
import './ThemeJsonDebugViewer.sass';

interface ThemeJsonDebugViewerProps {
  designSystem: DesignSystem;
}

const ThemeJsonDebugViewer: React.FC<ThemeJsonDebugViewerProps> = ({ designSystem }) => {
  const [showColors, setShowColors] = useState(false);
  const [showTypography, setShowTypography] = useState(false);
  const [showLogos, setShowLogos] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Build the theme.json from design system using the shared utility
  const themeJson = useMemo((): ThemeJson => {
    return buildThemeFromDesignSystem(designSystem as any);
  }, [designSystem]);

  const handleDownloadTheme = () => {
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

  const handleCopyFullJson = () => {
    const jsonString = JSON.stringify(themeJson, null, 2);
    handleCopy(jsonString, 'full-json');
  };

  return (
    <div className="theme-json-debug-viewer">
      {/* Header with Download Button */}
      <div className="theme-json-debug-viewer__header">
        <div className="theme-json-debug-viewer__title">
          <Code size={20} />
          <h3>Theme Configuration</h3>
        </div>
        <div className="theme-json-debug-viewer__actions">
          <button
            className="theme-json-debug-viewer__btn theme-json-debug-viewer__btn--secondary"
            onClick={handleCopyFullJson}
            title="Copy theme.json to clipboard"
          >
            {copiedItem === 'full-json' ? <Check size={16} /> : <Copy size={16} />}
            {copiedItem === 'full-json' ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            className="theme-json-debug-viewer__btn theme-json-debug-viewer__btn--primary"
            onClick={handleDownloadTheme}
          >
            <Download size={16} />
            Download theme.json
          </button>
        </div>
      </div>

      {/* Colors Section */}
      <div className="theme-json-debug-viewer__section">
        <div
          className="theme-json-debug-viewer__section-header"
          onClick={() => setShowColors(!showColors)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowColors(!showColors)}
          aria-expanded={showColors}
        >
          {showColors ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Palette size={16} />
          <span>Colors</span>
          <span className="theme-json-debug-viewer__badge">{themeJson.default.colors.length}</span>
        </div>
        {showColors && (
          <div className="theme-json-debug-viewer__section-content">
            <div className="theme-json-debug-viewer__colors-grid">
              {themeJson.default.colors.map((colorEntry, index) => (
                <div key={index} className="theme-json-debug-viewer__color-item">
                  <div
                    className="theme-json-debug-viewer__color-swatch"
                    style={{ backgroundColor: colorEntry.hex }}
                  >
                    <span
                      className="theme-json-debug-viewer__swatch-text"
                      style={{ color: colorEntry.accessibility.recommendedTextColor }}
                    >
                      Aa
                    </span>
                  </div>
                  <div className="theme-json-debug-viewer__color-info">
                    <span className="theme-json-debug-viewer__color-label">{colorEntry.label}</span>
                    <code className="theme-json-debug-viewer__color-hex">{colorEntry.hex}</code>
                    <div className="theme-json-debug-viewer__color-meta">
                      <span className={`theme-json-debug-viewer__wcag theme-json-debug-viewer__wcag--${colorEntry.accessibility.wcagRating.toLowerCase().replace(' ', '-')}`}>
                        {colorEntry.accessibility.wcagRating}
                      </span>
                      <span className="theme-json-debug-viewer__contrast">
                        {colorEntry.accessibility.contrastRatio}:1
                      </span>
                    </div>
                  </div>
                  <button
                    className="theme-json-debug-viewer__copy-btn"
                    onClick={() => handleCopy(colorEntry.hex, `color-${index}`)}
                    title="Copy hex color"
                  >
                    {copiedItem === `color-${index}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="theme-json-debug-viewer__section">
        <div
          className="theme-json-debug-viewer__section-header"
          onClick={() => setShowTypography(!showTypography)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowTypography(!showTypography)}
          aria-expanded={showTypography}
        >
          {showTypography ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Type size={16} />
          <span>Typography</span>
          <span className="theme-json-debug-viewer__badge">{themeJson.default.typography.length}</span>
        </div>
        {showTypography && (
          <div className="theme-json-debug-viewer__section-content">
            <div className="theme-json-debug-viewer__typography-list">
              {themeJson.default.typography.map((typo, index) => (
                <div key={index} className="theme-json-debug-viewer__typography-item">
                  <span className="theme-json-debug-viewer__typography-label">{typo.label}</span>
                  <code className="theme-json-debug-viewer__typography-value">{typo.font}</code>
                  <button
                    className="theme-json-debug-viewer__copy-btn"
                    onClick={() => handleCopy(typo.font, `typo-${index}`)}
                    title="Copy font stack"
                  >
                    {copiedItem === `typo-${index}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logos & Images Section */}
      <div className="theme-json-debug-viewer__section">
        <div
          className="theme-json-debug-viewer__section-header"
          onClick={() => setShowLogos(!showLogos)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowLogos(!showLogos)}
          aria-expanded={showLogos}
        >
          {showLogos ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <ImageIcon size={16} />
          <span>Logos & Images</span>
        </div>
        {showLogos && (
          <div className="theme-json-debug-viewer__section-content">
            <div className="theme-json-debug-viewer__images-grid">
              {themeJson.default.logo_url && (
                <div className="theme-json-debug-viewer__image-item">
                  <span className="theme-json-debug-viewer__image-label">Logo URL</span>
                  <div className="theme-json-debug-viewer__image-preview">
                    <img
                      src={themeJson.default.logo_url}
                      alt="Logo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <code className="theme-json-debug-viewer__image-url">
                    {themeJson.default.logo_url.length > 50
                      ? themeJson.default.logo_url.substring(0, 50) + '...'
                      : themeJson.default.logo_url}
                  </code>
                </div>
              )}
              {themeJson.default.favicon_url && (
                <div className="theme-json-debug-viewer__image-item">
                  <span className="theme-json-debug-viewer__image-label">Favicon URL</span>
                  <div className="theme-json-debug-viewer__image-preview theme-json-debug-viewer__image-preview--favicon">
                    <img
                      src={themeJson.default.favicon_url}
                      alt="Favicon"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <code className="theme-json-debug-viewer__image-url">
                    {themeJson.default.favicon_url.length > 50
                      ? themeJson.default.favicon_url.substring(0, 50) + '...'
                      : themeJson.default.favicon_url}
                  </code>
                </div>
              )}
              {themeJson.default.logo_config && (
                <div className="theme-json-debug-viewer__config-item">
                  <span className="theme-json-debug-viewer__config-label">Logo Config</span>
                  <div className="theme-json-debug-viewer__config-grid">
                    <div className="theme-json-debug-viewer__config-entry">
                      <span>Type:</span>
                      <code>{themeJson.default.logo_config.type}</code>
                    </div>
                    <div className="theme-json-debug-viewer__config-entry">
                      <span>Variant:</span>
                      <code className={`theme-json-debug-viewer__variant theme-json-debug-viewer__variant--${themeJson.default.logo_config.variant}`}>
                        {themeJson.default.logo_config.variant}
                      </code>
                    </div>
                  </div>
                </div>
              )}
              {!themeJson.default.logo_url && !themeJson.default.favicon_url && (
                <div className="theme-json-debug-viewer__empty">
                  No logo or favicon data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Raw JSON Section */}
      <div className="theme-json-debug-viewer__section">
        <div
          className="theme-json-debug-viewer__section-header"
          onClick={() => setShowRawJson(!showRawJson)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowRawJson(!showRawJson)}
          aria-expanded={showRawJson}
        >
          {showRawJson ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Eye size={16} />
          <span>Raw JSON</span>
        </div>
        {showRawJson && (
          <div className="theme-json-debug-viewer__section-content">
            <pre className="theme-json-debug-viewer__raw-json">
              {JSON.stringify(themeJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeJsonDebugViewer;
