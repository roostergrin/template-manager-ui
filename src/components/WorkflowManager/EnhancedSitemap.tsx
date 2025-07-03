import React, { useEffect } from 'react';
import { QuestionnaireData } from '../../types/SitemapTypes';
import { isMarkdownData, getEffectiveQuestionnaireData } from '../../utils/questionnaireDataUtils';
import usePages from '../../hooks/usePages';
import useViewControls from '../../hooks/useViewControls';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import useProgressTracking from '../../hooks/useProgressTracking';
import ProgressIndicator from '../Common/ProgressIndicator';
import SiteSelector from '../SiteSelector';
import DefaultTemplateSelector from '../DefaultTemplateSelector/DefaultTemplateSelector';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import SitemapViewToggle from '../Sitemap/SitemapViewToggle';
import JsonExportImport from '../Sitemap/JsonExportImport';

export interface EnhancedSitemapProps {
  currentModels: string[];
  selectedModelGroupKey: string;
  setSelectedModelGroupKey: (key: string) => void;
  modelGroups: Record<string, string[]>;
  setModelGroups: (groups: Record<string, string[]>) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
  onPagesChange?: (pages: any[]) => void;
}

const EnhancedSitemap: React.FC<EnhancedSitemapProps> = ({
  currentModels,
  selectedModelGroupKey,
  setSelectedModelGroupKey,
  modelGroups,
  setModelGroups,
  questionnaireData,
  setQuestionnaireData,
  onPagesChange,
}) => {
  // Page logic
  const pagesApi = usePages();
  // View toggles/layout
  const view = useViewControls();
  // Progress tracking
  const { progressState, updateTaskStatus } = useProgressTracking();
  
  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);
  
  // Notify parent when pages change
  useEffect(() => {
    if (onPagesChange) {
      onPagesChange(pagesApi.pages);
    }
  }, [pagesApi.pages, onPagesChange]);

  // Track sitemap planning progress
  useEffect(() => {
    if (pagesApi.pages.length > 0) {
      updateTaskStatus('content', 'sitemapPlanning', 'completed');
    } else if (pagesApi.pages.length === 0) {
      updateTaskStatus('content', 'sitemapPlanning', 'pending');
    }
  }, [pagesApi.pages, updateTaskStatus]);
  
  // Import/export logic
  const { exportJson, importJson } = useImportExport({
    pages: pagesApi.pages,
    selectedModelGroupKey,
    modelGroups,
    questionnaireData: effectiveQuestionnaireData,
    importPages: pagesApi.importPagesFromJson,
    onSelectModelGroup: setSelectedModelGroupKey,
    onSetModelGroups: setModelGroups,
    onSetQuestionnaireData: setQuestionnaireData,
  });
  
  // Backend
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';

  return (
    <div className="relative">
      <div className="sitemap-header">
        <h2 className="text-2xl font-bold mb-4">Sitemap Builder</h2>
        <ProgressIndicator 
          status={progressState.content.sitemapPlanning} 
          size="medium"
          showLabel={true}
        />
      </div>
      
      {/* Data Source Indicator */}
      {isMarkdownData(questionnaireData) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📝 Using Markdown Data Source:</strong> The sitemap is using markdown content as the questionnaire data.
          </p>
        </div>
      )}
      
      <div className="app__header mb-6">
        <SiteSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onModelGroupChange={setSelectedModelGroupKey}
        />
        <h3 className="text-lg font-semibold mb-2">Load a Generated Sitemap</h3>
        <GeneratedSitemapSelector onSelectSitemap={pagesApi.handleSelectStoredSitemap} />
        <hr className="my-4 border-gray-300" />
        <GenerateSitemapButton
          questionnaireData={effectiveQuestionnaireData}
          generateSitemap={generateSitemap}
          generateSitemapStatus={generateSitemapStatus}
          generateSitemapData={generateSitemapData}
          onSitemapGenerated={pagesApi.handleGeneratedSitemap}
          controls={{
            usePageJson: view.usePageJson,
            toggleUsePageJson: view.toggleUsePageJson,
            backendSiteType,
          }}
        />
        <DefaultTemplateSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onTemplateSelect={pagesApi.importPagesFromJson}
        />
      </div>
      
      <SitemapViewToggle
        pages={pagesApi.pages}
        currentModels={currentModels}
        updatePageTitle={pagesApi.updatePageTitle}
        updatePageWordpressId={pagesApi.updatePageWordpressId}
        updatePageItems={pagesApi.updatePageItems}
        removePage={pagesApi.removePage}
        addPage={pagesApi.addPage}
        // View control props
        showSelect={view.showSelect}
        toggleShowSelect={view.toggleShowSelect}
        showTextarea={view.showTextarea}
        toggleShowTextarea={view.toggleShowTextarea}
        showDeleteButtons={view.showDeleteButtons}
        toggleShowDeleteButtons={view.toggleShowDeleteButtons}
        showItemNumbers={view.showItemNumbers}
        toggleShowItemNumbers={view.toggleShowItemNumbers}
        showPageIds={view.showPageIds}
        toggleShowPageIds={view.toggleShowPageIds}
        // Layout control props
        useGridLayout={view.useGridLayout}
        toggleUseGridLayout={view.toggleUseGridLayout}
        gridColumnWidth={view.gridColumnWidth}
        setGridColumnWidth={view.setGridColumnWidth}
      />
      
      <JsonExportImport exportJson={exportJson} importJson={importJson} />
    </div>
  );
};

export default EnhancedSitemap; 