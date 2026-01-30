// Mock data for Sitemap generation step
// Matches the structure from real template sitemaps (e.g., stinson/generated-sitemap.json)
import { SitemapStepResult } from '../../types/UnifiedWorkflowTypes';

// Type for model_query_pairs structure
interface ModelQueryPair {
  model: string;
  query: string;
  internal_id: string;
  preserve_image?: boolean;
}

// Type for page structure in sitemap
interface SitemapPage {
  internal_id: string;
  page_id: string;
  model_query_pairs: ModelQueryPair[];
  // Allocation fields added by content allocation step
  allocated_markdown?: string;
  allocation_confidence?: number;
  source_location?: string;
}

export const createMockSitemapResult = (siteType: string): SitemapStepResult => {
  // Create pages object matching real sitemap structure
  const pages: Record<string, SitemapPage> = {
    'Home': {
      internal_id: 'page-home-8',
      page_id: '8',
      model_query_pairs: [
        { model: 'Hero', query: 'Main site introduction banner', internal_id: 'section-1-hero' },
        { model: 'Block Text Fh', query: 'Welcome message and intro text', internal_id: 'section-2-block-text-fh' },
        { model: 'Multi Item Row', query: 'Reasons to choose us', internal_id: 'section-3-multi-item-row' },
        { model: 'Image Text', query: 'Meet the Doctor details, include doctor photo/headshot URL', internal_id: 'section-4-image-text', preserve_image: true },
        { model: 'Block Masonary Grid', query: 'Treatment options overview: Max 4', internal_id: 'section-5-block-masonary-grid' },
        { model: 'Multi Item Testimonial', query: 'Client testimonials and reviews', internal_id: 'section-6-multi-item-testimonial' },
        { model: 'Multi Use Banner', query: 'Call to action to get started', internal_id: 'section-7-multi-use-banner' },
      ],
    },
    'About': {
      internal_id: 'page-about-186',
      page_id: '186',
      model_query_pairs: [
        { model: 'Hero', query: 'About Us introduction', internal_id: 'section-hero-about' },
        { model: 'Block Text Simple', query: 'Our Mission statement', internal_id: 'section-block-text-mission' },
        { model: 'Tabs', query: 'Meet the Doctor details, include doctor photo/headshot URL', internal_id: 'section-tabs-doctor', preserve_image: true },
        { model: 'Block Grid', query: 'Meet the Team profiles', internal_id: 'section-block-grid-team', preserve_image: true },
        { model: 'Single Image Slider', query: 'Office photo tour', internal_id: 'section-slider-office' },
        { model: 'Multi Use Banner', query: 'Call to action to get started', internal_id: 'section-banner-about' },
      ],
    },
    'Get Started': {
      internal_id: 'page-get-started-266',
      page_id: '266',
      model_query_pairs: [
        { model: 'Hero', query: 'Get Started hero section', internal_id: 'section-hero-get-started' },
        { model: 'Image Text', query: 'First Visit information', internal_id: 'section-image-text-first-visit' },
        { model: 'Block Text Simple', query: 'Finance and Insurance details', internal_id: 'section-block-text-finance' },
        { model: 'Image Text', query: 'Health History Forms with PDF download URLs', internal_id: 'section-image-text-forms' },
        { model: 'Multi Use Banner', query: 'Call to action banner', internal_id: 'section-banner-get-started' },
      ],
    },
    'Treatments': {
      internal_id: 'page-treatments-264',
      page_id: '264',
      model_query_pairs: [
        { model: 'Hero', query: 'Page hero with title', internal_id: 'section-hero-treatments' },
        { model: 'Image Text', query: 'Early treatment details', internal_id: 'section-image-text-early' },
        { model: 'Image Text', query: 'Adult treatment information', internal_id: 'section-image-text-adult' },
        { model: 'Image Text', query: 'Braces treatment overview', internal_id: 'section-image-text-braces' },
        { model: 'Image Text', query: 'Invisalign treatment info', internal_id: 'section-image-text-invisalign' },
        { model: 'Multi Use Banner', query: 'Call to action to get started', internal_id: 'section-banner-treatments' },
      ],
    },
    'Contact': {
      internal_id: 'page-contact-268',
      page_id: '268',
      model_query_pairs: [
        { model: 'Hero', query: 'Contact Us hero section', internal_id: 'section-hero-contact' },
        { model: 'Map', query: 'Location and directions map', internal_id: 'section-map-contact' },
        { model: 'Form', query: 'Contact form', internal_id: 'section-form-contact' },
      ],
    },
    'FAQ': {
      internal_id: 'page-faq-850',
      page_id: '850',
      model_query_pairs: [
        { model: 'Hero', query: 'FAQ page introduction', internal_id: 'section-hero-faq' },
        { model: 'Accordions', query: 'Frequently asked questions', internal_id: 'section-accordions-faq' },
        { model: 'Multi Use Banner', query: 'Call to action banner', internal_id: 'section-banner-faq' },
      ],
    },
  };

  // Add specialty pages for dental/orthodontic sites
  if (siteType === 'dental' || siteType === 'stinson' || siteType === 'orthodontic') {
    pages['Braces'] = {
      internal_id: 'page-braces-300',
      page_id: '300',
      model_query_pairs: [
        { model: 'Hero', query: 'Braces treatment page hero', internal_id: 'section-hero-braces' },
        { model: 'Block Text Simple', query: 'Introduction to braces treatment', internal_id: 'section-intro-braces' },
        { model: 'Image Text', query: 'Metal braces information', internal_id: 'section-metal-braces' },
        { model: 'Image Text', query: 'Ceramic braces information', internal_id: 'section-ceramic-braces' },
        { model: 'Multi Use Banner', query: 'Schedule consultation CTA', internal_id: 'section-banner-braces' },
      ],
    };
    pages['Invisalign'] = {
      internal_id: 'page-invisalign-302',
      page_id: '302',
      model_query_pairs: [
        { model: 'Hero', query: 'Invisalign treatment page hero', internal_id: 'section-hero-invisalign' },
        { model: 'Block Text Simple', query: 'What is Invisalign', internal_id: 'section-intro-invisalign' },
        { model: 'Multi Item Row', query: 'Benefits of Invisalign', internal_id: 'section-benefits-invisalign' },
        { model: 'Image Text', query: 'Invisalign process steps', internal_id: 'section-process-invisalign' },
        { model: 'Multi Use Banner', query: 'Free consultation CTA', internal_id: 'section-banner-invisalign' },
      ],
    };
  }

  return {
    success: true,
    pages,
    pageCount: Object.keys(pages).length,
  };
};
