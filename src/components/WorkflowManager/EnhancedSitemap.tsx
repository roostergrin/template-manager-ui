import React, { useEffect } from 'react';
import { QuestionnaireData } from '../../types/SitemapTypes';
import { isMarkdownData, getEffectiveQuestionnaireData } from '../../utils/questionnaireDataUtils';
import usePages from '../../hooks/usePages';
import useViewControls from '../../hooks/useViewControls';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import SiteSelector from '../SiteSelector';
import DefaultTemplateSelector from '../DefaultTemplateSelector/DefaultTemplateSelector';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import ViewControls from '../Sitemap/ViewControls';
import LayoutControls from '../Sitemap/LayoutControls';
import PageList from '../Sitemap/PageList';
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
  
  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);
  
  // Notify parent when pages change
  useEffect(() => {
    if (onPagesChange) {
      onPagesChange(pagesApi.pages);
    }
  }, [pagesApi.pages, onPagesChange]);
  
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
      <h2 className="text-2xl font-bold mb-4">Sitemap Builder</h2>
      
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
      <ViewControls {...view} />
      <LayoutControls
        useGridLayout={view.useGridLayout}
        toggleUseGridLayout={view.toggleUseGridLayout}
        gridColumnWidth={view.gridColumnWidth}
        setGridColumnWidth={view.setGridColumnWidth}
      />
      <PageList
        pages={pagesApi.pages}
        useGridLayout={view.useGridLayout}
        gridColumnWidth={view.gridColumnWidth}
        showItemNumbers={view.showItemNumbers}
        showPageIds={view.showPageIds}
        showDeleteButtons={view.showDeleteButtons}
        showSelect={view.showSelect}
        showTextarea={view.showTextarea}
        currentModels={currentModels}
        updatePageTitle={pagesApi.updatePageTitle}
        updatePageWordpressId={pagesApi.updatePageWordpressId}
        updatePageItems={pagesApi.updatePageItems}
        removePage={pagesApi.removePage}
        addPage={pagesApi.addPage}
      />
      <JsonExportImport exportJson={exportJson} importJson={importJson} />
    </div>
  );
};

export default EnhancedSitemap; 