// TODO: automate getting the acf export to get the model groups
// TODO: make a pydantic model for the sitemap to generate a sitemap export
import newStinsonSitemap from '../exported_sitemaps/new-stinson/new-stinson-sitemap.json';
import newStinsonGeneratedSitemap from '../exported_sitemaps/new-stinson/generated-sitemap.json';
import pismoSitemap from '../exported_sitemaps/pismo/pismo-sitemap-reversed.json';
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
    models: newStinsonSitemap.modelGroups?.["New Stinson"] || [],
    title: 'Stinson',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-stinson.jpeg',
    adjectives: ['Minimalist', 'Modern', 'Professional'],
    demoUrl: 'https://stinson.roostergrintemplates.com/',
    templates: [
      {
        name: 'Generated Sitemap',
        description: 'Generated sitemap from the questionnaire',
        data: newStinsonGeneratedSitemap
      }
      // Add ore templates for New Stinson
    ]
  },
  'Bay Area Orthodontics': {
    models: [], // Will be empty until templates are added with modelGroups data
    title: 'Bay Area Orthodontics',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-bayareaortho.jpg',
    adjectives: ['Modern', 'Dynamic', 'Clean'],
    demoUrl: 'https://bayareaortho.roostergrintemplates.com/',
    templates: []
  },
  'Calistoga': {
    models: [], // Add specific models when available
    title: 'Calistoga',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-calistoga.jpeg',
    adjectives: ['Composed', 'Serene', 'Metropolitan'],
    demoUrl: 'https://calistoga.roostergrintemplates.com/',
    templates: []
  },
  'Haight Ashbury': {
    models: [], // Add specific models when available
    title: 'Haight Ashbury',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-haight.jpg',
    adjectives: ['Clean', 'Textual', 'Bright'],
    demoUrl: 'https://haightashbury.roostergrintemplates.com/',
    templates: []
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
    models: [], // Add specific models when available
    title: 'Eureka',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-eureka.jpeg',
    adjectives: ['Minimal', 'Clean', 'Calm'],
    demoUrl: 'https://eureka.roostergrintemplates.com/',
    templates: []
  },
  'Shasta': {
    models: [], // Add specific models when available
    title: 'Shasta',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-shasta-2.jpeg',
    adjectives: ['Traditional', 'Calm', 'Polished'],
    demoUrl: 'https://shasta.roostergrintemplates.com/',
    templates: []
  },
  'Sonoma': {
    models: [], // Add specific models when available
    title: 'Sonoma',
    image: 'https://d22lbo23j84nfg.cloudfront.net/sites/templates-sonoma-2.jpeg',
    adjectives: ['Playful', 'Elegant', 'Delicate'],
    demoUrl: 'https://sonoma.roostergrintemplates.com/',
    templates: []
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

