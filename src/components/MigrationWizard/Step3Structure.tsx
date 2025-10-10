import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import { modelGroups } from '../../modelGroups';
import './Step3Structure.sass';

const Step3Structure: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { exportJson, importJson } = useImportExport();
  const [generateSitemapData, generateSitemapStatus, generateSitemap] = useGenerateSitemap();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectorResetTrigger, setSelectorResetTrigger] = useState(0);

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
  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

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

  const sitemapTitle = sitemapState.sitemapName
    ? `Currently using: ${sitemapState.sitemapName}`
    : 'Currently using the default sitemap';

  const handleUseDefaultSitemap = () => {
    const selectedGroup = modelGroups[selectedModelGroupKey];
    if (selectedGroup && selectedGroup.templates.length > 0) {
      const firstTemplate = selectedGroup.templates[0];
      const jsonString = JSON.stringify(firstTemplate.data);
      handleTemplateSelect(jsonString, selectedModelGroupKey);
      setSelectorResetTrigger(prev => prev + 1); // Increment to trigger reset
    }
  };

  const additionalActions = (
    <div className="step-3-structure__sitemap-wrapper">
      <div className="step-3-structure__header-row">
        <h3 className="step-3-structure__sitemap-title">{sitemapTitle}</h3>
        <button
          className="step-3-structure__advanced-toggle"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          aria-expanded={isAdvancedOpen}
        >
          Advanced
          {isAdvancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      {isAdvancedOpen && (
        <div className="step-3-structure__additional-actions">
          <div className="step-3-structure__history-row">
            <div style={{ flex: 1, minWidth: 250 }}>
              <GeneratedSitemapSelector
                onSelectSitemap={sitemapActions.handleSelectStoredSitemap}
                resetTrigger={selectorResetTrigger}
              />
            </div>
            <button
              className="step-3-structure__default-button"
              onClick={handleUseDefaultSitemap}
            >
              Use Default Sitemap
            </button>
          </div>
          <div className="step-3-structure__generate-row">
            <div className="step-3-structure__info-badges">
              <div className="step-3-structure__template-badge">
                <span className="step-3-structure__template-name">{backendSiteType}</span>
              </div>
              <div className="step-3-structure__domain-badge">
                <span className="step-3-structure__badge-label">Domain:</span>
                <span className="step-3-structure__badge-value">{state.scrapedContent.domain || 'Unknown'}</span>
              </div>
              <div className="step-3-structure__pages-badge">
                <span className="step-3-structure__badge-label">Pages:</span>
                <span className="step-3-structure__badge-value">{pagesCount}</span>
              </div>
            </div>
            <GenerateSitemapButton
              questionnaireData={getEffectiveQuestionnaireData(state.scrapedContent) as any}
              generateSitemap={generateSitemap}
              generateSitemapStatus={generateSitemapStatus}
              generateSitemapData={generateSitemapData}
              onSitemapGenerated={sitemapActions.handleGeneratedSitemap}
              controls={{ backendSiteType }}
              scrapedContent={{
                domain: state.scrapedContent.domain || 'Unknown',
                pagesCount: pagesCount,
                timestamp: metadata?.scraped_at,
              }}
            />
          </div>
          <div className="step-3-structure__export-import-row">
            <JsonExportImport exportJson={exportJson} importJson={importJson} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="step-3-structure">
      <SitemapViewToggle
        headerControls={headerControls}
        contentSourceInfo={{
          domain: state.scrapedContent.domain || 'Unknown',
          pagesCount: pagesCount
        }}
        additionalActions={additionalActions}
      />
    </div>
  );
};

export default Step3Structure;
