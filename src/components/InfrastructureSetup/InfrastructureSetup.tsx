import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import GitHubRepoCreator, { GitHubRepoCreatorRef } from '../WorkflowManager/GitHubRepoCreator';
import EnhancedProvisionSection, { EnhancedProvisionSectionRef } from '../WorkflowManager/EnhancedProvisionSection';
import CopyToTemplatesSection, { CopyToTemplatesSectionRef } from '../WorkflowManager/CopyToTemplatesSection';
import { useGithubRepo } from '../../context/GithubRepoContext';
import './InfrastructureSetup.sass';

type PageType = 'template' | 'template-json';
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

interface StepSuccessData {
  [key: string]: any;
}

interface StepsState {
  [key: string]: {
    enabled: boolean;
    detailsExpanded: boolean;
    completed: boolean;
    status: 'idle' | 'queued' | 'pending' | 'success' | 'error';
    successData?: any;
  };
}

const InfrastructureSetup: React.FC = () => {
  const { state, actions } = useGithubRepo();
  const { setGithubRepo, setPageType: setContextPageType } = actions;

  const [domainName, setDomainName] = useState('');
  const [pageType, setPageType] = useState<PageType>('template');
  const [templateBoilerplate, setTemplateBoilerplate] = useState<TemplateBoilerplate>('stinson');
  const [templateJSONBoilerplate, setTemplateJSONBoilerplate] = useState<TemplateJSONBoilerplate>('');
  const [provisioningData, setProvisioningData] = useState<any>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [steps, setSteps] = useState<StepsState>({
    step1: { enabled: true, detailsExpanded: false, completed: false, status: 'idle' },
    step2: { enabled: true, detailsExpanded: false, completed: false, status: 'idle' },
    step3: { enabled: true, detailsExpanded: false, completed: false, status: 'idle' },
  });

  // Create refs for child components
  const step1Ref = useRef<GitHubRepoCreatorRef>(null);
  const step2Ref = useRef<EnhancedProvisionSectionRef>(null);
  const step3Ref = useRef<CopyToTemplatesSectionRef>(null);

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
    return `dist.${domainName}`;
  }, [domainName]);

  // CloudFront path for display
  const cloudFrontPath = useMemo(() => {
    return '/dist';
  }, []);

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

  // New API subdomain that will be created
  const newApiSubdomain = useMemo(() => {
    if (baseDomain) {
      return `api-${baseDomain}.roostergrintemplates.com`;
    }
    return '';
  }, [baseDomain]);

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

  const handleStepStatus = (stepKey: string, status: 'idle' | 'queued' | 'pending' | 'success' | 'error') => {
    setSteps(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        status,
      }
    }));
  };

  const handleStepSuccess = (stepKey: string, data: any) => {
    console.log(`Step ${stepKey} completed successfully:`, data);
    setSteps(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        completed: true,
        status: 'success',
        successData: data,
      }
    }));
  };

  const handleStep1Success = useCallback((data: any) => {
    handleStepSuccess('step1', {
      type: 'GitHub Repository',
      repository: data.repo || repoName,
      owner: data.owner || 'roostergrin',
      url: data.url || `https://github.com/${data.owner || 'roostergrin'}/${data.repo || repoName}`,
      template: templateToGithubRepo,
      apiJsUpdated: data.apiJsUpdated || false,
      apiUrl: data.apiUrl,
      siteUrl: data.siteUrl,
    });
  }, [repoName, templateToGithubRepo]);

  const handleStep2Success = useCallback((data: any) => {
    handleStepSuccess('step2', {
      type: 'AWS Resources',
      s3Bucket: data.s3Bucket || data.bucketName || s3Bucket,
      cloudFrontDomain: data.cloudFrontDomain || cloudFrontDomain,
      cloudFrontUrl: data.cloudfront_distribution_url,
      assetsUrl: data.assets_distribution_url,
      pipeline: data.pipeline || generatedPipelineName,
      region: data.region || 'us-east-1',
    });
  }, [s3Bucket, cloudFrontDomain, generatedPipelineName]);

  const handleStep3Success = useCallback((data: any) => {
    handleStepSuccess('step3', {
      type: 'API Subdomain & Backend',
      sourceSubdomain: data.sourceDomain || apiSubdomain,
      newSubdomain: data.apiSubdomain || `api-${baseDomain}.roostergrintemplates.com`,
      targetDomain: data.targetDomain || domainName,
      sslCertificate: data.sslCertificate || 'ACM Certificate Created',
      dnsConfiguration: data.dnsConfiguration || '*.roostergrintemplates.com wildcard already set!',
    });
  }, [apiSubdomain, baseDomain, domainName]);

  const enabledStepsCount = useMemo(() => {
    return Object.values(steps).filter(step => step.enabled).length;
  }, [steps]);

  const handleProvision = async () => {
    console.log('Provision Infrastructure clicked');
    setIsProvisioning(true);

    // Scroll to provisioning steps section
    setTimeout(() => {
      const provisioningSection = document.querySelector('.infrastructure-setup__provisioning');
      if (provisioningSection) {
        provisioningSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      // Start Step 1 (GitHub) and Step 3 (API Subdomain) in parallel
      const parallelTasks: Promise<void>[] = [];

      // Set step 2 to queued if it's enabled (it will run after steps 1 and 3)
      if (steps.step2.enabled) {
        handleStepStatus('step2', 'queued');
      }

      if (steps.step1.enabled && step1Ref.current) {
        console.log('Triggering Step 1: Create GitHub Repository');
        handleStepStatus('step1', 'pending');
        parallelTasks.push(
          step1Ref.current.triggerCreateRepo().catch((error) => {
            console.error('Step 1 failed:', error);
            handleStepStatus('step1', 'error');
            throw error;
          })
        );
      }

      if (steps.step3.enabled && step3Ref.current) {
        console.log('Triggering Step 3: Copy Subscription (in parallel with Step 1)');
        handleStepStatus('step3', 'pending');
        parallelTasks.push(
          step3Ref.current.triggerCopy().catch((error) => {
            console.error('Step 3 failed:', error);
            handleStepStatus('step3', 'error');
            throw error;
          })
        );
      }

      // Wait for BOTH Step 1 and Step 3 to complete
      if (parallelTasks.length > 0) {
        await Promise.all(parallelTasks);
        console.log('Steps 1 and 3 completed, now starting Step 2');
      }

      // Execute Step 2 (AWS Resources) AFTER both Step 1 and Step 3 complete
      if (steps.step2.enabled && step2Ref.current) {
        console.log('Triggering Step 2: Provision AWS Resources');
        handleStepStatus('step2', 'pending');
        try {
          await step2Ref.current.triggerProvision();
        } catch (error) {
          console.error('Step 2 failed:', error);
          handleStepStatus('step2', 'error');
          throw error;
        }
      }

      console.log('All enabled provisioning steps completed successfully');
    } catch (error) {
      console.error('Error during provisioning:', error);
    } finally {
      setIsProvisioning(false);
    }
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
        <div className={`provisioning-step ${!steps.step1.enabled ? 'provisioning-step--disabled' : ''} ${steps.step1.completed ? 'provisioning-step--completed' : ''}`}>
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
                <h4 className="provisioning-step__title">
                  Create GitHub Repository
                  {steps.step1.completed && <span className="step-completed-badge">✓ Completed</span>}
                </h4>
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
            <div className="provisioning-step__header-right">
              {steps.step1.status === 'pending' && (
                <Loader2 className="provisioning-step__status-icon provisioning-step__status-icon--pending" size={20} />
              )}
              {steps.step1.status === 'success' && (
                <CheckCircle2 className="provisioning-step__status-icon provisioning-step__status-icon--success" size={20} />
              )}
              {steps.step1.status === 'error' && (
                <AlertCircle className="provisioning-step__status-icon provisioning-step__status-icon--error" size={20} />
              )}
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
          </div>

          {steps.step1.enabled && (
            <>
              {!steps.step1.completed && (
                <div className="provisioning-step__content" style={{ display: steps.step1.detailsExpanded ? 'block' : 'none' }}>
                  <GitHubRepoCreator
                    ref={step1Ref}
                    onRepoCreated={handleStep1Success}
                    initialTemplateRepo={templateToGithubRepo}
                    apiUrl={newApiSubdomain}
                    siteUrl={domainName}
                  />
                </div>
              )}
              {steps.step1.completed && (
                <div className="provisioning-step__content">
                  <div className="provisioning-step__success">
                    <div className="success-icon">✓</div>
                    <div className="success-content">
                      <h4 className="success-title">{steps.step1.successData?.type} Created Successfully!</h4>
                      <div className="success-details">
                        <div className="success-detail-item">
                          <strong>Repository:</strong> {steps.step1.successData?.repository}
                        </div>
                        <div className="success-detail-item">
                          <strong>Owner:</strong> {steps.step1.successData?.owner}
                        </div>
                        <div className="success-detail-item">
                          <strong>Template:</strong> {steps.step1.successData?.template}
                        </div>
                        <div className="success-detail-item">
                          <strong>URL:</strong>{' '}
                          <a href={steps.step1.successData?.url} target="_blank" rel="noopener noreferrer">
                            {steps.step1.successData?.url}
                          </a>
                        </div>
                        {steps.step1.successData?.apiJsUpdated && (
                          <>
                            <div className="success-detail-item">
                              <strong>✓ API Configuration Updated (resources/api.js)</strong>
                            </div>
                            <div className="success-detail-item" style={{ marginLeft: '20px' }}>
                              api: https://{steps.step1.successData?.apiUrl}/wp-json
                            </div>
                            <div className="success-detail-item" style={{ marginLeft: '20px' }}>
                              url: https://www.{steps.step1.successData?.siteUrl}/
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 2: Provision AWS Resources */}
        <div className={`provisioning-step ${!steps.step2.enabled ? 'provisioning-step--disabled' : ''} ${steps.step2.completed ? 'provisioning-step--completed' : ''}`}>
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
                <h4 className="provisioning-step__title">
                  Provision AWS Resources
                  {steps.step2.completed && <span className="step-completed-badge">✓ Completed</span>}
                </h4>
                <div className="provisioning-step__preview">
                  S3: <span className="provisioning-step__preview-value">{s3Bucket}</span>
                  {' • '}CloudFront: <span className="provisioning-step__preview-value">{cloudFrontPath}</span>
                  {' • '}Pipeline: <span className="provisioning-step__preview-value">{generatedPipelineName}</span>
                </div>
              </div>
            </div>
            <div className="provisioning-step__header-right">
              {steps.step2.status === 'queued' && (
                <Clock className="provisioning-step__status-icon provisioning-step__status-icon--queued" size={20} />
              )}
              {steps.step2.status === 'pending' && (
                <Loader2 className="provisioning-step__status-icon provisioning-step__status-icon--pending" size={20} />
              )}
              {steps.step2.status === 'success' && (
                <CheckCircle2 className="provisioning-step__status-icon provisioning-step__status-icon--success" size={20} />
              )}
              {steps.step2.status === 'error' && (
                <AlertCircle className="provisioning-step__status-icon provisioning-step__status-icon--error" size={20} />
              )}
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
          </div>

          {steps.step2.enabled && (
            <>
              {!steps.step2.completed && (
                <div className="provisioning-step__content" style={{ display: steps.step2.detailsExpanded ? 'block' : 'none' }}>
                  <EnhancedProvisionSection
                    ref={step2Ref}
                    onProvisioningComplete={handleStep2Success}
                    domainName={domainName}
                  />
                </div>
              )}
              {steps.step2.completed && (
                <div className="provisioning-step__content">
                  <div className="provisioning-step__success">
                    <div className="success-icon">✓</div>
                    <div className="success-content">
                      <h4 className="success-title">{steps.step2.successData?.type} Provisioned Successfully!</h4>
                      <div className="success-details">
                        <div className="success-detail-item">
                          <strong>S3 Bucket:</strong> {steps.step2.successData?.s3Bucket}
                        </div>
                        {steps.step2.successData?.cloudFrontUrl && (
                          <div className="success-detail-item">
                            <strong>CloudFront Distribution:</strong>{' '}
                            <a
                              href={steps.step2.successData.cloudFrontUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {steps.step2.successData.cloudFrontUrl}
                            </a>
                          </div>
                        )}
                        {steps.step2.successData?.assetsUrl && (
                          <div className="success-detail-item">
                            <strong>Assets URL:</strong>{' '}
                            <a
                              href={steps.step2.successData.assetsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {steps.step2.successData.assetsUrl}
                            </a>
                          </div>
                        )}
                        <div className="success-detail-item">
                          <strong>Pipeline:</strong> {steps.step2.successData?.pipeline}
                        </div>
                        <div className="success-detail-item">
                          <strong>Region:</strong> {steps.step2.successData?.region}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 3: Setup API Subdomain & Backend */}
        <div className={`provisioning-step ${!steps.step3.enabled ? 'provisioning-step--disabled' : ''} ${steps.step3.completed ? 'provisioning-step--completed' : ''}`}>
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
                <h4 className="provisioning-step__title">
                  Setup API Subdomain & Backend
                  {steps.step3.completed && <span className="step-completed-badge">✓ Completed</span>}
                </h4>
                <div className="provisioning-step__preview">
                  Source: <span className="provisioning-step__preview-value">{apiSubdomain}</span>
                  {newApiSubdomain && (
                    <>
                      {' • '}New: <span className="provisioning-step__preview-value">{newApiSubdomain}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="provisioning-step__header-right">
              {steps.step3.status === 'pending' && (
                <Loader2 className="provisioning-step__status-icon provisioning-step__status-icon--pending" size={20} />
              )}
              {steps.step3.status === 'success' && (
                <CheckCircle2 className="provisioning-step__status-icon provisioning-step__status-icon--success" size={20} />
              )}
              {steps.step3.status === 'error' && (
                <AlertCircle className="provisioning-step__status-icon provisioning-step__status-icon--error" size={20} />
              )}
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
          </div>

          {steps.step3.enabled && (
            <>
              {!steps.step3.completed && (
                <div className="provisioning-step__content" style={{ display: steps.step3.detailsExpanded ? 'block' : 'none' }}>
                  <CopyToTemplatesSection
                    ref={step3Ref}
                    initialSourceDomain={apiSubdomain}
                    initialTargetDomain={domainName}
                    onCopied={handleStep3Success}
                  />
                </div>
              )}
              {steps.step3.completed && (
                <div className="provisioning-step__content">
                  <div className="provisioning-step__success">
                    <div className="success-icon">✓</div>
                    <div className="success-content">
                      <h4 className="success-title">{steps.step3.successData?.type} Configured Successfully!</h4>
                      <div className="success-details">
                        <div className="success-detail-item">
                          <strong>Source Subdomain:</strong> {steps.step3.successData?.sourceSubdomain}
                        </div>
                        <div className="success-detail-item">
                          <strong>New Subdomain Created:</strong> {steps.step3.successData?.newSubdomain}
                        </div>
                        <div className="success-detail-item">
                          <strong>Target Domain:</strong> {steps.step3.successData?.targetDomain}
                        </div>
                        <div className="success-detail-item">
                          <strong>SSL Certificate:</strong> {steps.step3.successData?.sslCertificate}
                        </div>
                        <div className="success-detail-item">
                          <strong>DNS Configuration:</strong> {steps.step3.successData?.dnsConfiguration}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="infrastructure-setup__action-bar">
        <div className="action-bar__info">
          <div className="action-bar__info-item">
            <strong>{isProvisioning ? 'Provisioning...' : 'Ready to provision'}</strong>
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
            disabled={!domainName || domainName.trim() === '' || enabledStepsCount === 0 || isProvisioning}
          >
            {isProvisioning ? 'Provisioning...' : 'Provision Infrastructure'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureSetup;
