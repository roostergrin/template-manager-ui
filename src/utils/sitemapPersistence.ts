import { SitemapSection } from '../types/SitemapTypes';
import { AllocatedSitemap } from '../contexts/MigrationWizardProvider';

export interface PersistedSitemapData {
  domain: string;
  scrapedAt: string;
  lastUpdated: string;
  allocatedSitemap: AllocatedSitemap | null;
  allocatedPagesSitemap: SitemapSection[] | null;
  generatedScrapedSitemap: SitemapSection[] | null;
  generatedDefaultSitemap: SitemapSection[] | null;
  lastSelectedSource: 'default' | 'allocated' | 'scraped';
  selectedModelGroupKey: string | null;
}

const STORAGE_KEY_PREFIX = 'sitemap_data_';
const STORAGE_INDEX_KEY = 'sitemap_index';

// Get all stored domains
export const getStoredDomains = (): string[] => {
  try {
    const index = localStorage.getItem(STORAGE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Failed to get stored domains:', error);
    return [];
  }
};

// Add domain to index
const addDomainToIndex = (domain: string): void => {
  try {
    const domains = getStoredDomains();
    if (!domains.includes(domain)) {
      domains.push(domain);
      localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(domains));
    }
  } catch (error) {
    console.error('Failed to add domain to index:', error);
  }
};

// Get storage key for a domain
const getStorageKey = (domain: string): string => {
  return `${STORAGE_KEY_PREFIX}${domain}`;
};

// Save sitemap data for a domain
export const saveSitemapData = (data: PersistedSitemapData): void => {
  try {
    const key = getStorageKey(data.domain);
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
    addDomainToIndex(data.domain);
    console.log('✅ Saved sitemap data for domain:', data.domain);
  } catch (error) {
    console.error('Failed to save sitemap data:', error);
  }
};

// Load sitemap data for a domain
export const loadSitemapData = (domain: string): PersistedSitemapData | null => {
  try {
    const key = getStorageKey(domain);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('✅ Loaded sitemap data for domain:', domain);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Failed to load sitemap data:', error);
    return null;
  }
};

// Update specific fields in persisted data
export const updateSitemapData = (
  domain: string,
  updates: Partial<Omit<PersistedSitemapData, 'domain' | 'scrapedAt'>>
): void => {
  try {
    const existing = loadSitemapData(domain);
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      saveSitemapData(updated);
    } else {
      console.warn('No existing data found for domain:', domain);
    }
  } catch (error) {
    console.error('Failed to update sitemap data:', error);
  }
};

// Delete sitemap data for a domain
export const deleteSitemapData = (domain: string): void => {
  try {
    const key = getStorageKey(domain);
    localStorage.removeItem(key);

    // Remove from index
    const domains = getStoredDomains();
    const filtered = domains.filter(d => d !== domain);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(filtered));

    console.log('✅ Deleted sitemap data for domain:', domain);
  } catch (error) {
    console.error('Failed to delete sitemap data:', error);
  }
};

// Get list of all persisted sitemap data with metadata
export const getAllSitemapData = (): Array<{
  domain: string;
  scrapedAt: string;
  lastUpdated: string;
  hasAllocated: boolean;
  hasGeneratedScraped: boolean;
  hasGeneratedDefault: boolean;
}> => {
  try {
    const domains = getStoredDomains();
    return domains.map(domain => {
      const data = loadSitemapData(domain);
      return {
        domain,
        scrapedAt: data?.scrapedAt || '',
        lastUpdated: data?.lastUpdated || '',
        hasAllocated: !!(data?.allocatedSitemap),
        hasGeneratedScraped: !!(data?.generatedScrapedSitemap && data.generatedScrapedSitemap.length > 0),
        hasGeneratedDefault: !!(data?.generatedDefaultSitemap && data.generatedDefaultSitemap.length > 0),
      };
    });
  } catch (error) {
    console.error('Failed to get all sitemap data:', error);
    return [];
  }
};

// Clear all sitemap data (useful for debugging/testing)
export const clearAllSitemapData = (): void => {
  try {
    const domains = getStoredDomains();
    domains.forEach(domain => {
      const key = getStorageKey(domain);
      localStorage.removeItem(key);
    });
    localStorage.removeItem(STORAGE_INDEX_KEY);
    console.log('✅ Cleared all sitemap data');
  } catch (error) {
    console.error('Failed to clear all sitemap data:', error);
  }
};
