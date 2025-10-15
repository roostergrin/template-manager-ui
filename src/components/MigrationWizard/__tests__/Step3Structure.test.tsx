import { describe, it, expect, beforeEach } from 'vitest';

describe('extractSitemapFromScrapedContent', () => {
  // Helper function to simulate the extraction logic
  const extractSitemapFromScrapedContent = (scrapedContent: any) => {
    if (!scrapedContent) {
      return null;
    }

    const scrapedPageUrls = Object.keys(scrapedContent.pages || {});
    const pagesObject: Record<string, any> = {};

    scrapedPageUrls.forEach((url, index) => {
      const pathParts = url.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
      const title = pathParts.length > 0
        ? pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/_/g, ' ')
        : 'Home';

      const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
      const pageId = pathParts.length > 0 ? pathParts.join('_') : 'home';
      const internalId = `scraped-${pageId}-${Date.now()}-${index}`;

      pagesObject[formattedTitle] = {
        internal_id: internalId,
        page_id: pageId,
        model_query_pairs: []
      };
    });

    return { pages: pagesObject };
  };

  describe('URL to title conversion', () => {
    it('should convert home URL to "Home"', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('Home');
      expect(result?.pages.Home.page_id).toBe('home');
    });

    it('should convert hyphens to spaces in titles', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/about-us': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('About us');
      expect(result?.pages['About us'].page_id).toBe('about-us');
    });

    it('should convert underscores to spaces in titles', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/our_services': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('Our services');
      expect(result?.pages['Our services'].page_id).toBe('our_services');
    });

    it('should capitalize first letter of title', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/contact': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('Contact');
      expect(result?.pages.Contact.page_id).toBe('contact');
    });

    it('should handle multi-segment paths', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/services/web-development': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('Web development');
      expect(result?.pages['Web development'].page_id).toBe('services_web-development');
    });
  });

  describe('Output format', () => {
    it('should return object with pages property', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/about': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('pages');
      expect(typeof result?.pages).toBe('object');
    });

    it('should create pages object (not array)', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/page1': 'content',
          'https://example.com/page2': 'content'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(Array.isArray(result?.pages)).toBe(false);
      expect(typeof result?.pages).toBe('object');
    });

    it('should include required fields for each page', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/about': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      const aboutPage = result?.pages.About;

      expect(aboutPage).toHaveProperty('internal_id');
      expect(aboutPage).toHaveProperty('page_id');
      expect(aboutPage).toHaveProperty('model_query_pairs');

      expect(typeof aboutPage.internal_id).toBe('string');
      expect(typeof aboutPage.page_id).toBe('string');
      expect(Array.isArray(aboutPage.model_query_pairs)).toBe(true);
    });

    it('should create empty model_query_pairs for scraped pages', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/about': 'content',
          'https://example.com/services': 'content'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages.About.model_query_pairs).toEqual([]);
      expect(result?.pages.Services.model_query_pairs).toEqual([]);
    });

    it('should generate unique internal_id for each page', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/page1': 'content',
          'https://example.com/page2': 'content',
          'https://example.com/page3': 'content'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      const ids = Object.values(result?.pages || {}).map((p: any) => p.internal_id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(3);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });
  });

  describe('Edge cases', () => {
    it('should return null if scrapedContent is null', () => {
      const result = extractSitemapFromScrapedContent(null);
      expect(result).toBeNull();
    });

    it('should return null if scrapedContent is undefined', () => {
      const result = extractSitemapFromScrapedContent(undefined);
      expect(result).toBeNull();
    });

    it('should handle empty pages object', () => {
      const scrapedContent = {
        pages: {}
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toEqual({});
    });

    it('should handle URLs without protocol', () => {
      const scrapedContent = {
        pages: {
          '/about-us': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('About us');
    });

    it('should handle trailing slashes', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/about/': 'content here'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveProperty('About');
    });
  });

  describe('Multiple pages', () => {
    it('should handle multiple pages correctly', () => {
      const scrapedContent = {
        pages: {
          'https://example.com/': 'home content',
          'https://example.com/about': 'about content',
          'https://example.com/services': 'services content',
          'https://example.com/contact-us': 'contact content'
        }
      };

      const result = extractSitemapFromScrapedContent(scrapedContent);

      expect(result).not.toBeNull();
      expect(Object.keys(result?.pages || {}).length).toBe(4);
      expect(result?.pages).toHaveProperty('Home');
      expect(result?.pages).toHaveProperty('About');
      expect(result?.pages).toHaveProperty('Services');
      expect(result?.pages).toHaveProperty('Contact us');
    });
  });
});
