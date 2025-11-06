import React, { useMemo } from 'react';
import { Palette, Image as ImageIcon, Copy, Check } from 'lucide-react';
import './StyleOverview.sass';

interface StyleOverviewProps {
  styleOverview: string;
}

interface ColorInfo {
  color: string;
  count: number;
}

interface PageColorInfo {
  pageName: string;
  uniqueColors: number;
  topColors: string[];
}

interface ParsedStyleData {
  logos: string[];
  totalUniqueColors: number;
  topColors: ColorInfo[];
  pageColorData: PageColorInfo[];
}

const StyleOverview: React.FC<StyleOverviewProps> = ({ styleOverview }) => {
  const [copiedItem, setCopiedItem] = React.useState<string | null>(null);

  const parsedData = useMemo((): ParsedStyleData => {
    const data: ParsedStyleData = {
      logos: [],
      totalUniqueColors: 0,
      topColors: [],
      pageColorData: []
    };

    if (!styleOverview) return data;

    // Parse logos
    const logoSection = styleOverview.match(/## Logo Images\n([\s\S]*?)(?=\n##|\n$)/);
    if (logoSection) {
      const logoUrls = logoSection[1].match(/- (https?:\/\/[^\s\n]+)/g);
      if (logoUrls) {
        data.logos = logoUrls.map(url => url.replace('- ', '').trim());
      }
    }

    // Parse total unique colors
    const totalColorsMatch = styleOverview.match(/\*\*Total Unique Colors Found:\*\* (\d+)/);
    if (totalColorsMatch) {
      data.totalUniqueColors = parseInt(totalColorsMatch[1], 10);
    }

    // Parse most frequently used colors table
    const colorTableMatch = styleOverview.match(/### Most Frequently Used Colors\n\| Color \| Usage Count \|\n\|-------|-------------\|\n([\s\S]*?)(?=\n##|\n###|\n$)/);
    if (colorTableMatch) {
      const rows = colorTableMatch[1].trim().split('\n');
      data.topColors = rows.map(row => {
        const match = row.match(/\| `([^`]+)` \| (\d+) \|/);
        if (match) {
          return { color: match[1], count: parseInt(match[2], 10) };
        }
        return null;
      }).filter((item): item is ColorInfo => item !== null);
    }

    // Parse per-page color analysis
    const pageSection = styleOverview.match(/## Per-Page Color Analysis\n([\s\S]*?)$/);
    if (pageSection) {
      const pageBlocks = pageSection[1].split(/### /).filter(block => block.trim());

      data.pageColorData = pageBlocks.map(block => {
        const lines = block.trim().split('\n');
        const pageName = lines[0].trim();
        const uniqueColorsMatch = block.match(/- Unique colors: (\d+)/);
        const topColorsMatch = block.match(/- Top colors: (.+)/);

        return {
          pageName,
          uniqueColors: uniqueColorsMatch ? parseInt(uniqueColorsMatch[1], 10) : 0,
          topColors: topColorsMatch
            ? topColorsMatch[1].split(',').map(c => c.trim().replace(/`/g, '')).filter(c => c)
            : []
        };
      });
    }

    return data;
  }, [styleOverview]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const getColorValue = (colorString: string): string => {
    // Extract hex or rgb value from the color string
    return colorString.trim();
  };

  const isValidColor = (color: string): boolean => {
    // Check if color is a valid hex or rgb/rgba format
    const hexRegex = /^#[0-9A-Fa-f]{3,8}$/;
    const rgbRegex = /^rgba?\([^)]+\)$/;
    return hexRegex.test(color) || rgbRegex.test(color);
  };

  if (!styleOverview) {
    return null;
  }

  return (
    <div className="style-overview">
      {/* Logos Section */}
      {parsedData.logos.length > 0 && (
        <div className="style-overview__section style-overview__section--compact">
          <div className="style-overview__section-header">
            <ImageIcon size={16} />
            <h4 className="style-overview__section-title">Logo Images</h4>
          </div>
          <div className="style-overview__logos-compact">
            {parsedData.logos.map((logo, index) => (
              <div key={index} className="style-overview__logo-compact">
                <img
                  src={logo}
                  alt={`Logo ${index + 1}`}
                  className="style-overview__logo-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <button
                  className="style-overview__copy-icon"
                  onClick={() => handleCopy(logo, `logo-${index}`)}
                  title={logo}
                >
                  {copiedItem === `logo-${index}` ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Palette Section */}
      {parsedData.topColors.length > 0 && (
        <div className="style-overview__section style-overview__section--compact">
          <div className="style-overview__section-header">
            <Palette size={16} />
            <h4 className="style-overview__section-title">Color Palette</h4>
            <span className="style-overview__badge">{parsedData.totalUniqueColors} total</span>
          </div>

          <div className="style-overview__colors-compact">
            {parsedData.topColors.map((colorInfo, index) => {
              const colorValue = getColorValue(colorInfo.color);
              const isValid = isValidColor(colorValue);

              return (
                <div key={index} className="style-overview__color-item">
                  <div
                    className="style-overview__swatch"
                    style={{ backgroundColor: isValid ? colorValue : '#ccc' }}
                    title={`${colorValue} (${colorInfo.count}×)`}
                  >
                    {!isValid && <span className="style-overview__invalid">?</span>}
                  </div>
                  <div className="style-overview__color-details">
                    <code className="style-overview__code">{colorValue}</code>
                    <span className="style-overview__usage">{colorInfo.count}×</span>
                  </div>
                  <button
                    className="style-overview__copy-icon"
                    onClick={() => handleCopy(colorValue, `color-${index}`)}
                    title="Copy color"
                  >
                    {copiedItem === `color-${index}` ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Page Color Analysis */}
      {parsedData.pageColorData.length > 0 && (
        <div className="style-overview__section style-overview__section--compact">
          <div className="style-overview__section-header">
            <Palette size={16} />
            <h4 className="style-overview__section-title">Per-Page Colors</h4>
            <span className="style-overview__badge">{parsedData.pageColorData.length} pages</span>
          </div>

          <div className="style-overview__pages-compact">
            {parsedData.pageColorData.map((pageData, index) => (
              <div key={index} className="style-overview__page-row">
                <span className="style-overview__page-name" title={pageData.pageName}>
                  {pageData.pageName}
                </span>
                <span className="style-overview__page-count">
                  {pageData.uniqueColors} unique colors
                </span>
                <div className="style-overview__page-swatches">
                  {pageData.topColors.slice(0, 5).map((color, colorIndex) => {
                    const colorValue = getColorValue(color);
                    const isValid = isValidColor(colorValue);

                    return (
                      <div
                        key={colorIndex}
                        className="style-overview__mini-swatch"
                        style={{ backgroundColor: isValid ? colorValue : '#ccc' }}
                        title={colorValue}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Markdown Fallback */}
      {parsedData.logos.length === 0 && parsedData.topColors.length === 0 && (
        <div className="style-overview__raw">
          <pre className="style-overview__raw-content">{styleOverview}</pre>
        </div>
      )}
    </div>
  );
};

export default StyleOverview;
