import React, { useState, useEffect } from 'react';
import {
  Database,
  GitBranch,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Layers,
  FileText,
  Eye,
  Code,
  Copy,
  Save,
  FolderOpen,
} from 'lucide-react';
import useRagSitemap from '../../hooks/useRagSitemap';
import { VectorStore, HierarchyPageNode, SitemapStructurePage } from '../../types/SitemapTypes';
import './RagWorkflow.sass';

interface RagWorkflowProps {
  domain: string;
  siteType: string;
  scrapedContent?: Record<string, any>;
  onSitemapGenerated?: (sitemapData: Record<string, any>, savedPath: string) => void;
}

type WorkflowStep = 'vector-store' | 'information-architecture' | 'generate';

const RagWorkflow: React.FC<RagWorkflowProps> = ({
  domain,
  siteType,
  scrapedContent,
  onSitemapGenerated,
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('vector-store');
  const [selectedVectorStore, setSelectedVectorStore] = useState<VectorStore | null>(null);
  const [editedHierarchy, setEditedHierarchy] = useState<HierarchyPageNode[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showStructureView, setShowStructureView] = useState<'ui' | 'json'>('ui');
  const [sitemapStructure, setSitemapStructure] = useState<SitemapStructurePage[]>([]);
  const [copiedHierarchy, setCopiedHierarchy] = useState(false);
  const [showSavedHierarchies, setShowSavedHierarchies] = useState(false);
  const [hierarchySaved, setHierarchySaved] = useState(false);

  const {
    vectorStores,
    vectorStoresLoading,
    refetchVectorStores,
    createVectorStore,
    isCreatingVectorStore,
    createVectorStoreData,
    extractIA,
    isExtractingIA,
    extractedIA,
    extractIAError,
    resetExtractIA,
    generateFromHierarchy,
    isGeneratingFromHierarchy,
    generatedFromHierarchy,
    generateFromHierarchyError,
    resetGenerateFromHierarchy,
    // Hierarchy save/load
    savedHierarchies,
    savedHierarchiesLoading,
    refetchSavedHierarchies,
    saveHierarchy,
    isSavingHierarchy,
    savedHierarchyData,
    loadHierarchy,
    isLoadingHierarchy,
    loadedHierarchy,
  } = useRagSitemap(domain);

  // Initialize editedHierarchy when IA is extracted
  useEffect(() => {
    if (extractedIA?.pages) {
      setEditedHierarchy(extractedIA.pages);
    }
  }, [extractedIA]);

  // Load hierarchy when loadedHierarchy changes
  useEffect(() => {
    if (loadedHierarchy?.pages) {
      setEditedHierarchy(loadedHierarchy.pages);
      setShowSavedHierarchies(false);
    }
  }, [loadedHierarchy]);

  // Handle successful generation
  useEffect(() => {
    if (generatedFromHierarchy?.success) {
      setShowSuccessDialog(true);
      // Extract structure from response
      const sitemap = generatedFromHierarchy.sitemap;
      if (sitemap?._sitemap_structure) {
        setSitemapStructure(sitemap._sitemap_structure);
      }
      if (onSitemapGenerated) {
        onSitemapGenerated(generatedFromHierarchy.sitemap, generatedFromHierarchy.saved_path);
      }
    }
  }, [generatedFromHierarchy, onSitemapGenerated]);

  const handleCreateVectorStore = () => {
    if (!scrapedContent) return;
    createVectorStore({ domain, scrapedContent });
  };

  const handleSelectVectorStore = (vs: VectorStore) => {
    setSelectedVectorStore(vs);
    setCurrentStep('information-architecture');
    // Reset any previous IA extraction
    resetExtractIA();
    setEditedHierarchy([]);
  };

  const handleExtractIA = () => {
    if (!selectedVectorStore) return;
    extractIA(selectedVectorStore.vector_store_id);
  };

  const handleRemovePage = (pageToRemove: HierarchyPageNode, parentPath: number[] = []) => {
    const removeFromHierarchy = (
      pages: HierarchyPageNode[],
      path: number[],
      target: HierarchyPageNode
    ): HierarchyPageNode[] => {
      if (path.length === 0) {
        // Remove from this level
        return pages.filter(p => p.title !== target.title || p.slug !== target.slug);
      }

      // Navigate to parent
      const [currentIndex, ...restPath] = path;
      return pages.map((page, idx) => {
        if (idx === currentIndex) {
          return {
            ...page,
            children: removeFromHierarchy(page.children, restPath, target),
          };
        }
        return page;
      });
    };

    setEditedHierarchy(prev => removeFromHierarchy(prev, parentPath, pageToRemove));
  };

  const handleGenerate = () => {
    if (!selectedVectorStore) return;
    generateFromHierarchy({
      vectorStoreId: selectedVectorStore.vector_store_id,
      siteType,
      domain,
      pages: editedHierarchy,
    });
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    resetGenerateFromHierarchy();
  };

  const countTotalPages = (pages: HierarchyPageNode[]): number => {
    let count = pages.length;
    for (const page of pages) {
      count += countTotalPages(page.children);
    }
    return count;
  };

  const handleCopyHierarchy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(editedHierarchy, null, 2));
      setCopiedHierarchy(true);
      setTimeout(() => setCopiedHierarchy(false), 2000);
    } catch (err) {
      console.error('Failed to copy hierarchy:', err);
    }
  };

  const handleSaveHierarchy = () => {
    if (!domain || editedHierarchy.length === 0) return;
    saveHierarchy({ domain, hierarchy: editedHierarchy });
    setHierarchySaved(true);
    setTimeout(() => setHierarchySaved(false), 2000);
  };

  const handleLoadHierarchy = (filename: string) => {
    if (!domain) return;
    loadHierarchy({ domain, filename });
  };

  const hasScrapedContent = scrapedContent && Object.keys(scrapedContent.pages || {}).length > 0;

  return (
    <div className="rag-workflow">
      {/* Step indicators */}
      <div className="rag-workflow__steps">
        <div
          className={`rag-workflow__step ${currentStep === 'vector-store' ? 'active' : ''} ${selectedVectorStore ? 'completed' : ''}`}
          onClick={() => setCurrentStep('vector-store')}
        >
          <div className="rag-workflow__step-icon">
            {selectedVectorStore ? <Check size={14} /> : <Database size={14} />}
          </div>
          <span>1. Vector Store</span>
        </div>
        <ChevronRight size={16} className="rag-workflow__step-arrow" />
        <div
          className={`rag-workflow__step ${currentStep === 'information-architecture' ? 'active' : ''} ${editedHierarchy.length > 0 ? 'completed' : ''}`}
          onClick={() => selectedVectorStore && setCurrentStep('information-architecture')}
        >
          <div className="rag-workflow__step-icon">
            {editedHierarchy.length > 0 ? <Check size={14} /> : <GitBranch size={14} />}
          </div>
          <span>2. Page Structure</span>
        </div>
        <ChevronRight size={16} className="rag-workflow__step-arrow" />
        <div
          className={`rag-workflow__step ${currentStep === 'generate' ? 'active' : ''}`}
          onClick={() => editedHierarchy.length > 0 && setCurrentStep('generate')}
        >
          <div className="rag-workflow__step-icon">
            <Sparkles size={14} />
          </div>
          <span>3. Generate</span>
        </div>
      </div>

      {/* Step content */}
      <div className="rag-workflow__content">
        {/* Step 1: Vector Store Selection */}
        {currentStep === 'vector-store' && (
          <div className="rag-workflow__panel">
            <h4 className="rag-workflow__panel-title">Select or Create Vector Store</h4>
            <p className="rag-workflow__panel-description">
              A vector store indexes your scraped content for AI-powered analysis.
            </p>

            {/* Create button */}
            <button
              className="rag-workflow__create-btn"
              onClick={handleCreateVectorStore}
              disabled={isCreatingVectorStore || !hasScrapedContent}
            >
              {isCreatingVectorStore ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Creating...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Create New Vector Store
                </>
              )}
            </button>

            {createVectorStoreData && (
              <div className="rag-workflow__success-msg">
                <Check size={14} />
                Created! {createVectorStoreData.page_count} pages indexed
              </div>
            )}

            {/* Vector store list */}
            {vectorStores.length > 0 && (
              <div className="rag-workflow__vs-list">
                <div className="rag-workflow__vs-list-header">
                  <span>Available Vector Stores</span>
                  <button onClick={() => refetchVectorStores()} disabled={vectorStoresLoading}>
                    <RefreshCw size={12} className={vectorStoresLoading ? 'spinning' : ''} />
                  </button>
                </div>
                {vectorStores.map((vs) => (
                  <div
                    key={vs.vector_store_id}
                    className={`rag-workflow__vs-item ${selectedVectorStore?.vector_store_id === vs.vector_store_id ? 'selected' : ''}`}
                    onClick={() => handleSelectVectorStore(vs)}
                  >
                    <div className="rag-workflow__vs-info">
                      <span className="rag-workflow__vs-id">{vs.vector_store_id.substring(0, 16)}...</span>
                      <span className="rag-workflow__vs-meta">{vs.page_count} pages</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            )}

            {vectorStores.length === 0 && !vectorStoresLoading && (
              <p className="rag-workflow__empty-msg">No vector stores found. Create one to continue.</p>
            )}
          </div>
        )}

        {/* Step 2: Information Architecture */}
        {currentStep === 'information-architecture' && (
          <div className="rag-workflow__panel">
            <h4 className="rag-workflow__panel-title">Review Page Structure</h4>
            <p className="rag-workflow__panel-description">
              Review the extracted pages and remove any you don't need.
            </p>

            {!extractedIA && !isExtractingIA && editedHierarchy.length === 0 && (
              <div className="rag-workflow__extract-options">
                <button
                  className="rag-workflow__extract-btn"
                  onClick={handleExtractIA}
                  disabled={!selectedVectorStore}
                >
                  <GitBranch size={16} />
                  Extract Page Structure
                </button>
                
                {savedHierarchies.length > 0 && (
                  <div className="rag-workflow__load-saved">
                    <button
                      className="rag-workflow__load-btn"
                      onClick={() => setShowSavedHierarchies(!showSavedHierarchies)}
                      disabled={isLoadingHierarchy}
                    >
                      <FolderOpen size={16} />
                      Load Saved ({savedHierarchies.length})
                    </button>
                    
                    {showSavedHierarchies && (
                      <div className="rag-workflow__saved-list">
                        {savedHierarchies.map((h) => (
                          <button
                            key={h.filename}
                            className="rag-workflow__saved-item"
                            onClick={() => handleLoadHierarchy(h.filename)}
                          >
                            <span className="rag-workflow__saved-pages">{h.total_pages} pages</span>
                            <span className="rag-workflow__saved-date">
                              {new Date(h.saved_at).toLocaleDateString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isExtractingIA && (
              <div className="rag-workflow__loading">
                <Loader2 size={20} className="spinning" />
                <span>Analyzing site content...</span>
              </div>
            )}

            {extractIAError && (
              <div className="rag-workflow__error">
                <AlertCircle size={14} />
                <span>Failed to extract structure: {extractIAError.message}</span>
              </div>
            )}

            {editedHierarchy.length > 0 && (
              <>
                <div className="rag-workflow__hierarchy-stats">
                  <span>{countTotalPages(editedHierarchy)} pages</span>
                  <div className="rag-workflow__hierarchy-actions">
                    <button 
                      className="rag-workflow__copy-btn"
                      onClick={handleCopyHierarchy}
                      title="Copy hierarchy JSON to clipboard"
                    >
                      {copiedHierarchy ? <Check size={12} /> : <Copy size={12} />}
                      {copiedHierarchy ? 'Copied!' : 'Copy JSON'}
                    </button>
                    <button 
                      className="rag-workflow__save-btn"
                      onClick={handleSaveHierarchy}
                      disabled={isSavingHierarchy}
                      title="Save hierarchy for later use"
                    >
                      {hierarchySaved ? <Check size={12} /> : <Save size={12} />}
                      {hierarchySaved ? 'Saved!' : isSavingHierarchy ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditedHierarchy(extractedIA?.pages || [])}>
                      <RefreshCw size={12} />
                      Reset
                    </button>
                  </div>
                </div>
                <div className="rag-workflow__hierarchy">
                  <HierarchyTree
                    pages={editedHierarchy}
                    onRemove={handleRemovePage}
                    parentPath={[]}
                  />
                </div>
                <button
                  className="rag-workflow__continue-btn"
                  onClick={() => setCurrentStep('generate')}
                >
                  Continue to Generate
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Generate */}
        {currentStep === 'generate' && (
          <div className="rag-workflow__panel">
            <h4 className="rag-workflow__panel-title">Generate Sitemap</h4>
            <p className="rag-workflow__panel-description">
              Generate a full sitemap with sections and content allocation.
            </p>

            <div className="rag-workflow__generate-summary">
              <div className="rag-workflow__summary-item">
                <span className="label">Pages:</span>
                <span className="value">{countTotalPages(editedHierarchy)}</span>
              </div>
              <div className="rag-workflow__summary-item">
                <span className="label">Site Type:</span>
                <span className="value">{siteType}</span>
              </div>
              <div className="rag-workflow__summary-item">
                <span className="label">Domain:</span>
                <span className="value">{domain}</span>
              </div>
            </div>

            <button
              className="rag-workflow__generate-btn"
              onClick={handleGenerate}
              disabled={isGeneratingFromHierarchy || editedHierarchy.length === 0}
            >
              {isGeneratingFromHierarchy ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Generating Sitemap...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Sitemap
                </>
              )}
            </button>

            {generateFromHierarchyError && (
              <div className="rag-workflow__error">
                <AlertCircle size={14} />
                <span>Failed to generate: {generateFromHierarchyError.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Dialog with Structure View */}
      {showSuccessDialog && generatedFromHierarchy && (
        <div className="rag-workflow__dialog-overlay" onClick={handleCloseSuccessDialog}>
          <div className="rag-workflow__dialog rag-workflow__dialog--large" onClick={(e) => e.stopPropagation()}>
            <button className="rag-workflow__dialog-close" onClick={handleCloseSuccessDialog}>
              <X size={20} />
            </button>
            <div className="rag-workflow__dialog-icon">
              <Check size={48} />
            </div>
            <h3>Sitemap Generated!</h3>
            <p>
              Created {generatedFromHierarchy.sitemap?._total_pages || countTotalPages(editedHierarchy)} pages 
              with {generatedFromHierarchy.sitemap?._total_sections || 0} sections.
            </p>
            
            {/* Structure View Toggle */}
            <div className="rag-workflow__structure-toggle">
              <button 
                className={showStructureView === 'ui' ? 'active' : ''}
                onClick={() => setShowStructureView('ui')}
              >
                <Eye size={14} />
                UI View
              </button>
              <button 
                className={showStructureView === 'json' ? 'active' : ''}
                onClick={() => setShowStructureView('json')}
              >
                <Code size={14} />
                JSON
              </button>
            </div>
            
            {/* Structure Display */}
            <div className="rag-workflow__structure-view">
              {showStructureView === 'ui' ? (
                <div className="rag-workflow__structure-ui">
                  <StructureTree pages={sitemapStructure} />
                </div>
              ) : (
                <pre className="rag-workflow__structure-json">
                  {JSON.stringify(sitemapStructure, null, 2)}
                </pre>
              )}
            </div>
            
            {generatedFromHierarchy.saved_path && (
              <div className="rag-workflow__dialog-path">
                <strong>Saved to:</strong>
                <code>{generatedFromHierarchy.saved_path}</code>
              </div>
            )}
            <button className="rag-workflow__dialog-btn" onClick={handleCloseSuccessDialog}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Hierarchy Tree Component
interface HierarchyTreeProps {
  pages: HierarchyPageNode[];
  onRemove: (page: HierarchyPageNode, parentPath: number[]) => void;
  parentPath: number[];
}

const HierarchyTree: React.FC<HierarchyTreeProps> = ({ pages, onRemove, parentPath }) => {
  return (
    <ul className="hierarchy-tree">
      {pages.map((page, index) => (
        <HierarchyTreeNode
          key={`${page.slug}-${index}`}
          page={page}
          onRemove={onRemove}
          parentPath={parentPath}
          index={index}
        />
      ))}
    </ul>
  );
};

interface HierarchyTreeNodeProps {
  page: HierarchyPageNode;
  onRemove: (page: HierarchyPageNode, parentPath: number[]) => void;
  parentPath: number[];
  index: number;
}

const HierarchyTreeNode: React.FC<HierarchyTreeNodeProps> = ({
  page,
  onRemove,
  parentPath,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = page.children && page.children.length > 0;

  return (
    <li className="hierarchy-tree__node">
      <div className="hierarchy-tree__node-content">
        {hasChildren ? (
          <button
            className="hierarchy-tree__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="hierarchy-tree__expand-placeholder" />
        )}
        <div className="hierarchy-tree__node-info">
          <div className="hierarchy-tree__node-header">
            <span className="hierarchy-tree__node-title">{page.title}</span>
            <span className="hierarchy-tree__node-slug">{page.slug}</span>
          </div>
          {page.description && (
            <span className="hierarchy-tree__node-description">{page.description}</span>
          )}
        </div>
        <button
          className="hierarchy-tree__remove-btn"
          onClick={() => onRemove(page, parentPath)}
          title="Remove page"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {hasChildren && isExpanded && (
        <HierarchyTree
          pages={page.children}
          onRemove={onRemove}
          parentPath={[...parentPath, index]}
        />
      )}
    </li>
  );
};

// Structure Tree Component (for displaying Step 3)
interface StructureTreeProps {
  pages: SitemapStructurePage[];
}

const StructureTree: React.FC<StructureTreeProps> = ({ pages }) => {
  if (!pages || pages.length === 0) {
    return <p className="rag-workflow__empty-structure">No structure data available</p>;
  }
  
  return (
    <ul className="structure-tree">
      {pages.map((page, index) => (
        <StructureTreeNode key={`${page.slug}-${index}`} page={page} />
      ))}
    </ul>
  );
};

interface StructureTreeNodeProps {
  page: SitemapStructurePage;
}

const StructureTreeNode: React.FC<StructureTreeNodeProps> = ({ page }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = page.children && page.children.length > 0;
  
  return (
    <li className="structure-tree__node">
      <div className="structure-tree__page">
        {(hasChildren || page.sections.length > 0) && (
          <button
            className="structure-tree__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        <FileText size={14} className="structure-tree__page-icon" />
        <span className="structure-tree__page-title">{page.title}</span>
        <span className="structure-tree__page-slug">{page.slug}</span>
        <span className="structure-tree__section-count">{page.sections.length} sections</span>
      </div>
      
      {isExpanded && page.sections.length > 0 && (
        <ul className="structure-tree__sections">
          {page.sections.map((section, idx) => (
            <li key={section.internal_id || idx} className="structure-tree__section">
              <Layers size={12} />
              <span className="structure-tree__section-model">{section.model}</span>
            </li>
          ))}
        </ul>
      )}
      
      {isExpanded && hasChildren && (
        <StructureTree pages={page.children} />
      )}
    </li>
  );
};

export default RagWorkflow;

