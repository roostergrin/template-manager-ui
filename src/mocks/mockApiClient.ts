// Mock API Client - intercepts API calls when mock mode is enabled
import { getMockConfig } from './index';
import { createMockProvisionResult } from './data/provisionMock';
import { createMockScrapeResult } from './data/scrapeMock';
import { createMockSitemapResult } from './data/sitemapMock';
import { createMockContentResult } from './data/contentMock';
import { createMockThemeResult } from './data/themeMock';
import { createMockImagePickerResult } from './data/imagePickerMock';
import { createMockHotlinkResult } from './data/hotlinkMock';
import { createMockWordPressResult, createMockSecondPassResult } from './data/wordpressMock';
import { createMockLogoResult, createMockFaviconResult } from './data/logoFaviconMock';

// Utility to simulate network delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Type for payload that might contain common fields
interface ApiPayload {
  bucket_name?: string;
  domain?: string;
  site_type?: string;
  preserve_doctor_photos?: boolean;
  wordpress_api_url?: string;
  [key: string]: unknown;
}

/**
 * Mock API handler - returns mock data if mock mode is enabled
 * Returns null if mock mode is disabled (caller should proceed with real API)
 */
export const mockApiHandler = async <T>(
  endpoint: string,
  payload?: unknown
): Promise<T | null> => {
  const config = getMockConfig();

  // If mock mode is not enabled, return null to proceed with real API
  if (!config.enabled) {
    return null;
  }

  // Simulate network delay
  await delay(config.responseDelay);

  const data = payload as ApiPayload | undefined;

  // Log mock request
  console.log(`%c[MOCK] ${endpoint}`, 'color: #9333EA; font-weight: bold', data);

  // Route to appropriate mock handler based on endpoint
  if (endpoint.includes('/create-github-repo-from-template')) {
    const newName = data?.new_name || 'mock-repo';
    const templateRepo = data?.template_repo || 'roostergrin/ai-template-stinson';
    console.log(`%c[MOCK] Creating GitHub repo: ${newName} from template: ${templateRepo}`, 'color: #9333EA');
    return {
      success: true,
      owner: 'roostergrin',
      repo: newName,
      full_name: `roostergrin/${newName}`,
      html_url: `https://github.com/roostergrin/${newName}`,
      message: `[MOCK] Repository created from ${templateRepo}`,
    } as T;
  }

  if (endpoint.includes('/copy-subscription')) {
    // Parse query params from endpoint if present
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    const targetDomain = urlParams.get('target_domain') || data?.target_domain || 'mock-site.com';
    const sourceDomain = urlParams.get('source_domain') || data?.source_domain || 'stinsondental.com';
    console.log(`%c[MOCK] Copying WordPress subscription: ${sourceDomain} -> ${targetDomain}`, 'color: #9333EA');
    return {
      success: true,
      source_domain: sourceDomain,
      target_domain: targetDomain,
      subdomain: 'api',
      credentials: {
        ftp: { username: 'mock_ftp_user', password: '********' },
        database: { username: 'mock_db_user', password: '********' },
      },
      operations: {
        files_copied: true,
        database_copied: true,
        config_updated: true,
      },
      message: `[MOCK] WordPress backend provisioned at api.${targetDomain}`,
    } as T;
  }

  if (endpoint.includes('/provision')) {
    const bucketName = data?.bucket_name || 'mock-bucket';
    return createMockProvisionResult(bucketName) as T;
  }

  if (endpoint.includes('/scrape')) {
    const domain = data?.domain || 'example.com';
    return createMockScrapeResult(domain) as T;
  }

  if (endpoint.includes('/create-vector-store')) {
    const domain = data?.domain || 'example.com';
    return {
      success: true,
      vector_store_id: `vs_mock_${domain.replace(/\./g, '_')}_${Date.now()}`,
      page_count: 12,
      metadata_path: `/mock/vector-stores/${domain}/metadata.json`,
    } as T;
  }

  if (endpoint.includes('/allocate-content-to-sitemap')) {
    const vectorStoreId = data?.vector_store_id || 'mock-vs-id';
    console.log(`%c[MOCK] Allocating content using vector store: ${vectorStoreId}`, 'color: #9333EA');

    // Return mock allocation result with sample pages matching Stinson structure
    // Each page has model_query_pairs from template + allocated content from vector store
    const mockPages: Record<string, unknown> = {
      'Home': {
        page_id: '8',
        internal_id: 'page-home-8',
        title: 'Home',
        allocated_markdown: '# Welcome to Our Practice\n\nWe are dedicated to providing exceptional orthodontic care for patients of all ages. Our experienced team uses the latest technology to create beautiful, healthy smiles.\n\n## Why Choose Us?\n\n- Board-certified orthodontists\n- State-of-the-art technology\n- Flexible payment options\n- Convenient location',
        source_location: '/',
        allocation_confidence: 0.95,
        model_query_pairs: [
          { model: 'Hero', query: 'Main site introduction banner', internal_id: 'section-1-hero' },
          { model: 'Block Text Fh', query: 'Welcome message and intro text', internal_id: 'section-2-block-text-fh' },
          { model: 'Multi Item Row', query: 'Reasons to choose us', internal_id: 'section-3-multi-item-row' },
          { model: 'Image Text', query: 'Meet the Doctor details', internal_id: 'section-4-image-text', preserve_image: true },
          { model: 'Block Masonary Grid', query: 'Treatment options overview', internal_id: 'section-5-block-masonary-grid' },
          { model: 'Multi Item Testimonial', query: 'Client testimonials', internal_id: 'section-6-multi-item-testimonial' },
          { model: 'Multi Use Banner', query: 'Call to action', internal_id: 'section-7-multi-use-banner' },
        ],
      },
      'About': {
        page_id: '186',
        internal_id: 'page-about-186',
        title: 'About Us',
        allocated_markdown: '# About Our Team\n\nWith over 20 years of experience serving our community, we are committed to excellence in orthodontic care.\n\n## Our Mission\n\nTo provide personalized orthodontic treatment in a warm, welcoming environment while achieving exceptional results.',
        source_location: '/about',
        allocation_confidence: 0.88,
        model_query_pairs: [
          { model: 'Hero', query: 'About Us introduction', internal_id: 'section-hero-about' },
          { model: 'Block Text Simple', query: 'Our Mission statement', internal_id: 'section-block-text-mission' },
          { model: 'Tabs', query: 'Meet the Doctor details', internal_id: 'section-tabs-doctor', preserve_image: true },
          { model: 'Block Grid', query: 'Meet the Team profiles', internal_id: 'section-block-grid-team', preserve_image: true },
          { model: 'Single Image Slider', query: 'Office photo tour', internal_id: 'section-slider-office' },
          { model: 'Multi Use Banner', query: 'Call to action', internal_id: 'section-banner-about' },
        ],
      },
      'Get Started': {
        page_id: '266',
        internal_id: 'page-get-started-266',
        title: 'Get Started',
        allocated_markdown: '# Get Started\n\nYour first visit includes a comprehensive exam and consultation to discuss your treatment options.\n\n## Insurance & Financing\n\nWe accept most major insurance plans and offer flexible payment options.',
        source_location: '/get-started',
        allocation_confidence: 0.92,
        model_query_pairs: [
          { model: 'Hero', query: 'Get Started hero section', internal_id: 'section-hero-get-started' },
          { model: 'Image Text', query: 'First Visit information', internal_id: 'section-image-text-first-visit' },
          { model: 'Block Text Simple', query: 'Finance and Insurance details', internal_id: 'section-block-text-finance' },
          { model: 'Image Text', query: 'Health History Forms', internal_id: 'section-image-text-forms' },
          { model: 'Multi Use Banner', query: 'Call to action banner', internal_id: 'section-banner-get-started' },
        ],
      },
      'Treatments': {
        page_id: '264',
        internal_id: 'page-treatments-264',
        title: 'Treatments',
        allocated_markdown: '# Our Orthodontic Treatments\n\nWe offer a wide range of treatments including braces and Invisalign.\n\n## Traditional Braces\n\nMetal and ceramic braces remain the most effective treatment for complex orthodontic cases.\n\n## Invisalign\n\nClear aligners offer a virtually invisible way to straighten your teeth.',
        source_location: '/treatments',
        allocation_confidence: 0.97,
        model_query_pairs: [
          { model: 'Hero', query: 'Page hero with title', internal_id: 'section-hero-treatments' },
          { model: 'Image Text', query: 'Early treatment details', internal_id: 'section-image-text-early' },
          { model: 'Image Text', query: 'Adult treatment information', internal_id: 'section-image-text-adult' },
          { model: 'Image Text', query: 'Braces treatment overview', internal_id: 'section-image-text-braces' },
          { model: 'Image Text', query: 'Invisalign treatment info', internal_id: 'section-image-text-invisalign' },
          { model: 'Multi Use Banner', query: 'Call to action', internal_id: 'section-banner-treatments' },
        ],
      },
      'Contact': {
        page_id: '268',
        internal_id: 'page-contact-268',
        title: 'Contact',
        allocated_markdown: '# Contact Us\n\n123 Main Street\nSan Francisco, CA 94102\n\nPhone: (555) 123-4567',
        source_location: '/contact',
        allocation_confidence: 0.90,
        model_query_pairs: [
          { model: 'Hero', query: 'Contact Us hero section', internal_id: 'section-hero-contact' },
          { model: 'Map', query: 'Location and directions map', internal_id: 'section-map-contact' },
          { model: 'Form', query: 'Contact form', internal_id: 'section-form-contact' },
        ],
      },
      'FAQ': {
        page_id: '850',
        internal_id: 'page-faq-850',
        title: 'FAQ',
        allocated_markdown: '# Frequently Asked Questions\n\n**How long does treatment take?**\nTreatment time varies depending on the complexity of your case, but most treatments take between 12-24 months.',
        source_location: '/faq',
        allocation_confidence: 0.85,
        model_query_pairs: [
          { model: 'Hero', query: 'FAQ page introduction', internal_id: 'section-hero-faq' },
          { model: 'Accordions', query: 'Frequently asked questions', internal_id: 'section-accordions-faq' },
          { model: 'Multi Use Banner', query: 'Call to action banner', internal_id: 'section-banner-faq' },
        ],
      },
    };
    return {
      success: true,
      enhanced_sitemap: { pages: mockPages },
      allocation_summary: {
        total_pages: 6,
        allocated_pages: 6,
        failed_pages: 0,
        allocation_rate: 1.0,
        average_confidence: 0.91,
        total_content_length: 2500,
        total_images: 0,
        page_metadata: [
          { page_key: 'Home', page_title: 'Home', allocated: true, content_length: 450, image_count: 0, confidence: 0.95 },
          { page_key: 'About', page_title: 'About Us', allocated: true, content_length: 380, image_count: 0, confidence: 0.88 },
          { page_key: 'Get Started', page_title: 'Get Started', allocated: true, content_length: 320, image_count: 0, confidence: 0.92 },
          { page_key: 'Treatments', page_title: 'Treatments', allocated: true, content_length: 520, image_count: 0, confidence: 0.97 },
          { page_key: 'Contact', page_title: 'Contact', allocated: true, content_length: 150, image_count: 0, confidence: 0.90 },
          { page_key: 'FAQ', page_title: 'FAQ', allocated: true, content_length: 280, image_count: 0, confidence: 0.85 },
        ],
      },
    } as T;
  }

  if (endpoint.includes('/generate-sitemap')) {
    const siteType = data?.site_type || 'dental';
    return createMockSitemapResult(siteType) as T;
  }

  if (endpoint.includes('/generate-content')) {
    // Extract domain from payload or use default
    const domain = 'example.com';
    return createMockContentResult(domain) as T;
  }

  if (endpoint.includes('/generate-theme')) {
    return createMockThemeResult() as T;
  }

  if (endpoint.includes('/replace-images')) {
    const preserveDoctorPhotos = data?.preserve_doctor_photos ?? true;
    return createMockImagePickerResult(preserveDoctorPhotos) as T;
  }

  if (endpoint.includes('/sync-scraped-images')) {
    const bucketName = data?.bucket_name || data?.site_identifier || 'mock-bucket';
    return createMockHotlinkResult(bucketName, data as Parameters<typeof createMockHotlinkResult>[1]) as T;
  }

  if (endpoint.includes('/configure-s3-hotlink-protection')) {
    const bucketName = data?.bucket_name || 'mock-bucket';
    return createMockHotlinkResult(bucketName) as T;
  }

  if (endpoint.includes('/update-wordpress')) {
    return createMockWordPressResult() as T;
  }

  if (endpoint.includes('/wordpress-second-pass')) {
    return createMockSecondPassResult() as T;
  }

  if (endpoint.includes('/upload-logo')) {
    return createMockLogoResult() as T;
  }

  if (endpoint.includes('/upload-favicon')) {
    return createMockFaviconResult() as T;
  }

  // Cleanup endpoints (return success for these too)
  if (endpoint.includes('/cleanup/')) {
    console.log(`%c[MOCK] Cleanup endpoint - returning success`, 'color: #9333EA');
    return { success: true, message: '[MOCK] Cleanup completed' } as T;
  }

  // If no mock handler found, log warning and return null (will use real API)
  console.warn(`[MOCK] No mock handler for endpoint: ${endpoint}, using real API`);
  return null;
};

export default mockApiHandler;
