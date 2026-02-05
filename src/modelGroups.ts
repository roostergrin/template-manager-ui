// TODO: automate getting the acf export to get the model groups
// TODO: make a pydantic model for the sitemap to generate a sitemap export
import rawStinsonSitemap from '../../ContentGenerationAndDistribution/app/schemas/_site_configs/sitemap/stinson-sitemap.json';
import haightAshburySitemap from '../exported_sitemaps/haightashbury/haightashbury-sitemap.json';

/**
 * Mirrors the backend's _should_preserve_image() logic from rag_sitemap_generator.py
 * so the frontend sitemap has preserve_image flags without needing a separate copy.
 */
const injectPreserveImageFlags = (sitemap: typeof rawStinsonSitemap): typeof rawStinsonSitemap => {
  const result = JSON.parse(JSON.stringify(sitemap));
  for (const [pageKey, page] of Object.entries(result.pages)) {
    const pageLower = pageKey.toLowerCase();
    for (const pair of (page as { model_query_pairs: { model: string; query: string; preserve_image?: boolean }[] }).model_query_pairs) {
      const modelLower = pair.model.toLowerCase();
      const queryLower = pair.query.toLowerCase();

      // Doctor/provider photos on home or about-like pages
      if (['home', 'about', 'about us', 'meet the team', 'our team'].includes(pageLower)) {
        if (['image text', 'tabs'].includes(modelLower)) {
          if (['doctor', 'dr.', 'meet the', 'headshot', 'photo', 'provider', 'orthodontist', 'dentist'].some(k => queryLower.includes(k))) {
            pair.preserve_image = true;
            continue;
          }
        }

        // Team photos and office tour on about-like pages only
        if (pageLower.includes('about') || pageLower.includes('team')) {
          if (modelLower === 'block grid') {
            if (['team', 'staff', 'member', 'profile'].some(k => queryLower.includes(k))) {
              pair.preserve_image = true;
              continue;
            }
          }
          if (modelLower === 'single image slider') {
            if (['office', 'tour', 'facility', 'gallery'].some(k => queryLower.includes(k))) {
              pair.preserve_image = true;
              continue;
            }
          }
        }
      }
    }
  }
  return result;
};

import pismoSitemap from '../exported_sitemaps/pismo/pismo-sitemap-reversed.json';
import bayareaorthoSitemap from '../exported_sitemaps/bayareaortho/bayareaortho-sitemap.json';
import calistogaSitemap from '../exported_sitemaps/calistoga/calistoga-sitemap.json';
import eurekaSitemap from '../exported_sitemaps/eureka/eureka-sitemap.json';
import shastaSitemap from '../exported_sitemaps/shasta/shasta-sitemap.json';
import sonomaSitemap from '../exported_sitemaps/sonoma/sonoma-sitemap.json';

const stinsonSitemap = injectPreserveImageFlags(rawStinsonSitemap);
export interface TemplateInfo {
  name: string;
  description: string;
  data: any;
}

export type TemplateType = 'json' | 'wordpress';

export interface ModelGroup {
  models: string[];
  title: string;
  image: string;
  adjectives: string[];
  demoUrl?: string;
  templates: TemplateInfo[]; // Added templates to ModelGroup interface
  backend_site_type?: string;
  github_template_repo_json?: string; // JSON template repo (ai-template-*)
  github_template_repo_wordpress?: string; // WordPress template repo (rg-template-*)
  enabled?: boolean;
}

const allModelGroups: Record<string, ModelGroup> = {
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
        data: stinsonSitemap,
      }
    ],
    backend_site_type: "stinson",
    github_template_repo_json: "ai-template-stinson",
    github_template_repo_wordpress: "rg-template-stinson",
    enabled: true,
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
    ],
    backend_site_type: "bayareaortho",
    github_template_repo_json: "ai-template-bayareaortho",
    github_template_repo_wordpress: "rg-template-bayareaortho",
    enabled: true,
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
    ],
    backend_site_type: "calistoga",
    github_template_repo_json: "ai-template-calistoga",
    github_template_repo_wordpress: "rg-template-calistoga",
    enabled: true,
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
    ],
    backend_site_type: "haightashbury",
    github_template_repo_json: "ai-template-haightashbury",
    github_template_repo_wordpress: "rg-template-haightashbury",
    enabled: true,
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
    ],
    backend_site_type: "pismo",
    enabled: false,
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
    ],
    backend_site_type: "eureka",
    enabled: false,
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
    ],
    backend_site_type: "shasta",
    enabled: false,
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
    ],
    backend_site_type: "sonoma",
    enabled: false,
  }
};

export const modelGroups: Record<string, ModelGroup> = Object.fromEntries(
  Object.entries(allModelGroups)
    .filter(([, grp]) => grp.enabled !== false)
) as Record<string, ModelGroup>

// For backward compatibility
export const initialModelGroups = Object.fromEntries(
  Object.entries(modelGroups).map(([key, value]) => [key, value.models])
);

// For backward compatibility with templateRegistry
export const templateRegistry: Record<string, TemplateInfo[]> = Object.fromEntries(
  Object.entries(modelGroups).map(([key, value]) => [key, value.templates])
);

// Map template keys to model group keys
const templateToModelGroup: Record<string, string> = {
  'stinson': 'New Stinson',
  'haightashbury': 'Haight Ashbury',
  'bayarea': 'Bay Area Orthodontics',
  'bayareaortho': 'Bay Area Orthodontics',
  'calistoga': 'Calistoga',
  'pismo': 'Pismo Beach',
  'eureka': 'Eureka',
  'shasta': 'Shasta',
  'sonoma': 'Sonoma',
};

// Helper to get GitHub template repo from template name/key and type
export const getGithubTemplateRepo = (templateKey: string, templateType: TemplateType = 'json'): string => {
  const modelGroupKey = templateToModelGroup[templateKey?.toLowerCase()] || 'New Stinson';
  const modelGroup = allModelGroups[modelGroupKey];

  if (templateType === 'wordpress') {
    return modelGroup?.github_template_repo_wordpress || 'rg-template-stinson';
  }
  return modelGroup?.github_template_repo_json || 'ai-template-stinson';
};

// Helper to check if WordPress backend is needed based on template type
export const needsWordPressBackend = (templateType: TemplateType): boolean => {
  return templateType === 'wordpress';
};

