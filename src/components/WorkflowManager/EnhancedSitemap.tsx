import React, { useEffect } from 'react';
import { getEffectiveQuestionnaireData, isMarkdownData } from '../../utils/questionnaireDataUtils';
import { QuestionnaireData } from '../../types/APIServiceTypes';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import SiteSelector from '../SiteSelector';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import SitemapViewToggle from '../Sitemap/SitemapViewToggle';
import JsonExportImport from '../Sitemap/JsonExportImport';
import DefaultTemplateSelector from '../DefaultTemplateSelector/DefaultTemplateSelector';
import './EnhancedSitemap.sass';

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
  const effectiveQuestionnaireData = getEffectiveQuestionnaireData(questionnaireData) as QuestionnaireData;
  
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
    const currentStatus = workflowState.progressState.planning.sitemapPlanning;
    const shouldBeCompleted = sitemapState.sitemapSource && pages.length > 0;
    const shouldBePending = !sitemapState.sitemapSource || pages.length === 0;
    
    // Only update if the status actually needs to change
    if (shouldBeCompleted && currentStatus !== 'completed') {
      workflowActions.updateTaskStatus('planning', 'sitemapPlanning', 'completed');
    } else if (shouldBePending && currentStatus !== 'pending') {
      workflowActions.updateTaskStatus('planning', 'sitemapPlanning', 'pending');
    }
  }, [sitemapState.sitemapSource, pages.length, workflowState.progressState.planning.sitemapPlanning, workflowActions]);
  
  // Import/export logic
  const { exportJson, importJson } = useImportExport();
  
  // Backend
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';

  return (
    <div className="relative">
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


        <div className="sitemap-actions-row">
          {questionnaireState.activeMode !== 'template-markdown' && (
            <GenerateSitemapButton
              questionnaireData={effectiveQuestionnaireData as any}
              generateSitemap={generateSitemap}
              generateSitemapStatus={generateSitemapStatus}
              generateSitemapData={generateSitemapData}
              onSitemapGenerated={sitemapActions.handleGeneratedSitemap}
              controls={{
                backendSiteType,
              }}
            />
          )}

          <div className="template-selector-card">
            <h3 className="text-lg font-semibold mb-2">Load a Previous Sitemap</h3>
            <GeneratedSitemapSelector onSelectSitemap={sitemapActions.handleSelectStoredSitemap} />
          </div>

          <div className="template-selector-card">
            <h3 className="text-lg font-semibold mb-2">Load a Default Template</h3>
            <DefaultTemplateSelector
              selectedModelGroupKey={selectedModelGroupKey}
              onTemplateSelect={sitemapActions.importPagesFromJson}
            />
          </div>
        </div>

      </div>

      {/* Only show sitemap view and export/import if a sitemap has been loaded or generated */}
      {sitemapState.sitemapSource && pages.length > 0 && (
        <>
          <SitemapViewToggle />
          <JsonExportImport exportJson={exportJson} importJson={importJson} />
        </>
      )}
    </div>
  );
};

export default EnhancedSitemap; 
