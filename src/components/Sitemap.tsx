import React, { useCallback } from 'react';
import { QuestionnaireData } from '../types/SitemapTypes';
import usePages from '../hooks/usePages';
import useViewControls from '../hooks/useViewControls';
import useImportExport from '../hooks/useImportExport';
import useGenerateSitemap from '../hooks/useGenerateSitemap';
// import useGenerateContent from '../hooks/useGenerateContent';
import { getBackendSiteTypeForModelGroup } from '../utils/modelGroupKeyToBackendSiteType';
import SiteSelector from './SiteSelector';
import DefaultTemplateSelector from './DefaultTemplateSelector/DefaultTemplateSelector';
import GenerateSitemapButton from './GenerateSitemapButton';
import GeneratedSitemapSelector from './GeneratedSitemapSelector';
import ViewControls from './Sitemap/ViewControls';
import LayoutControls from './Sitemap/LayoutControls';
import PageList from './Sitemap/PageList';
import JsonExportImport from './Sitemap/JsonExportImport';
// import SitemapContentExport from './SitemapContentExport';
import GenerateContentProgress from './GenerateContentProgress';

export interface SitemapProps {
  currentModels: string[];
  selectedModelGroupKey: string;
  setSelectedModelGroupKey: (key: string) => void;
  modelGroups: Record<string, string[]>;
  setModelGroups: (groups: Record<string, string[]>) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
}

const Sitemap: React.FC<SitemapProps> = ({
  currentModels,
  selectedModelGroupKey,
  setSelectedModelGroupKey,
  modelGroups,
  setModelGroups,
  questionnaireData,
  setQuestionnaireData,
}) => {
  // Page logic
  const pagesApi = usePages();
  // View toggles/layout
  const view = useViewControls();
  // Import/export logic
  const { exportJson, importJson } = useImportExport({
    pages: pagesApi.pages,
    selectedModelGroupKey,
    modelGroups,
    questionnaireData,
    importPages: pagesApi.importPagesFromJson,
    onSelectModelGroup: setSelectedModelGroupKey,
    onSetModelGroups: setModelGroups,
    onSetQuestionnaireData: setQuestionnaireData,
  });
  // Backend
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';

  // Handler to receive exported data (optional: you can use or log it)
  const handleExportedContent = (data: any) => {
    // You can use this data as needed in the parent
    // console.log('Exported Content:', data);
  };

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold mb-4">Sitemap Builder</h2>
      <div className="app__header mb-6">
        <SiteSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onModelGroupChange={setSelectedModelGroupKey}
        />
        <h3 className="text-lg font-semibold mb-2">Load a Generated Sitemap</h3>
        <GeneratedSitemapSelector onSelectSitemap={pagesApi.handleSelectStoredSitemap} />
        <hr className="my-4 border-gray-300" />
        <GenerateSitemapButton
          questionnaireData={questionnaireData}
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
      {/* <SitemapContentExport
        pages={pagesApi.pages}
        questionnaireData={questionnaireData}
        onExport={handleExportedContent}
      /> */}
      <GenerateContentProgress
        pages={pagesApi.pages}
        questionnaireData={questionnaireData}
        siteType={backendSiteType}
      />
      
    </div>
  );
};

export default Sitemap; 