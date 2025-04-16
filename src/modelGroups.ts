// TODO: automate getting the acf export to get the model groups
// TODO: make a pydantic model for the sitemap to generate a sitemap export
import stinsonSitemap from '../exported_sitemaps/stinson/generated-sitemap.json';
import haightAshburySitemap from '../exported_sitemaps/haightashbury/haightashbury-sitemap.json';
import pismoSitemap from '../exported_sitemaps/pismo/pismo-sitemap-reversed.json';
import bayareaorthoSitemap from '../exported_sitemaps/bayareaortho/bayareaortho-sitemap.json';
import calistogaSitemap from '../exported_sitemaps/calistoga/calistoga-sitemap.json';
import eurekaSitemap from '../exported_sitemaps/eureka/eureka-sitemap.json';
import shastaSitemap from '../exported_sitemaps/shasta/shasta-sitemap.json';
import sonomaSitemap from '../exported_sitemaps/sonoma/sonoma-sitemap.json';
export interface TemplateInfo {
  name: string;
  description: string;
  data: any;
}

export interface ModelGroup {
  models: string[];
  title: string;
  image: string;
  adjectives: string[];
  demoUrl?: string;
  templates: TemplateInfo[]; // Added templates to ModelGroup interface
}

export const modelGroups: Record<string, ModelGroup> = {
  'New Stinson': {
    models: Array.isArray(stinsonSitemap.modelGroups) ? stinsonSitemap.modelGroups : [],
    title: 'Stinson',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-stinson.jpeg',
    adjectives: ['Minimalist', 'Modern', 'Professional'],
    demoUrl: 'https://stinson.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: stinsonSitemap
      }
      // Add ore templates for New Stinson
    ]
  },
  'Bay Area Orthodontics': {
    models: Array.isArray(bayareaorthoSitemap.modelGroups) ? bayareaorthoSitemap.modelGroups : [], // Will be empty until templates are added with modelGroups data
    title: 'Bay Area Orthodontics',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-bayareaortho.jpg',
    adjectives: ['Modern', 'Dynamic', 'Clean'],
    demoUrl: 'https://bayareaortho.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: bayareaorthoSitemap
      }
    ]
  },
  'Calistoga': {
    models: Array.isArray(calistogaSitemap.modelGroups) ? calistogaSitemap.modelGroups : [], // Add specific models when available
    title: 'Calistoga',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-calistoga.jpeg',
    adjectives: ['Composed', 'Serene', 'Metropolitan'],
    demoUrl: 'https://calistoga.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: calistogaSitemap
      }
    ]
  },
  'Haight Ashbury': {
    models: Array.isArray(haightAshburySitemap.modelGroups) ? haightAshburySitemap.modelGroups : [], // Add specific models when available
    title: 'Haight Ashbury',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-haight.jpg',
    adjectives: ['Clean', 'Textual', 'Bright'],
    demoUrl: 'https://haightashbury.roostergrintemplates.com/',
    templates: [
      {
        name: 'Full Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: haightAshburySitemap
      }
    ]
  },
  'Pismo Beach': {
    models: Array.isArray(pismoSitemap.modelGroups) ? pismoSitemap.modelGroups : [],
    title: 'Pismo Beach',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-pismobeach.jpeg',
    adjectives: ['Elegant', 'Clean', 'Fresh'],
    demoUrl: 'https://pismo.roostergrintemplates.com/',
    templates: [
      {
        name: 'Full Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: pismoSitemap
      },
    ]
  },
  'Eureka': {
    models: Array.isArray(eurekaSitemap.modelGroups) ? eurekaSitemap.modelGroups : [], // Add specific models when available
    title: 'Eureka',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-eureka.jpeg',
    adjectives: ['Minimal', 'Clean', 'Calm'],
    demoUrl: 'https://eureka.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: eurekaSitemap
      }
    ]
  },
  'Shasta': {
    models: Array.isArray(shastaSitemap.modelGroups) ? shastaSitemap.modelGroups : [], // Add specific models when available
    title: 'Shasta',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-shasta-2.jpeg',
    adjectives: ['Traditional', 'Calm', 'Polished'],
    demoUrl: 'https://shasta.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: shastaSitemap
      }
    ]
  },
  'Sonoma': {
    models: Array.isArray(sonomaSitemap.modelGroups) ? sonomaSitemap.modelGroups : [], // Add specific models when available
    title: 'Sonoma',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-sonoma-2.jpeg',
    adjectives: ['Playful', 'Elegant', 'Delicate'],
    demoUrl: 'https://sonoma.roostergrintemplates.com/',
    templates: [
      {
        name: 'Orthodontist Site',
        description: 'Complete orthodontist website structure with home, about, treatments, etc.',
        data: sonomaSitemap
      }
    ]
  }
};

// For backward compatibility
export const initialModelGroups = Object.fromEntries(
  Object.entries(modelGroups).map(([key, value]) => [key, value.models])
);

// For backward compatibility with templateRegistry
export const templateRegistry: Record<string, TemplateInfo[]> = Object.fromEntries(
  Object.entries(modelGroups).map(([key, value]) => [key, value.templates])
);

