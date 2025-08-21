import React from 'react';

export type StoredSitemap = {
  name: string;
  created: string;
  sitemap: unknown;
};

export type GeneratedSitemapSelectorProps = {
  onSelectSitemap: (sitemap: StoredSitemap) => void;
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

const GeneratedSitemapSelector: React.FC<GeneratedSitemapSelectorProps> = ({ onSelectSitemap }) => {
  const [sitemaps, setSitemaps] = React.useState<StoredSitemap[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);

  React.useEffect(() => {
    setSitemaps(getStoredSitemaps());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedIndex(idx);
    if (idx >= 0 && idx < sitemaps.length) {
      onSelectSitemap(sitemaps[idx]);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* <label htmlFor="generated-sitemap-selector" className="text-gray-700 font-medium">
        Load a Generated Sitemap:
      </label> */}
      <select
        id="generated-sitemap-selector"
        className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedIndex}
        onChange={handleChange}
        aria-label="Select a previously generated sitemap"
        tabIndex={0}
      >
        <option value={-1}>Select a sitemap...</option>
        {sitemaps.map((s, idx) => (
          <option key={s.created} value={idx}>
            {s.name} ({new Date(s.created).toLocaleString()})
          </option>
        ))}
      </select>
    </div>
  );
};

export default GeneratedSitemapSelector; 
