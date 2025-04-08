import newStinsonSitemap from '../../exported_sitemaps/new-stinson/new-stinson-sitemap.json';
// Import other templates as needed
// import stinsonDefault from '../exported_sitemaps/stinson/default.json';
// import stinsonEcommerce from '../exported_sitemaps/stinson/ecommerce.json';

// Map model groups to their available templates
export interface TemplateInfo {
  name: string;
  description: string;
  data: any;
}

export const templateRegistry: Record<string, TemplateInfo[]> = {
  'New Stinson': [
    {
      name: 'Full Orthodontist Site 7 pages',
      description: 'Complete orthodontist website structure with home, about, treatments, etc.',
      data: newStinsonSitemap
    },
    // Add more templates for New Stinson
  ],
  'Stinson': [
    // {
    //   name: 'Default Site',
    //   description: 'Basic Stinson template with common pages',
    //   data: stinsonDefault
    // },
    // {
    //   name: 'E-commerce Template',
    //   description: 'Stinson e-commerce site with product pages',
    //   data: stinsonEcommerce
    // }
  ],
  // Add entries for other model groups
}; 