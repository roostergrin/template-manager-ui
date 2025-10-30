import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import GitHubRepoCreator from '../WorkflowManager/GitHubRepoCreator';
import EnhancedProvisionSection from '../WorkflowManager/EnhancedProvisionSection';
import CopyToTemplatesSection from '../WorkflowManager/CopyToTemplatesSection';
import { useGithubRepo } from '../../context/GithubRepoContext';
import './InfrastructureSetup.sass';

type PageType = 'template' | 'landing' | 'template-json';
type TemplateBoilerplate =
  | 'stinson'
  | 'haightashbury'
  | 'bayareaortho'
  | 'calistoga'
  | 'eureka'
  | 'pismo'
  | 'shasta'
  | 'sonoma'
  | '';
type TemplateJSONBoilerplate =
  | 'stinson'
  | 'haightashbury'
  | 'bayareaortho'
  | 'calistoga'
  | '';

interface StepsState {
  [key: string]: {
    enabled: boolean;
    detailsExpanded: boolean;
  };
}

const InfrastructureSetup: React.FC = () => {
  const { state, actions } = useGithubRepo();
  const { setGithubRepo, setPageType: setContextPageType } = actions;

  const [domainName, setDomainName] = useState('gordon.com');
  const [pageType, setPageType] = useState<PageType>('template');
  const [templateBoilerplate, setTemplateBoilerplate] = useState<TemplateBoilerplate>('stinson');
  const [templateJSONBoilerplate, setTemplateJSONBoilerplate] = useState<TemplateJSONBoilerplate>('');
  const [provisioningData, setProvisioningData] = useState<any>(null);

  const [steps, setSteps] = useState<StepsState>({
    step1: { enabled: true, detailsExpanded: false },
    step2: { enabled: true, detailsExpanded: false },
    step3: { enabled: true, detailsExpanded: false },
  });

  // Extract base domain name (e.g., "gordon.com" -> "gordon")
  const baseDomain = useMemo(() => {
    return domainName.replace(/\.(com|net|org|io|co|dev)$/i, '');
  }, [domainName]);

  // Template to GitHub repo mapping
  const templateToGithubRepo = useMemo(() => {
    // Template JSON (Legacy) use ai-template-* repos
    if (pageType === 'template-json') {
      const templateJSONMapping: { [key: string]: string } = {
        'stinson': 'ai-template-stinson',
        'haightashbury': 'ai-template-haight-ashbury',
        'bayareaortho': 'ai-template-bayarea',
        'calistoga': 'ai-template-calistoga',
      };
      return templateJSONMapping[templateJSONBoilerplate] || 'ai-template-stinson';
    }

    // Modern templates use rg-template-* repos
    const mapping: { [key: string]: string } = {
      'stinson': 'rg-template-stinson',
      'haightashbury': 'rg-template-haight-ashbury',
      'bayareaortho': 'rg-template-bayarea',
      'calistoga': 'rg-template-calistoga',
      'eureka': 'rg-template-eureka',
      'pismo': 'rg-template-pismo',
      'shasta': 'rg-template-shasta',
      'sonoma': 'rg-template-sonoma',
    };
    return mapping[templateBoilerplate] || 'rg-template-stinson';
  }, [pageType, templateBoilerplate, templateJSONBoilerplate]);

  // Template to backend API mapping
  const templateToBackendAPI = useMemo(() => {
    const mapping: { [key: string]: string } = {
      'stinson': 'api-stinson.roostergrintemplates.com',
      'haightashbury': 'api-haightashbury.roostergrintemplates.com',
      'bayareaortho': 'api-bayareaortho.roostergrintemplates.com',
      'calistoga': 'api-calistoga.roostergrintemplates.com',
      'eureka': 'api-eureka.roostergrintemplates.com',
      'pismo': 'api-pismo.roostergrintemplates.com',
      'shasta': 'api-shasta.roostergrintemplates.com',
      'sonoma': 'api-sonoma.roostergrintemplates.com',
    };
    return mapping[templateBoilerplate] || 'api-stinson.roostergrintemplates.com';
  }, [templateBoilerplate]);

  // Generate template display name
  const templateDisplayName = useMemo(() => {
    const names: { [key: string]: string } = {
      'stinson': 'Stinson',
      'haightashbury': 'Haight Ashbury',
      'bayareaortho': 'Bay Area Ortho',
      'calistoga': 'Calistoga',
      'eureka': 'Eureka',
      'pismo': 'Pismo',
      'shasta': 'Shasta',
      'sonoma': 'Sonoma',
    };

    if (pageType === 'template-json') {
      return names[templateJSONBoilerplate] || '';
    }

    return names[templateBoilerplate] || '';
  }, [pageType, templateBoilerplate, templateJSONBoilerplate]);

  // Auto-generate repository name (no boilerplate suffix)
  const generatedRepoName = useMemo(() => {
    return baseDomain;
  }, [baseDomain]);

  // Auto-generate CloudFront domain
  const generatedCloudFrontDomain = useMemo(() => {
    if (pageType === 'template' || pageType === 'template-json') {
      return `dist.${domainName}`;
    } else if (pageType === 'landing') {
      return `landing.${domainName}`;
    }
    return `dist.${domainName}`;
  }, [domainName, pageType]);

  // CloudFront path for display
  const cloudFrontPath = useMemo(() => {
    if (pageType === 'landing') {
      return '/landing';
    }
    return '/dist';
  }, [pageType]);

  // Auto-generate S3 bucket name
  const generatedS3Bucket = useMemo(() => {
    return baseDomain;
  }, [baseDomain]);

  // Auto-generate pipeline name
  const generatedPipelineName = useMemo(() => {
    return `${baseDomain}-pipeline`;
  }, [baseDomain]);

  // Auto-generate API subdomain (use template-specific backend for templates)
  const generatedApiSubdomain = useMemo(() => {
    if (pageType === 'template' && templateBoilerplate) {
      return templateToBackendAPI;
    } else if (pageType === 'template-json' && templateJSONBoilerplate) {
      // Template JSON (Legacy) also use template-specific backend (JSON-based)
      return templateToBackendAPI;
    }
    return `api-${baseDomain}.roostergrintemplates.com`;
  }, [baseDomain, pageType, templateBoilerplate, templateJSONBoilerplate, templateToBackendAPI]);

  // Final values
  const repoName = generatedRepoName;
  const s3Bucket = generatedS3Bucket;
  const cloudFrontDomain = generatedCloudFrontDomain;
  const apiSubdomain = generatedApiSubdomain;

  // Sync repo name with context
  useEffect(() => {
    setGithubRepo(repoName);
  }, [repoName, setGithubRepo]);

  // Sync page type with context
  useEffect(() => {
    setContextPageType(pageType);
  }, [pageType, setContextPageType]);

  const handleStepToggle = (stepKey: string) => {
    setSteps(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        enabled: !prev[stepKey].enabled,
        detailsExpanded: prev[stepKey].enabled ? false : prev[stepKey].detailsExpanded,
      }
    }));
  };

  const handleDetailsToggle = (stepKey: string) => {
    setSteps(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        detailsExpanded: !prev[stepKey].detailsExpanded,
      }
    }));
  };

  const enabledStepsCount = useMemo(() => {
    return Object.values(steps).filter(step => step.enabled).length;
  }, [steps]);

  const handleProvision = () => {
    console.log('Provision Infrastructure clicked');
    // TODO: Implement provisioning logic
  };

  return (
    <div className="infrastructure-setup">
      <div className="infrastructure-setup__header">
        <h2 className="infrastructure-setup__title">Infrastructure Setup</h2>
        <p className="infrastructure-setup__subtitle">
          Configure your domain and infrastructure will be automatically generated
        </p>
      </div>

      {/* Configuration Section */}
      <div className="infrastructure-setup__configuration">
        <h3 className="configuration__title">Configuration</h3>

        {/* Domain Name */}
        <div className="configuration__field">
          <label htmlFor="domain-name" className="configuration__label">
            Domain Name
          </label>
          <input
            id="domain-name"
            type="text"
            className="configuration__input"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="example.com"
          />
          <p className="configuration__help-text">
            This will be used to generate all resource names
          </p>
        </div>

        {/* Page Type */}
        <div className="configuration__field">
          <label className="configuration__label">Page Type</label>
          <div className="configuration__page-types">
            <button
              type="button"
              className={`page-type-card ${pageType === 'template' ? 'page-type-card--selected' : ''}`}
              onClick={() => setPageType('template')}
            >
              <div className="page-type-card__title">Template</div>
              <div className="page-type-card__description">Pre-built template with sections</div>
            </button>
            <button
              type="button"
              className={`page-type-card ${pageType === 'landing' ? 'page-type-card--selected' : ''}`}
              onClick={() => setPageType('landing')}
            >
              <div className="page-type-card__title">Landing Page</div>
              <div className="page-type-card__description">Single page for campaigns</div>
            </button>
            <button
              type="button"
              className={`page-type-card ${pageType === 'template-json' ? 'page-type-card--selected' : ''}`}
              onClick={() => setPageType('template-json')}
            >
              <div className="page-type-card__title">Template JSON (Legacy)</div>
              <div className="page-type-card__description">JSON-based backend only</div>
            </button>
          </div>
        </div>

        {/* Template Boilerplate (only shown when pageType is 'template') */}
        {pageType === 'template' && (
          <div className="configuration__field">
            <label htmlFor="template-boilerplate" className="configuration__label">
              Template Boilerplate
            </label>
            <select
              id="template-boilerplate"
              className="configuration__select"
              value={templateBoilerplate}
              onChange={(e) => setTemplateBoilerplate(e.target.value as TemplateBoilerplate)}
            >
              <option value="">Select a boilerplate...</option>
              <option value="stinson">Stinson</option>
              <option value="haightashbury">Haight Ashbury</option>
              <option value="bayareaortho">Bay Area Ortho</option>
              <option value="calistoga">Calistoga</option>
              <option value="eureka">Eureka</option>
              <option value="pismo">Pismo</option>
              <option value="shasta">Shasta</option>
              <option value="sonoma">Sonoma</option>
            </select>
          </div>
        )}

        {/* Template JSON Boilerplate (only shown when pageType is 'template-json') */}
        {pageType === 'template-json' && (
          <div className="configuration__field">
            <label htmlFor="template-json-boilerplate" className="configuration__label">
              Template JSON Boilerplate
            </label>
            <select
              id="template-json-boilerplate"
              className="configuration__select"
              value={templateJSONBoilerplate}
              onChange={(e) => setTemplateJSONBoilerplate(e.target.value as TemplateJSONBoilerplate)}
            >
              <option value="">Select a template...</option>
              <option value="stinson">Stinson (JSON backend)</option>
              <option value="haightashbury">Haight Ashbury (JSON backend)</option>
              <option value="bayareaortho">Bay Area Ortho (JSON backend)</option>
              <option value="calistoga">Calistoga (JSON backend)</option>
            </select>
            <p className="configuration__help-text">
              Template JSON uses JSON-based backends and ai-template-* GitHub repositories. These are legacy templates maintained for backward compatibility only.
            </p>
          </div>
        )}
      </div>

      {/* Provisioning Steps */}
      <div className="infrastructure-setup__provisioning">
        <h3 className="provisioning__title">PROVISIONING STEPS</h3>

        {/* Step 1: Create GitHub Repository */}
        <div className={`provisioning-step ${!steps.step1.enabled ? 'provisioning-step--disabled' : ''}`}>
          <div className="provisioning-step__header">
            <div className="provisioning-step__header-left">
              <input
                type="checkbox"
                className="provisioning-step__checkbox"
                checked={steps.step1.enabled}
                onChange={() => handleStepToggle('step1')}
                aria-label="Enable Create GitHub Repository step"
              />
              <div className="provisioning-step__title-group">
                <h4 className="provisioning-step__title">Create GitHub Repository</h4>
                <div className="provisioning-step__preview">
                  Repo: <span className="provisioning-step__preview-value">{repoName}</span>
                  {pageType === 'template' && templateDisplayName && (
                    <>
                      {' • '}Template: <span className="provisioning-step__preview-value">{templateDisplayName}</span>
                      {' • '}From: <span className="provisioning-step__preview-value">{templateToGithubRepo}</span>
                    </>
                  )}
                  {pageType === 'template-json' && templateDisplayName && (
                    <>
                      {' • '}Template: <span className="provisioning-step__preview-value">{templateDisplayName} (JSON)</span>
                      {' • '}From: <span className="provisioning-step__preview-value">{templateToGithubRepo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="provisioning-step__expand-btn"
              onClick={() => handleDetailsToggle('step1')}
              aria-label={steps.step1.detailsExpanded ? 'Collapse details' : 'Expand details'}
              disabled={!steps.step1.enabled}
            >
              {steps.step1.detailsExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {steps.step1.detailsExpanded && steps.step1.enabled && (
            <div className="provisioning-step__content">
              <GitHubRepoCreator
                onRepoCreated={() => {}}
                initialTemplateRepo={templateToGithubRepo}
              />
            </div>
          )}
        </div>

        {/* Step 2: Provision AWS Resources */}
        <div className={`provisioning-step ${!steps.step2.enabled ? 'provisioning-step--disabled' : ''}`}>
          <div className="provisioning-step__header">
            <div className="provisioning-step__header-left">
              <input
                type="checkbox"
                className="provisioning-step__checkbox"
                checked={steps.step2.enabled}
                onChange={() => handleStepToggle('step2')}
                aria-label="Enable Provision AWS Resources step"
              />
              <div className="provisioning-step__title-group">
                <h4 className="provisioning-step__title">Provision AWS Resources</h4>
                <div className="provisioning-step__preview">
                  S3: <span className="provisioning-step__preview-value">{s3Bucket}</span>
                  {' • '}CloudFront: <span className="provisioning-step__preview-value">{cloudFrontPath}</span>
                  {' • '}Pipeline: <span className="provisioning-step__preview-value">{generatedPipelineName}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="provisioning-step__expand-btn"
              onClick={() => handleDetailsToggle('step2')}
              aria-label={steps.step2.detailsExpanded ? 'Collapse details' : 'Expand details'}
              disabled={!steps.step2.enabled}
            >
              {steps.step2.detailsExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {steps.step2.detailsExpanded && steps.step2.enabled && (
            <div className="provisioning-step__content">
              <EnhancedProvisionSection onProvisioningComplete={setProvisioningData} />
            </div>
          )}
        </div>

        {/* Step 3: Setup API Subdomain & Backend */}
        <div className={`provisioning-step ${!steps.step3.enabled ? 'provisioning-step--disabled' : ''}`}>
          <div className="provisioning-step__header">
            <div className="provisioning-step__header-left">
              <input
                type="checkbox"
                className="provisioning-step__checkbox"
                checked={steps.step3.enabled}
                onChange={() => handleStepToggle('step3')}
                aria-label="Enable Setup API Subdomain & Backend step"
              />
              <div className="provisioning-step__title-group">
                <h4 className="provisioning-step__title">Setup API Subdomain & Backend</h4>
                <div className="provisioning-step__preview">
                  API: <span className="provisioning-step__preview-value">{apiSubdomain}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="provisioning-step__expand-btn"
              onClick={() => handleDetailsToggle('step3')}
              aria-label={steps.step3.detailsExpanded ? 'Collapse details' : 'Expand details'}
              disabled={!steps.step3.enabled}
            >
              {steps.step3.detailsExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {steps.step3.detailsExpanded && steps.step3.enabled && (
            <div className="provisioning-step__content">
              <CopyToTemplatesSection />
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="infrastructure-setup__action-bar">
        <div className="action-bar__info">
          <div className="action-bar__info-item">
            <strong>Ready to provision</strong>
          </div>
          <div className="action-bar__info-item">
            {enabledStepsCount} {enabledStepsCount === 1 ? 'step' : 'steps'} selected
          </div>
        </div>
        <div className="action-bar__buttons">
          <button
            type="button"
            className="action-bar__button action-bar__button--primary"
            onClick={handleProvision}
            disabled={!domainName || domainName.trim() === '' || enabledStepsCount === 0}
          >
            Provision Infrastructure
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureSetup;
