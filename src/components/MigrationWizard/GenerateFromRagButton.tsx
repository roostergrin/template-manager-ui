import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';
import useRagSitemap from '../../hooks/useRagSitemap';
import './GenerateFromRagButton.sass';

interface GenerateFromRagButtonProps {
  domain: string;
  siteType: string;
  vectorStoreId?: string | null;
  onSitemapGenerated?: (sitemapData: Record<string, any>, savedPath: string) => void;
  disabled?: boolean;
}

const GenerateFromRagButton: React.FC<GenerateFromRagButtonProps> = ({
  domain,
  siteType,
  vectorStoreId,
  onSitemapGenerated,
  disabled = false,
}) => {
  const {
    generateSitemapFromRag,
    isGenerating,
    generatedSitemap,
    generateSitemapError,
    generateSitemapStatus,
    resetGenerateSitemap,
  } = useRagSitemap(domain);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Handle successful generation
  useEffect(() => {
    if (generateSitemapStatus === 'success' && generatedSitemap) {
      setShowSuccessDialog(true);
      if (onSitemapGenerated) {
        onSitemapGenerated(generatedSitemap.sitemap, generatedSitemap.saved_path);
      }
    }
  }, [generateSitemapStatus, generatedSitemap, onSitemapGenerated]);

  const handleClick = () => {
    if (!domain || !siteType) {
      console.error('Missing domain or siteType');
      return;
    }

    console.log('🎯 Generating sitemap from RAG', {
      domain,
      siteType,
      vectorStoreId: vectorStoreId || 'auto-detect',
    });

    generateSitemapFromRag({
      domain,
      siteType,
      vectorStoreId: vectorStoreId || undefined,
    });
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    resetGenerateSitemap();
  };

  const pagesCount = generatedSitemap?.sitemap?.pages
    ? Object.keys(generatedSitemap.sitemap.pages).length
    : 0;

  const canGenerate = !disabled && domain && siteType;
  const tooltipText = !domain
    ? 'Scrape a site first'
    : !siteType
    ? 'Select a site type first'
    : !vectorStoreId
    ? 'Generate using auto-detected vector store'
    : `Generate using vector store ${vectorStoreId.substring(0, 12)}...`;

  return (
    <div className="generate-from-rag-button">
      <button
        className="generate-from-rag-button__button"
        onClick={handleClick}
        disabled={!canGenerate || isGenerating}
        title={tooltipText}
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="spinning" />
            <span>Generating from RAG...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generate from RAG</span>
          </>
        )}
      </button>

      {/* Error state */}
      {generateSitemapError && (
        <div className="generate-from-rag-button__error">
          <AlertCircle size={14} />
          <span>Failed to generate: {generateSitemapError.message}</span>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && generatedSitemap && (
        <div className="generate-from-rag-button__dialog-overlay" onClick={handleCloseDialog}>
          <div className="generate-from-rag-button__dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="generate-from-rag-button__dialog-close"
              onClick={handleCloseDialog}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="generate-from-rag-button__dialog-icon">
              <CheckCircle size={64} />
            </div>

            <h2 className="generate-from-rag-button__dialog-title">
              RAG Sitemap Generated!
            </h2>

            <p className="generate-from-rag-button__dialog-message">
              Your sitemap has been generated using RAG-extracted content.
            </p>

            <div className="generate-from-rag-button__dialog-stats">
              <div className="generate-from-rag-button__stat">
                <span className="generate-from-rag-button__stat-value">{pagesCount}</span>
                <span className="generate-from-rag-button__stat-label">Pages</span>
              </div>
              <div className="generate-from-rag-button__stat">
                <span className="generate-from-rag-button__stat-value">{siteType}</span>
                <span className="generate-from-rag-button__stat-label">Site Type</span>
              </div>
            </div>

            {generatedSitemap.saved_path && (
              <div className="generate-from-rag-button__dialog-path">
                <strong>Saved to:</strong>
                <code>{generatedSitemap.saved_path}</code>
              </div>
            )}

            <button
              className="generate-from-rag-button__dialog-button"
              onClick={handleCloseDialog}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateFromRagButton;

