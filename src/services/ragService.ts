import apiClient from './apiService';
import {
  VectorStore,
  CreateVectorStoreRequest,
  CreateVectorStoreResponse,
  ListVectorStoresResponse,
  DeleteVectorStoreResponse,
  RagGenerateSitemapRequest,
  RagGenerateSitemapResponse,
  HierarchyPageNode,
  ExtractInformationArchitectureResponse,
  GenerateSitemapFromHierarchyRequest,
} from '../types/SitemapTypes';

/**
 * Create a vector store from scraped content
 * 
 * @param domain - Domain the content was scraped from
 * @param scrapedContent - Scraped content with pages to index
 * @param timestamp - Optional timestamp
 * @returns Vector store creation result
 */
export const createVectorStore = async (
  domain: string,
  scrapedContent: Record<string, any>,
  timestamp?: string
): Promise<CreateVectorStoreResponse> => {
  const request: CreateVectorStoreRequest = {
    domain,
    scraped_content: scrapedContent,
    timestamp,
  };
  
  console.log(`🚀 Creating vector store for ${domain}...`);
  return await apiClient.post<CreateVectorStoreResponse>('/create-vector-store/', request);
};

/**
 * List all vector stores for a domain
 * 
 * @param domain - Domain to list vector stores for
 * @returns List of vector stores
 */
export const listVectorStores = async (domain: string): Promise<ListVectorStoresResponse> => {
  console.log(`📋 Listing vector stores for ${domain}...`);
  return await apiClient.get<ListVectorStoresResponse>(`/list-vector-stores/${encodeURIComponent(domain)}`);
};

/**
 * Delete a vector store
 * 
 * @param vectorStoreId - ID of the vector store to delete
 * @returns Deletion result
 */
export const deleteVectorStore = async (vectorStoreId: string): Promise<DeleteVectorStoreResponse> => {
  console.log(`🗑️ Deleting vector store ${vectorStoreId}...`);
  return await apiClient.delete<DeleteVectorStoreResponse>(`/delete-vector-store/${encodeURIComponent(vectorStoreId)}`);
};

/**
 * Generate a sitemap from RAG
 * 
 * @param domain - Domain to generate sitemap for
 * @param siteType - Site type for component models
 * @param vectorStoreId - Optional vector store ID (auto-finds if not provided)
 * @returns Generated sitemap
 */
export const generateSitemapFromRag = async (
  domain: string,
  siteType: string,
  vectorStoreId?: string
): Promise<RagGenerateSitemapResponse> => {
  console.log(`🎯 Generating sitemap from RAG for ${domain} (${siteType})...`);
  
  // Build query parameters
  const params = new URLSearchParams({
    domain,
    site_type: siteType,
  });
  
  if (vectorStoreId) {
    params.append('vector_store_id', vectorStoreId);
  }
  
  return await apiClient.post<RagGenerateSitemapResponse>(
    `/generate-sitemap-from-rag/?${params.toString()}`
  );
};

/**
 * Extract information architecture from a vector store
 * 
 * @param vectorStoreId - Vector store ID to query
 * @returns Extracted page hierarchy
 */
export const extractInformationArchitecture = async (
  vectorStoreId: string
): Promise<ExtractInformationArchitectureResponse> => {
  console.log(`📐 Extracting information architecture from ${vectorStoreId}...`);
  
  return await apiClient.post<ExtractInformationArchitectureResponse>(
    '/extract-information-architecture/',
    { vector_store_id: vectorStoreId }
  );
};

/**
 * Generate a sitemap from a custom hierarchy
 * 
 * @param vectorStoreId - Vector store ID for content allocation
 * @param siteType - Site type for component models
 * @param domain - Source domain
 * @param pages - Custom page hierarchy
 * @returns Generated sitemap
 */
export const generateSitemapFromHierarchy = async (
  vectorStoreId: string,
  siteType: string,
  domain: string,
  pages: HierarchyPageNode[]
): Promise<RagGenerateSitemapResponse> => {
  console.log(`🏗️ Generating sitemap from custom hierarchy...`);
  
  const request: GenerateSitemapFromHierarchyRequest = {
    vector_store_id: vectorStoreId,
    site_type: siteType,
    domain,
    pages,
  };
  
  return await apiClient.post<RagGenerateSitemapResponse>(
    '/generate-sitemap-from-hierarchy/',
    request
  );
};

// ============================================================================
// Hierarchy Save/Load Functions
// ============================================================================

export interface SaveHierarchyResponse {
  success: boolean;
  filename: string;
  path: string;
  total_pages: number;
}

export interface HierarchyListItem {
  filename: string;
  saved_at: string;
  total_pages: number;
}

export interface ListHierarchiesResponse {
  hierarchies: HierarchyListItem[];
}

export interface GetHierarchyResponse {
  domain: string;
  saved_at: string;
  pages: HierarchyPageNode[];
  total_pages: number;
}

/**
 * Save a page hierarchy for later retrieval
 * 
 * @param domain - Domain the hierarchy is for
 * @param hierarchy - Page hierarchy to save
 * @returns Save result with filename
 */
export const saveHierarchy = async (
  domain: string,
  hierarchy: HierarchyPageNode[]
): Promise<SaveHierarchyResponse> => {
  console.log(`💾 Saving hierarchy for ${domain}...`);
  
  return await apiClient.post<SaveHierarchyResponse>(
    `/save-hierarchy/${encodeURIComponent(domain)}`,
    hierarchy
  );
};

/**
 * List all saved hierarchies for a domain
 * 
 * @param domain - Domain to list hierarchies for
 * @returns List of saved hierarchies
 */
export const listHierarchies = async (
  domain: string
): Promise<ListHierarchiesResponse> => {
  console.log(`📋 Listing hierarchies for ${domain}...`);
  
  return await apiClient.get<ListHierarchiesResponse>(
    `/list-hierarchies/${encodeURIComponent(domain)}`
  );
};

/**
 * Get a saved hierarchy by filename
 * 
 * @param domain - Domain the hierarchy belongs to
 * @param filename - Filename of the saved hierarchy
 * @returns Full hierarchy data
 */
export const getHierarchy = async (
  domain: string,
  filename: string
): Promise<GetHierarchyResponse> => {
  console.log(`📂 Loading hierarchy ${filename} for ${domain}...`);
  
  return await apiClient.get<GetHierarchyResponse>(
    `/get-hierarchy/${encodeURIComponent(domain)}/${encodeURIComponent(filename)}`
  );
};

// Export all functions as a service object for convenience
const ragService = {
  createVectorStore,
  listVectorStores,
  deleteVectorStore,
  generateSitemapFromRag,
  extractInformationArchitecture,
  generateSitemapFromHierarchy,
  saveHierarchy,
  listHierarchies,
  getHierarchy,
};

export default ragService;

