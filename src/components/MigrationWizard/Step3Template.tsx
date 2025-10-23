import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import TemplateSelector from './TemplateSelector/TemplateSelector';
import './Step3Template.sass';

const Step3Template: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { actions: sitemapActions } = useSitemap();

  if (!state.scrapedContent) {
    return (
      <div className="step-3-template__empty">
        <AlertCircle size={48} />
        <p>No scraped content available. Please complete Step 1 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('capture')}>
          Go to Step 1
        </button>
      </div>
    );
  }

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];

  const handleTemplateSelect = (jsonData: string, modelGroupKey: string) => {
    appConfigActions.setSelectedModelGroup(modelGroupKey);
    sitemapActions.importPagesFromJson(jsonData);
  };

  return (
    <div className="step-3-template">
      <TemplateSelector
        selectedModelGroupKey={selectedModelGroupKey}
        onTemplateSelect={handleTemplateSelect}
        onModelGroupChange={appConfigActions.setSelectedModelGroup}
      />
    </div>
  );
};

export default Step3Template;
