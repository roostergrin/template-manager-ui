import React from 'react';
import { QuestionnaireData } from '../types/SitemapTypes';
import { isMarkdownData, getEffectiveQuestionnaireData } from '../utils/questionnaireDataUtils';
import useImportExport from '../hooks/useImportExport';
import useGenerateSitemap from '../hooks/useGenerateSitemap';
// import useGenerateContent from '../hooks/useGenerateContent';
import { getBackendSiteTypeForModelGroup } from '../utils/modelGroupKeyToBackendSiteType';
import { useQuestionnaire } from '../contexts/QuestionnaireProvider';
import { useSitemap } from '../contexts/SitemapProvider';
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
  selectedModelGroupKey: string;
  setSelectedModelGroupKey: (key: string) => void;
  modelGroups: Record<string, string[]>;
  setModelGroups: (groups: Record<string, string[]>) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
}

const Sitemap: React.FC<SitemapProps> = ({
  selectedModelGroupKey,
  setSelectedModelGroupKey,
  modelGroups,
  setModelGroups,
  questionnaireData,
  setQuestionnaireData,
}) => {
  // Get sitemap context
  const { state, actions } = useSitemap();
  
  // Get questionnaire mode to conditionally show components
  const { state: questionnaireState } = useQuestionnaire();
  
  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);
  
  // Import/export logic
  const { exportJson, importJson } = useImportExport();
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
        <GeneratedSitemapSelector onSelectSitemap={actions.handleSelectStoredSitemap} />
        <hr className="my-4 border-gray-300" />
        {questionnaireState.activeMode !== 'template-markdown' && (
          <GenerateSitemapButton
            questionnaireData={effectiveQuestionnaireData}
            generateSitemap={generateSitemap}
            generateSitemapStatus={generateSitemapStatus}
            generateSitemapData={generateSitemapData}
            onSitemapGenerated={actions.handleGeneratedSitemap}
            controls={{
              backendSiteType,
            }}
          />
        )}
        <DefaultTemplateSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onTemplateSelect={actions.importPagesFromJson}
        />
      </div>
      <ViewControls />
      <LayoutControls />
      <PageList />
      <JsonExportImport exportJson={exportJson} importJson={importJson} />
      {/* <SitemapContentExport
        pages={pagesApi.pages}
        questionnaireData={effectiveQuestionnaireData}
        onExport={handleExportedContent}
      /> */}
      <GenerateContentProgress
        pages={state.pages}
        questionnaireData={effectiveQuestionnaireData}
        siteType={backendSiteType}
      />
      
    </div>
  );
};

export default Sitemap; 