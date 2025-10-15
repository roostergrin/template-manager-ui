import React from 'react';

export type StoredSitemap = {
  name: string;
  created: string;
  sitemap: unknown;
};

export type GeneratedSitemapSelectorProps = {
  onSelectSitemap: (sitemap: StoredSitemap) => void;
  resetTrigger?: number;
  disabled?: boolean;
};

const LOCAL_STORAGE_KEY = 'generatedSitemaps';

const getStoredSitemaps = (): StoredSitemap[] => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredSitemap[];
  } catch {
    return [];
  }
};

const GeneratedSitemapSelector: React.FC<GeneratedSitemapSelectorProps> = ({ onSelectSitemap, resetTrigger, disabled = false }) => {
  const [sitemaps, setSitemaps] = React.useState<StoredSitemap[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);

  React.useEffect(() => {
    setSitemaps(getStoredSitemaps());
  }, []);

  // Reset the selector when resetTrigger changes
  React.useEffect(() => {
    if (resetTrigger !== undefined) {
      setSelectedIndex(-1);
    }
  }, [resetTrigger]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedIndex(idx);
    if (idx >= 0 && idx < sitemaps.length) {
      onSelectSitemap(sitemaps[idx]);
    }
  };

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to clear all ${sitemaps.length} stored sitemaps? This cannot be undone.`)) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSitemaps([]);
      setSelectedIndex(-1);
      console.log('🗑️  Cleared all stored sitemaps');
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* <label htmlFor="generated-sitemap-selector" className="text-gray-700 font-medium">
        Load a Generated Sitemap:
      </label> */}
      <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          id="generated-sitemap-selector"
          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ flex: 1, opacity: disabled ? 0.5 : 1 }}
          value={selectedIndex}
          onChange={handleChange}
          aria-label="Select a previously generated sitemap"
          tabIndex={0}
          disabled={disabled}
        >
          <option value={-1}>Select a sitemap...</option>
          {sitemaps.map((s, idx) => (
            <option key={s.created} value={idx}>
              {s.name} ({new Date(s.created).toLocaleString()})
            </option>
          ))}
        </select>
        {sitemaps.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn btn--secondary"
            style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '14px' }}
            title="Clear all stored sitemaps"
            disabled={disabled}
          >
            Clear All ({sitemaps.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default GeneratedSitemapSelector; 
