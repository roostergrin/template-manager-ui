import React, { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
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

  const handleContinue = () => {
    actions.setCurrentStep('structure');
  };

  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

  return (
    <div className="step-3-template">
      <div className="step-3-template__header">
        <h2>Choose Your Template</h2>
        <p>
          Select a template that best fits your needs. This will provide the default page structure and components
          for your site from <strong>{state.scrapedContent.domain}</strong>.
        </p>
      </div>

      <div className="step-3-template__content">
        <div className="step-3-template__info-cards">
          <div className="info-card">
            <span className="info-card__label">Scraped Domain</span>
            <span className="info-card__value">{state.scrapedContent.domain}</span>
          </div>
          <div className="info-card">
            <span className="info-card__label">Pages Scraped</span>
            <span className="info-card__value">{pagesCount}</span>
          </div>
          <div className="info-card">
            <span className="info-card__label">Selected Template</span>
            <span className="info-card__value">{selectedModelGroupKey || 'None'}</span>
          </div>
        </div>

        <div className="step-3-template__selector-wrapper">
          <h3>Template Selection</h3>
          <TemplateSelector
            selectedModelGroupKey={selectedModelGroupKey}
            onTemplateSelect={handleTemplateSelect}
            onModelGroupChange={appConfigActions.setSelectedModelGroup}
          />
        </div>

        <div className="step-3-template__description">
          <h4>What happens when you select a template?</h4>
          <ul>
            <li>The template's default page structure will be loaded</li>
            <li>You'll be able to choose between the default pages or your scraped sitemap in the next step</li>
            <li>Component models and styling will be pre-configured based on your selection</li>
            <li>You can further customize the structure in Step 3.5</li>
          </ul>
        </div>
      </div>

      <div className="step-3-template__actions">
        <button
          className="btn btn--primary btn--large"
          onClick={handleContinue}
        >
          Continue to Structure
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Step3Template;
