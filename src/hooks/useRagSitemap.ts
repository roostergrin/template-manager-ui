import { useMutation, useQuery, MutationStatus } from '@tanstack/react-query';
import {
  createVectorStore,
  listVectorStores,
  deleteVectorStore,
  generateSitemapFromRag,
  extractInformationArchitecture,
  generateSitemapFromHierarchy,
  saveHierarchy,
  listHierarchies,
  getHierarchy,
  SaveHierarchyResponse,
  ListHierarchiesResponse,
  GetHierarchyResponse,
} from '../services/ragService';
import {
  VectorStore,
  CreateVectorStoreResponse,
  ListVectorStoresResponse,
  DeleteVectorStoreResponse,
  RagGenerateSitemapResponse,
  ExtractInformationArchitectureResponse,
  HierarchyPageNode,
} from '../types/SitemapTypes';

/**
 * Hook for managing vector stores and RAG-based sitemap generation
 */
const useRagSitemap = (domain?: string) => {
  // Query for listing vector stores
  const vectorStoresQuery = useQuery<ListVectorStoresResponse>({
    queryKey: ['vectorStores', domain],
    queryFn: () => listVectorStores(domain!),
    enabled: !!domain, // Only run when domain is provided
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Mutation for creating a vector store
  const createVectorStoreMutation = useMutation<
    CreateVectorStoreResponse,
    Error,
    { domain: string; scrapedContent: Record<string, any>; timestamp?: string }
  >({
    mutationFn: ({ domain, scrapedContent, timestamp }) =>
      createVectorStore(domain, scrapedContent, timestamp),
    onSuccess: (data) => {
      console.log('✅ Vector store created:', data.vector_store_id);
      console.log(`   📄 ${data.page_count} pages indexed`);
      // Invalidate the vector stores query to refresh the list
      vectorStoresQuery.refetch();
    },
    onError: (error) => {
      console.error('❌ Error creating vector store:', error);
    },
  });

  // Mutation for deleting a vector store
  const deleteVectorStoreMutation = useMutation<
    DeleteVectorStoreResponse,
    Error,
    string
  >({
    mutationFn: (vectorStoreId) => deleteVectorStore(vectorStoreId),
    onSuccess: (data) => {
      console.log('✅ Vector store deleted:', data.vector_store_id);
      // Invalidate the vector stores query to refresh the list
      vectorStoresQuery.refetch();
    },
    onError: (error) => {
      console.error('❌ Error deleting vector store:', error);
    },
  });

  // Mutation for generating sitemap from RAG
  const generateSitemapMutation = useMutation<
    RagGenerateSitemapResponse,
    Error,
    { domain: string; siteType: string; vectorStoreId?: string }
  >({
    mutationFn: ({ domain, siteType, vectorStoreId }) =>
      generateSitemapFromRag(domain, siteType, vectorStoreId),
    onSuccess: (data) => {
      console.log('✅ Sitemap generated from RAG');
      console.log(`   📄 Saved to: ${data.saved_path}`);
      const pageCount = Object.keys(data.sitemap?.pages || {}).length;
      console.log(`   📋 ${pageCount} pages generated`);
    },
    onError: (error) => {
      console.error('❌ Error generating sitemap from RAG:', error);
    },
  });

  // Mutation for extracting information architecture
  const extractIAMutation = useMutation<
    ExtractInformationArchitectureResponse,
    Error,
    string
  >({
    mutationFn: (vectorStoreId) => extractInformationArchitecture(vectorStoreId),
    onSuccess: (data) => {
      console.log('✅ Information architecture extracted');
      console.log(`   📐 ${data.total_pages} pages found`);
    },
    onError: (error) => {
      console.error('❌ Error extracting information architecture:', error);
    },
  });

  // Mutation for generating sitemap from custom hierarchy
  const generateFromHierarchyMutation = useMutation<
    RagGenerateSitemapResponse,
    Error,
    { vectorStoreId: string; siteType: string; domain: string; pages: HierarchyPageNode[] }
  >({
    mutationFn: ({ vectorStoreId, siteType, domain, pages }) =>
      generateSitemapFromHierarchy(vectorStoreId, siteType, domain, pages),
    onSuccess: (data) => {
      console.log('✅ Sitemap generated from custom hierarchy');
      console.log(`   📄 Saved to: ${data.saved_path}`);
      const pageCount = Object.keys(data.sitemap?.pages || {}).length;
      console.log(`   📋 ${pageCount} pages generated`);
    },
    onError: (error) => {
      console.error('❌ Error generating sitemap from hierarchy:', error);
    },
  });

  // Query for listing saved hierarchies
  const hierarchiesQuery = useQuery<ListHierarchiesResponse>({
    queryKey: ['hierarchies', domain],
    queryFn: () => listHierarchies(domain!),
    enabled: !!domain,
    staleTime: 30000,
  });

  // Mutation for saving hierarchy
  const saveHierarchyMutation = useMutation<
    SaveHierarchyResponse,
    Error,
    { domain: string; hierarchy: HierarchyPageNode[] }
  >({
    mutationFn: ({ domain, hierarchy }) => saveHierarchy(domain, hierarchy),
    onSuccess: (data) => {
      console.log('✅ Hierarchy saved:', data.filename);
      console.log(`   📄 ${data.total_pages} pages`);
      // Refresh the hierarchies list
      hierarchiesQuery.refetch();
    },
    onError: (error) => {
      console.error('❌ Error saving hierarchy:', error);
    },
  });

  // Mutation for loading a saved hierarchy
  const loadHierarchyMutation = useMutation<
    GetHierarchyResponse,
    Error,
    { domain: string; filename: string }
  >({
    mutationFn: ({ domain, filename }) => getHierarchy(domain, filename),
    onSuccess: (data) => {
      console.log('✅ Hierarchy loaded:', data.total_pages, 'pages');
    },
    onError: (error) => {
      console.error('❌ Error loading hierarchy:', error);
    },
  });

  return {
    // Vector store list
    vectorStores: vectorStoresQuery.data?.vector_stores || [],
    vectorStoresLoading: vectorStoresQuery.isLoading,
    vectorStoresError: vectorStoresQuery.error,
    refetchVectorStores: vectorStoresQuery.refetch,

    // Create vector store
    createVectorStore: createVectorStoreMutation.mutate,
    createVectorStoreAsync: createVectorStoreMutation.mutateAsync,
    createVectorStoreStatus: createVectorStoreMutation.status as MutationStatus,
    createVectorStoreData: createVectorStoreMutation.data,
    createVectorStoreError: createVectorStoreMutation.error,
    isCreatingVectorStore: createVectorStoreMutation.isPending,

    // Delete vector store
    deleteVectorStore: deleteVectorStoreMutation.mutate,
    deleteVectorStoreAsync: deleteVectorStoreMutation.mutateAsync,
    deleteVectorStoreStatus: deleteVectorStoreMutation.status as MutationStatus,
    isDeleting: deleteVectorStoreMutation.isPending,

    // Generate sitemap from RAG
    generateSitemapFromRag: generateSitemapMutation.mutate,
    generateSitemapFromRagAsync: generateSitemapMutation.mutateAsync,
    generateSitemapStatus: generateSitemapMutation.status as MutationStatus,
    generatedSitemap: generateSitemapMutation.data,
    generateSitemapError: generateSitemapMutation.error,
    isGenerating: generateSitemapMutation.isPending,

    // Reset functions
    resetCreateVectorStore: createVectorStoreMutation.reset,
    resetGenerateSitemap: generateSitemapMutation.reset,

    // Extract information architecture
    extractIA: extractIAMutation.mutate,
    extractIAAsync: extractIAMutation.mutateAsync,
    extractIAStatus: extractIAMutation.status as MutationStatus,
    extractedIA: extractIAMutation.data,
    extractIAError: extractIAMutation.error,
    isExtractingIA: extractIAMutation.isPending,
    resetExtractIA: extractIAMutation.reset,

    // Generate from custom hierarchy
    generateFromHierarchy: generateFromHierarchyMutation.mutate,
    generateFromHierarchyAsync: generateFromHierarchyMutation.mutateAsync,
    generateFromHierarchyStatus: generateFromHierarchyMutation.status as MutationStatus,
    generatedFromHierarchy: generateFromHierarchyMutation.data,
    generateFromHierarchyError: generateFromHierarchyMutation.error,
    isGeneratingFromHierarchy: generateFromHierarchyMutation.isPending,
    resetGenerateFromHierarchy: generateFromHierarchyMutation.reset,

    // Saved hierarchies list
    savedHierarchies: hierarchiesQuery.data?.hierarchies || [],
    savedHierarchiesLoading: hierarchiesQuery.isLoading,
    refetchSavedHierarchies: hierarchiesQuery.refetch,

    // Save hierarchy
    saveHierarchy: saveHierarchyMutation.mutate,
    saveHierarchyAsync: saveHierarchyMutation.mutateAsync,
    isSavingHierarchy: saveHierarchyMutation.isPending,
    savedHierarchyData: saveHierarchyMutation.data,
    saveHierarchyError: saveHierarchyMutation.error,

    // Load hierarchy
    loadHierarchy: loadHierarchyMutation.mutate,
    loadHierarchyAsync: loadHierarchyMutation.mutateAsync,
    isLoadingHierarchy: loadHierarchyMutation.isPending,
    loadedHierarchy: loadHierarchyMutation.data,
    loadHierarchyError: loadHierarchyMutation.error,
  };
};

export default useRagSitemap;

