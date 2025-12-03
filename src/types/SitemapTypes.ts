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

// ============================================================================
// Vector Store Types (for RAG-based sitemap generation)
// ============================================================================

/**
 * Metadata about a vector store
 */
export interface VectorStore {
  vector_store_id: string;
  domain: string;
  timestamp: string;
  page_count: number;
  created_at: string;
  status: 'active' | 'inactive' | 'deleted';
}

/**
 * Request to create a vector store
 */
export interface CreateVectorStoreRequest {
  domain: string;
  scraped_content: Record<string, any>;
  timestamp?: string;
}

/**
 * Response from creating a vector store
 */
export interface CreateVectorStoreResponse {
  success: boolean;
  vector_store_id: string;
  page_count: number;
  metadata_path: string;
  message?: string;
}

/**
 * Response from listing vector stores
 */
export interface ListVectorStoresResponse {
  success: boolean;
  domain: string;
  vector_stores: VectorStore[];
  count: number;
}

/**
 * Response from deleting a vector store
 */
export interface DeleteVectorStoreResponse {
  success: boolean;
  vector_store_id: string;
  message?: string;
}

/**
 * Request to generate sitemap from RAG
 */
export interface RagGenerateSitemapRequest {
  domain: string;
  site_type: string;
  vector_store_id?: string;
}

/**
 * Response from generating sitemap from RAG
 */
export interface RagGenerateSitemapResponse {
  success: boolean;
  sitemap: Record<string, any>;
  saved_path: string;
}

// ============================================================================
// Information Architecture Types
// ============================================================================

/**
 * A page node in the information architecture hierarchy
 */
export interface HierarchyPageNode {
  title: string;
  slug: string;
  description: string;
  children: HierarchyPageNode[];
}

/**
 * Response from extracting information architecture
 */
export interface ExtractInformationArchitectureResponse {
  success: boolean;
  pages: HierarchyPageNode[];
  total_pages: number;
  message?: string;
}

/**
 * Request to generate sitemap from a custom hierarchy
 */
export interface GenerateSitemapFromHierarchyRequest {
  vector_store_id: string;
  site_type: string;
  domain: string;
  pages: HierarchyPageNode[];
}

/**
 * Section in the sitemap structure (for Step 3 display)
 */
export interface SitemapStructureSection {
  model: string;
  internal_id: string;
}

/**
 * Page in the sitemap structure (for Step 3 display)
 */
export interface SitemapStructurePage {
  title: string;
  slug: string;
  sections: SitemapStructureSection[];
  children: SitemapStructurePage[];
}

/**
 * Enhanced RAG generation response with step details
 */
export interface RagGenerateSitemapResponseWithSteps extends RagGenerateSitemapResponse {
  _hierarchy?: HierarchyPageNode[];
  _sitemap_structure?: SitemapStructurePage[];
  _total_pages?: number;
  _total_sections?: number;
}