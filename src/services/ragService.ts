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

// Export all functions as a service object for convenience
const ragService = {
  createVectorStore,
  listVectorStores,
  deleteVectorStore,
  generateSitemapFromRag,
  extractInformationArchitecture,
  generateSitemapFromHierarchy,
};

export default ragService;

