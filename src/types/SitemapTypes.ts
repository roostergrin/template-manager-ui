export interface SitemapItem {
  model: string;
  query: string;
  id: string;
  // When true, instructs backend to use default content for this component
  useDefault?: boolean;
}

export interface SitemapSection {
  id: string;
  title: string;
  items: SitemapItem[];
  wordpress_id?: string;
  // Allocation fields
  allocated_markdown?: string;
  allocation_confidence?: number;
  source_location?: string;
  mapped_scraped_page?: string;
}

export interface QuestionnaireData {
  // Section A
  practiceDetails: string;
  siteVision: string;
  primaryAudience: string;
  secondaryAudience: string;
  demographics: string;
  uniqueQualities: string;
  
  // Section B
  contentCreation: 'new' | 'prior';
  hasBlog: boolean;
  blogType: string;
  topTreatments: string;
  writingStyle: string;
  topicsToAvoid: string;
  communityEngagement: string;
  testimonials: string;
  patientExperience: string;
  financialOptions: string;
}

// Questionnaire-based request (for /generate-sitemap/)
export type QuestionnaireGenerateSitemapRequest = {
  questionnaire: QuestionnaireData | Record<string, any>;
  site_type?: string;
  use_page_json?: boolean;
};

// Scraped content-based request (for /generate-sitemap-from-scraped/)
export type ScrapedGenerateSitemapRequest = {
  scraped_content: Record<string, any>;
  site_type: string;
  sitemap?: Record<string, any>;
};

// Union type for the service - supports both endpoints
export type GenerateSitemapRequest =
  | QuestionnaireGenerateSitemapRequest
  | ScrapedGenerateSitemapRequest;

// Type guards to differentiate between request types
export function isScrapedRequest(req: GenerateSitemapRequest): req is ScrapedGenerateSitemapRequest {
  return 'scraped_content' in req;
}

export function isQuestionnaireRequest(req: GenerateSitemapRequest): req is QuestionnaireGenerateSitemapRequest {
  return 'questionnaire' in req;
}

export type GenerateSitemapResponse = {
  sitemap_data: unknown;
};

export interface StoredSitemap {
  name: string;
  created: string;
  sitemap: unknown;
  siteType?: string;
} 