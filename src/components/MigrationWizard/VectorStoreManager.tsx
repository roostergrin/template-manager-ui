import React, { useState } from 'react';
import { Database, Plus, Trash2, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import useRagSitemap from '../../hooks/useRagSitemap';
import { VectorStore } from '../../types/SitemapTypes';
import './VectorStoreManager.sass';

interface VectorStoreManagerProps {
  domain: string;
  scrapedContent?: Record<string, any>;
  onVectorStoreSelect?: (vectorStore: VectorStore | null) => void;
  selectedVectorStoreId?: string | null;
}

const VectorStoreManager: React.FC<VectorStoreManagerProps> = ({
  domain,
  scrapedContent,
  onVectorStoreSelect,
  selectedVectorStoreId,
}) => {
  const {
    vectorStores,
    vectorStoresLoading,
    vectorStoresError,
    refetchVectorStores,
    createVectorStore,
    isCreatingVectorStore,
    createVectorStoreData,
    deleteVectorStore,
    isDeleting,
  } = useRagSitemap(domain);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCreateVectorStore = () => {
    if (!scrapedContent) {
      console.error('No scraped content available');
      return;
    }

    createVectorStore({
      domain,
      scrapedContent,
    });
  };

  const handleDeleteVectorStore = (vectorStoreId: string) => {
    deleteVectorStore(vectorStoreId);
    setShowDeleteConfirm(null);
    
    // If the deleted store was selected, clear the selection
    if (selectedVectorStoreId === vectorStoreId && onVectorStoreSelect) {
      onVectorStoreSelect(null);
    }
  };

  const handleSelectVectorStore = (vectorStore: VectorStore) => {
    if (onVectorStoreSelect) {
      if (selectedVectorStoreId === vectorStore.vector_store_id) {
        // Deselect if clicking the same one
        onVectorStoreSelect(null);
      } else {
        onVectorStoreSelect(vectorStore);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const hasScrapedContent = scrapedContent && Object.keys(scrapedContent.pages || {}).length > 0;

  return (
    <div className="vector-store-manager">
      <div className="vector-store-manager__header">
        <div className="vector-store-manager__title">
          <Database size={18} />
          <span>RAG Vector Stores</span>
        </div>
        <button
          className="vector-store-manager__refresh-btn"
          onClick={() => refetchVectorStores()}
          disabled={vectorStoresLoading}
          title="Refresh list"
        >
          <RefreshCw size={14} className={vectorStoresLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="vector-store-manager__content">
        {/* Create new vector store button */}
        <button
          className="vector-store-manager__create-btn"
          onClick={handleCreateVectorStore}
          disabled={isCreatingVectorStore || !hasScrapedContent}
          title={!hasScrapedContent ? 'Scrape content first to create a vector store' : 'Create vector store from scraped content'}
        >
          {isCreatingVectorStore ? (
            <>
              <Loader2 size={16} className="spinning" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Create Vector Store</span>
            </>
          )}
        </button>

        {/* Success message */}
        {createVectorStoreData && (
          <div className="vector-store-manager__success">
            <Check size={14} />
            <span>Created: {createVectorStoreData.page_count} pages indexed</span>
          </div>
        )}

        {/* Error state */}
        {vectorStoresError && (
          <div className="vector-store-manager__error">
            <AlertCircle size={14} />
            <span>Error loading vector stores</span>
          </div>
        )}

        {/* Vector store list */}
        {vectorStores.length > 0 ? (
          <div className="vector-store-manager__list">
            {vectorStores.map((vs) => (
              <div
                key={vs.vector_store_id}
                className={`vector-store-manager__item ${
                  selectedVectorStoreId === vs.vector_store_id ? 'selected' : ''
                }`}
                onClick={() => handleSelectVectorStore(vs)}
              >
                <div className="vector-store-manager__item-info">
                  <div className="vector-store-manager__item-id">
                    {vs.vector_store_id.substring(0, 12)}...
                  </div>
                  <div className="vector-store-manager__item-meta">
                    <span>{vs.page_count} pages</span>
                    <span className="separator">•</span>
                    <span>{formatDate(vs.created_at)}</span>
                  </div>
                </div>
                <div className="vector-store-manager__item-actions">
                  {selectedVectorStoreId === vs.vector_store_id && (
                    <span className="vector-store-manager__selected-badge">
                      <Check size={12} />
                      Selected
                    </span>
                  )}
                  {showDeleteConfirm === vs.vector_store_id ? (
                    <div className="vector-store-manager__delete-confirm">
                      <button
                        className="vector-store-manager__confirm-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVectorStore(vs.vector_store_id);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 size={12} className="spinning" /> : 'Delete'}
                      </button>
                      <button
                        className="vector-store-manager__cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="vector-store-manager__delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(vs.vector_store_id);
                      }}
                      title="Delete vector store"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !vectorStoresLoading && (
          <div className="vector-store-manager__empty">
            <span>No vector stores found for this domain.</span>
            <span className="vector-store-manager__empty-hint">
              Create one to enable RAG-based sitemap generation.
            </span>
          </div>
        )}

        {/* Loading state */}
        {vectorStoresLoading && vectorStores.length === 0 && (
          <div className="vector-store-manager__loading">
            <Loader2 size={16} className="spinning" />
            <span>Loading vector stores...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorStoreManager;

