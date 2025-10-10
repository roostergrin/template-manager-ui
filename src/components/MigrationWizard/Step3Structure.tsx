import React from 'react';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import TemplateSelector from './TemplateSelector/TemplateSelector';
import GenerateSitemapButton from '../GenerateSitemapButton';
import GeneratedSitemapSelector from '../GeneratedSitemapSelector';
import SitemapViewToggle from '../Sitemap/SitemapViewToggle';
import JsonExportImport from '../Sitemap/JsonExportImport';
import useImportExport from '../../hooks/useImportExport';
import useGenerateSitemap from '../../hooks/useGenerateSitemap';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import { getEffectiveQuestionnaireData } from '../../utils/questionnaireDataUtils';
import './Step3Structure.sass';

const Step3Structure: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { exportJson, importJson } = useImportExport();
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || '';
  const pages = sitemapState.pages;

  if (!state.scrapedContent) {
    return (
      <div className="step-3-structure__empty">
        <p>No scraped content available. Please complete Step 1 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
          Go to Step 1
        </button>
      </div>
    );
  }

  const handleTemplateSelect = (jsonData: string, modelGroupKey: string) => {
    appConfigActions.setSelectedModelGroup(modelGroupKey);
    sitemapActions.importPagesFromJson(jsonData);
  };

  const metadata = state.scrapedContent.metadata;
  const scrapedPages = state.scrapedContent.pages || [];

  const headerControls = (
    <>
      <div style={{ flex: 1, minWidth: 250 }}>
        <TemplateSelector
          selectedModelGroupKey={selectedModelGroupKey}
          onTemplateSelect={handleTemplateSelect}
          onModelGroupChange={appConfigActions.setSelectedModelGroup}
        />
      </div>
    </>
  );

  const additionalActions = (
    <>
      <GenerateSitemapButton
        questionnaireData={getEffectiveQuestionnaireData(state.scrapedContent) as any}
        generateSitemap={generateSitemap}
        generateSitemapStatus={generateSitemapStatus}
        generateSitemapData={generateSitemapData}
        onSitemapGenerated={sitemapActions.handleGeneratedSitemap}
        controls={{ backendSiteType }}
        scrapedContent={{
          domain: metadata?.domain || 'Unknown',
          pagesCount: scrapedPages.length,
          timestamp: metadata?.timestamp,
        }}
      />
      <div style={{ flex: 1, minWidth: 250 }}>
        <GeneratedSitemapSelector onSelectSitemap={sitemapActions.handleSelectStoredSitemap} />
      </div>
    </>
  );

  const exportImportControls = (
    <JsonExportImport exportJson={exportJson} importJson={importJson} />
  );

  return (
    <div className="step-3-structure">
      <SitemapViewToggle
        headerControls={headerControls}
        contentSourceInfo={{
          domain: metadata?.domain || 'Unknown',
          pagesCount: scrapedPages.length
        }}
        additionalActions={additionalActions}
        exportImportControls={exportImportControls}
      />
    </div>
  );
};

export default Step3Structure;
