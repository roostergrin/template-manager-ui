import React, { useEffect } from 'react';
import { getEffectiveQuestionnaireData, isMarkdownData } from '../../utils/questionnaireDataUtils';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import ProgressIndicator from '../Common/ProgressIndicator';
import SiteSelector from '../SiteSelector';
import DefaultTemplateSelector from '../DefaultTemplateSelector/DefaultTemplateSelector';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import SitemapViewToggle from '../Sitemap/SitemapViewToggle';
import JsonExportImport from '../Sitemap/JsonExportImport';

const EnhancedSitemap: React.FC = () => {
  // Use contexts instead of props
  const { state: questionnaireState } = useQuestionnaire();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { state: workflowState, actions: workflowActions } = useWorkflow();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();

  // Extract data from contexts
  const questionnaireData = questionnaireState.data;
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const pages = sitemapState.pages;
  
  // Get the effective questionnaire data (either structured or markdown-based)
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData);
  
  // Ensure query inputs are visible
  const toggledRef = React.useRef(false);
  useEffect(() => {
    if (!toggledRef.current && !sitemapState.showTextarea) {
      toggledRef.current = true;
      sitemapActions.toggleShowTextarea();
    }
  }, [sitemapState.showTextarea, sitemapActions]);
  
  
  // Track sitemap planning progress - using context instead of props
  useEffect(() => {
    const currentStatus = workflowState.progressState.content.sitemapPlanning;
    const shouldBeCompleted = pages.length > 0;
    const shouldBePending = pages.length === 0;
    
    // Only update if the status actually needs to change
    if (shouldBeCompleted && currentStatus !== 'completed') {
      workflowActions.updateTaskStatus('content', 'sitemapPlanning', 'completed');
    } else if (shouldBePending && currentStatus !== 'pending') {
      workflowActions.updateTaskStatus('content', 'sitemapPlanning', 'pending');
    }
  }, [pages.length, workflowState.progressState.content.sitemapPlanning, workflowActions.updateTaskStatus]);
  
  // Import/export logic
  const { exportJson, importJson } = useImportExport();
  
  // Backend
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';

  return (
    <div className="relative">
      <div className="sitemap-header">
        <h2 className="text-2xl font-bold mb-4">Sitemap Builder</h2>
        <ProgressIndicator 
          status={workflowState.progressState.content.sitemapPlanning} 
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
          onModelGroupChange={(key) => appConfigActions.setSelectedModelGroup(key)}
        />
        <h3 className="text-lg font-semibold mb-2">Load a Generated Sitemap</h3>
        <GeneratedSitemapSelector onSelectSitemap={sitemapActions.handleSelectStoredSitemap} />
        <hr className="my-4 border-gray-300" />
        {questionnaireState.activeMode !== 'template-markdown' && (
          <GenerateSitemapButton
            questionnaireData={effectiveQuestionnaireData}
            generateSitemap={generateSitemap}
            generateSitemapStatus={generateSitemapStatus}
            generateSitemapData={generateSitemapData}
            onSitemapGenerated={sitemapActions.handleGeneratedSitemap}
            controls={{
              usePageJson: sitemapState.usePageJson,
              toggleUsePageJson: sitemapActions.toggleUsePageJson,
              backendSiteType,
            }}
          />
        )}
        <DefaultTemplateSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onTemplateSelect={sitemapActions.importPagesFromJson}
        />
      </div>
      
      <SitemapViewToggle />
      
      <JsonExportImport exportJson={exportJson} importJson={importJson} />
    </div>
  );
};

export default EnhancedSitemap; 