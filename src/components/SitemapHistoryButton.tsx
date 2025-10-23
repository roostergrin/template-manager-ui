import React, { useState, useEffect, useRef } from 'react';
import { History } from 'lucide-react';
import { StoredSitemap } from '../types/SitemapTypes';
import './SitemapHistoryButton.sass';

export type SitemapHistoryButtonProps = {
  onSelectSitemap: (sitemap: StoredSitemap) => void;
  currentSiteType: string;
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

const SitemapHistoryButton: React.FC<SitemapHistoryButtonProps> = ({
  onSelectSitemap,
  currentSiteType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sitemaps, setSitemaps] = useState<StoredSitemap[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allSitemaps = getStoredSitemaps();
    // Filter sitemaps by current site type and sort by most recent first
    const filteredSitemaps = allSitemaps
      .filter(s => s.siteType === currentSiteType)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    setSitemaps(filteredSitemaps);
  }, [currentSiteType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    // Refresh the list when opening
    if (!isOpen) {
      const allSitemaps = getStoredSitemaps();
      const filteredSitemaps = allSitemaps
        .filter(s => s.siteType === currentSiteType)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      setSitemaps(filteredSitemaps);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (sitemap: StoredSitemap) => {
    onSelectSitemap(sitemap);
    setIsOpen(false);
  };

  return (
    <div className="sitemap-history-button" ref={dropdownRef}>
      <button
        className="sitemap-history-button__trigger"
        onClick={handleToggle}
        aria-label="View sitemap history"
        aria-expanded={isOpen}
      >
        <History size={18} />
      </button>

      {isOpen && (
        <div className="sitemap-history-button__dropdown">
          {sitemaps.length === 0 ? (
            <div className="sitemap-history-button__empty">
              No history for {currentSiteType}
            </div>
          ) : (
            <div className="sitemap-history-button__list">
              {sitemaps.map((sitemap, idx) => (
                <button
                  key={sitemap.created}
                  className="sitemap-history-button__item"
                  onClick={() => handleSelect(sitemap)}
                >
                  <div className="sitemap-history-button__item-name">{sitemap.name}</div>
                  <div className="sitemap-history-button__item-date">
                    {new Date(sitemap.created).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SitemapHistoryButton;
