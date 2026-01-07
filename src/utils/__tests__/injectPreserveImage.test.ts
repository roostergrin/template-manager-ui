import { describe, it, expect } from 'vitest';
import {
  createPreserveImageMap,
  injectPreserveImageIntoContent,
  injectPreserveImageFromSitemap,
  SitemapPage,
  GeneratedComponent,
} from '../injectPreserveImage';

describe('createPreserveImageMap', () => {
  it('should create a map with preserve_image values by page and index', () => {
    const pages: SitemapPage[] = [
      {
        id: 'page-1',
        title: 'Home',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero query' },
          { id: 'item-2', model: 'Image Text', query: 'Image query', preserve_image: true },
          { id: 'item-3', model: 'Block Text', query: 'Text query' },
        ],
      },
    ];

    const result = createPreserveImageMap(pages);

    expect(result.size).toBe(1);
    expect(result.has('Home')).toBe(true);

    const homeMap = result.get('Home');
    expect(homeMap?.size).toBe(1);
    expect(homeMap?.get(1)).toBe(true); // Index 1 has preserve_image: true
    expect(homeMap?.has(0)).toBe(false); // Index 0 has no preserve_image
  });

  it('should handle multiple pages with preserve_image', () => {
    const pages: SitemapPage[] = [
      {
        id: 'page-1',
        title: 'Home',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero', preserve_image: true },
        ],
      },
      {
        id: 'page-2',
        title: 'About',
        items: [
          { id: 'item-2', model: 'Hero', query: 'About Hero' },
          { id: 'item-3', model: 'Team', query: 'Team', preserve_image: true },
        ],
      },
    ];

    const result = createPreserveImageMap(pages);

    expect(result.size).toBe(2);
    expect(result.get('Home')?.get(0)).toBe(true);
    expect(result.get('About')?.get(1)).toBe(true);
  });

  it('should skip pages with no preserve_image values', () => {
    const pages: SitemapPage[] = [
      {
        id: 'page-1',
        title: 'Home',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero' },
          { id: 'item-2', model: 'Text', query: 'Text' },
        ],
      },
    ];

    const result = createPreserveImageMap(pages);

    expect(result.size).toBe(0);
  });

  it('should use wordpress_id as fallback key', () => {
    const pages: SitemapPage[] = [
      {
        id: 'page-1',
        title: '',
        wordpress_id: '123',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero', preserve_image: true },
        ],
      },
    ];

    const result = createPreserveImageMap(pages);

    expect(result.has('123')).toBe(true);
  });

  it('should handle preserve_image: false explicitly', () => {
    const pages: SitemapPage[] = [
      {
        id: 'page-1',
        title: 'Home',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero', preserve_image: false },
          { id: 'item-2', model: 'Text', query: 'Text', preserve_image: true },
        ],
      },
    ];

    const result = createPreserveImageMap(pages);

    const homeMap = result.get('Home');
    expect(homeMap?.get(0)).toBe(false); // Explicit false is stored
    expect(homeMap?.get(1)).toBe(true);
  });
});

describe('injectPreserveImageIntoContent', () => {
  it('should inject preserve_image into matching components', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [
        { acf_fc_layout: 'hero', title: 'Welcome' },
        { acf_fc_layout: 'image_text', title: 'About' },
        { acf_fc_layout: 'block_text', title: 'Info' },
      ],
    };

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[1, true]])], // Index 1 should have preserve_image
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(result.Home[0].preserve_image).toBeUndefined();
    expect(result.Home[1].preserve_image).toBe(true);
    expect(result.Home[2].preserve_image).toBeUndefined();
  });

  it('should handle pages not in the preserve_image map', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {
      Contact: [
        { acf_fc_layout: 'form', title: 'Contact Form' },
      ],
    };

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[0, true]])],
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(result.Contact[0].preserve_image).toBeUndefined();
  });

  it('should preserve existing component properties', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [
        {
          acf_fc_layout: 'image_text',
          title: 'Welcome',
          image: { src: 'test.jpg', alt: 'Test' },
          paragraphs: [{ text: 'Hello' }],
        },
      ],
    };

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[0, true]])],
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(result.Home[0].preserve_image).toBe(true);
    expect(result.Home[0].title).toBe('Welcome');
    expect(result.Home[0].acf_fc_layout).toBe('image_text');
    expect((result.Home[0].image as any).src).toBe('test.jpg');
  });

  it('should handle multiple pages', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [
        { acf_fc_layout: 'hero' },
        { acf_fc_layout: 'image_text' },
      ],
      About: [
        { acf_fc_layout: 'hero' },
        { acf_fc_layout: 'team' },
      ],
    };

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[1, true]])],
      ['About', new Map([[0, true], [1, true]])],
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(result.Home[0].preserve_image).toBeUndefined();
    expect(result.Home[1].preserve_image).toBe(true);
    expect(result.About[0].preserve_image).toBe(true);
    expect(result.About[1].preserve_image).toBe(true);
  });

  it('should not mutate the original content', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [{ acf_fc_layout: 'hero' }],
    };

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[0, true]])],
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(generatedContent.Home[0].preserve_image).toBeUndefined();
    expect(result.Home[0].preserve_image).toBe(true);
  });

  it('should handle empty generated content', () => {
    const generatedContent: Record<string, GeneratedComponent[]> = {};

    const preserveImageMap = new Map<string, Map<number, boolean>>([
      ['Home', new Map([[0, true]])],
    ]);

    const result = injectPreserveImageIntoContent(generatedContent, preserveImageMap);

    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('injectPreserveImageFromSitemap', () => {
  it('should combine createPreserveImageMap and injectPreserveImageIntoContent', () => {
    const sitemapPages: SitemapPage[] = [
      {
        id: 'page-1',
        title: 'Home',
        items: [
          { id: 'item-1', model: 'Hero', query: 'Hero' },
          { id: 'item-2', model: 'Image Text', query: 'Image', preserve_image: true },
        ],
      },
    ];

    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [
        { acf_fc_layout: 'hero', title: 'Welcome' },
        { acf_fc_layout: 'image_text', title: 'Meet the Doctor' },
      ],
    };

    const result = injectPreserveImageFromSitemap(generatedContent, sitemapPages);

    expect(result.Home[0].preserve_image).toBeUndefined();
    expect(result.Home[1].preserve_image).toBe(true);
  });

  it('should handle real-world scenario with multiple preserve_image values', () => {
    const sitemapPages: SitemapPage[] = [
      {
        id: 'page-home-8',
        title: 'Home',
        wordpress_id: '8',
        items: [
          { id: 'section-1-hero', model: 'Hero', query: 'Main banner' },
          { id: 'section-2-block-text', model: 'Block Text', query: 'Welcome' },
          { id: 'section-3-image-text', model: 'Image Text', query: 'Meet Doctor', preserve_image: true },
          { id: 'section-4-testimonials', model: 'Testimonials', query: 'Reviews' },
        ],
      },
      {
        id: 'page-about-186',
        title: 'About',
        wordpress_id: '186',
        items: [
          { id: 'section-hero-about', model: 'Hero', query: 'About Us' },
          { id: 'section-team', model: 'Block Grid', query: 'Team', preserve_image: true },
          { id: 'section-office', model: 'Single Image Slider', query: 'Office', preserve_image: true },
        ],
      },
    ];

    const generatedContent: Record<string, GeneratedComponent[]> = {
      Home: [
        { acf_fc_layout: 'hero', title: 'Welcome to Clinic' },
        { acf_fc_layout: 'block_text_fh', title: 'Introduction' },
        { acf_fc_layout: 'image_text', title: 'Dr. Smith', image: { src: 'doctor.jpg' } },
        { acf_fc_layout: 'multi_item_testimonial', title: 'Reviews' },
      ],
      About: [
        { acf_fc_layout: 'hero', title: 'About Us' },
        { acf_fc_layout: 'block_grid', title: 'Our Team' },
        { acf_fc_layout: 'single_image_slider', title: 'Office Tour' },
      ],
    };

    const result = injectPreserveImageFromSitemap(generatedContent, sitemapPages);

    // Home page - only index 2 should have preserve_image
    expect(result.Home[0].preserve_image).toBeUndefined();
    expect(result.Home[1].preserve_image).toBeUndefined();
    expect(result.Home[2].preserve_image).toBe(true);
    expect(result.Home[3].preserve_image).toBeUndefined();

    // About page - index 1 and 2 should have preserve_image
    expect(result.About[0].preserve_image).toBeUndefined();
    expect(result.About[1].preserve_image).toBe(true);
    expect(result.About[2].preserve_image).toBe(true);
  });
});
