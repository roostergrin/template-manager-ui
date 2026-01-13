// Mock data for Scrape step
// Matches the structure returned by the real /scrape/ endpoint
import { ScrapeStepResult } from '../../types/UnifiedWorkflowTypes';

export const createMockScrapeResult = (domain: string): ScrapeStepResult => {
  const practiceName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    success: true,
    domain,
    // Pages - the main scraped content, keyed by URL path
    pages: {
      '/': {
        url: `https://${domain}/`,
        title: `${practiceName} - Welcome`,
        markdown: `# Welcome to ${practiceName}\n\nWe are dedicated to providing exceptional orthodontic care for patients of all ages. Our experienced team uses the latest technology to create beautiful, healthy smiles.\n\n## Why Choose Us?\n\n- Board-certified orthodontists\n- State-of-the-art technology\n- Flexible payment options\n- Convenient location\n\n## Our Services\n\nWe offer a complete range of orthodontic treatments including traditional braces, Invisalign, and early treatment options.`,
        images: [
          `https://${domain}/wp-content/uploads/hero-smile.jpg`,
          `https://${domain}/wp-content/uploads/office-front.jpg`,
        ],
      },
      '/about': {
        url: `https://${domain}/about`,
        title: 'About Us',
        markdown: `# About ${practiceName}\n\nWith over 20 years of experience serving our community, we are committed to excellence in orthodontic care.\n\n## Our Mission\n\nTo provide personalized orthodontic treatment in a warm, welcoming environment while achieving exceptional results.\n\n## Meet Dr. Smith\n\nDr. Smith is a board-certified orthodontist who graduated with honors from dental school. She has been transforming smiles in our community since 2005.`,
        images: [
          `https://${domain}/wp-content/uploads/dr-smith.jpg`,
          `https://${domain}/wp-content/uploads/team-photo.jpg`,
        ],
      },
      '/treatments': {
        url: `https://${domain}/treatments`,
        title: 'Our Treatments',
        markdown: `# Orthodontic Treatments\n\n## Traditional Braces\n\nMetal and ceramic braces remain the most effective treatment for complex orthodontic cases.\n\n## Invisalign\n\nClear aligners offer a virtually invisible way to straighten your teeth.\n\n## Early Treatment\n\nEarly intervention can prevent more serious problems from developing.`,
        images: [
          `https://${domain}/wp-content/uploads/braces.jpg`,
          `https://${domain}/wp-content/uploads/invisalign.jpg`,
        ],
      },
      '/contact': {
        url: `https://${domain}/contact`,
        title: 'Contact Us',
        markdown: `# Contact Us\n\n## Office Location\n\n123 Main Street\nSan Francisco, CA 94102\n\n## Phone\n\n(555) 123-4567\n\n## Email\n\ninfo@${domain}\n\n## Hours\n\nMonday - Friday: 9:00 AM - 5:00 PM\nSaturday: By appointment`,
        images: [],
      },
      '/get-started': {
        url: `https://${domain}/get-started`,
        title: 'Get Started',
        markdown: `# Get Started\n\n## Your First Visit\n\nYour first visit includes a comprehensive exam and consultation to discuss your treatment options.\n\n## Insurance & Financing\n\nWe accept most major insurance plans and offer flexible payment options.\n\n## Patient Forms\n\nDownload and complete your patient forms before your first visit to save time.`,
        images: [],
      },
    },
    // Global markdown - combined content from all pages
    global_markdown: `## Header\n\n[Home](https://${domain}/)\n[About](https://${domain}/about)\n[Treatments](https://${domain}/treatments)\n[Contact](https://${domain}/contact)\n[Get Started](https://${domain}/get-started)\n\n## Welcome to ${practiceName}\n\nWe are dedicated to providing exceptional orthodontic care for patients of all ages.`,
    // Style overview - extracted design information
    style_overview: `# Style & Design Overview\n\n## Logo Images\n\n- https://${domain}/wp-content/uploads/logo.png\n\n## Colors\n\n| Color | Count |\n|-------|-------|\n| #3B82F6 | 45 |\n| #10B981 | 23 |\n| #FFFFFF | 120 |\n| #1F2937 | 89 |\n\n## Typography\n\n- Primary: Inter\n- Heading: Poppins`,
    // Design system extracted from the scraped site - used by /generate-theme/
    designSystem: {
      images: {
        logo: `https://${domain}/wp-content/uploads/logo.png`,
        favicon: `https://${domain}/favicon.ico`,
      },
      colors: {
        primary: '#3B82F6',
        accent: '#10B981',
        background: '#FFFFFF',
        text_primary: '#1F2937',
        link: '#2563EB',
      },
      typography: {
        font_families: {
          primary: 'Inter',
          heading: 'Poppins',
        },
      },
      raw: {
        all_colors: [
          { color: '#3B82F6', count: 45 },
          { color: '#10B981', count: 23 },
          { color: '#FFFFFF', count: 120 },
          { color: '#1F2937', count: 89 },
        ],
        brand_colors: [
          { color: '#3B82F6', count: 45 },
          { color: '#10B981', count: 23 },
        ],
        all_fonts: [
          { family: 'Inter', count: 156 },
          { family: 'Poppins', count: 78 },
        ],
      },
    },
  };
};
