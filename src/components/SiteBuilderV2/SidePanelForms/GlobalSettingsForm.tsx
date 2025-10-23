import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import useCheckGithubRepo from '../../../hooks/useCheckGithubRepo';
import useCreateGithubRepoFromTemplate from '../../../hooks/useCreateGithubRepoFromTemplate';
import useUpdateGithubRepoFile from '../../../hooks/useUpdateGithubRepoFile';
import useUpdateGithubRepoFileUpload from '../../../hooks/useUpdateGithubRepoFileUpload';
import useCreateS3Bucket from '../../../hooks/useCreateS3Bucket';
import useCreateCodePipeline from '../../../hooks/useCreateCodePipeline';
import useCreateDistribution from '../../../hooks/useCreateDistribution';
import useCreatePleskSubscription from '../../../hooks/useCreatePleskSubscription';
import BuildProgressModal from '../BuildProgressModal';
import './SidePanelForms.sass';

interface BuildStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  errorMessage?: string;
}

const GlobalSettingsForm: React.FC = () => {
  const { data, updateData } = useLandingPage();
  const [activeStep, setActiveStep] = useState(1);
  const [faviconFile, setFaviconFile] = useState<string>('');
  const [domain, setDomain] = useState<string>(data['global-data']?.domain || 'example-ortho.com');
  const [domainError, setDomainError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([
    { id: 'create', label: 'Creating GitHub repository', status: 'pending' },
    { id: 'upload', label: 'Uploading content', status: 'pending' },
    { id: 'provision', label: 'Provisioning AWS infrastructure', status: 'pending' },
    { id: 'plesk', label: 'Creating Plesk subscription', status: 'pending' },
  ]);
  
  const { mutateAsync: checkGithubRepo } = useCheckGithubRepo();
  const { mutateAsync: createS3Bucket } = useCreateS3Bucket();
  const { mutateAsync: createCodePipeline } = useCreateCodePipeline();
  const { mutateAsync: createDistribution } = useCreateDistribution();
  const [, , , , , , createPleskSubscription] = useCreatePleskSubscription();
  const [, , createRepo] = useCreateGithubRepoFromTemplate();
  const [, , updateTextFile] = useUpdateGithubRepoFile();
  const [, , uploadBinaryFile] = useUpdateGithubRepoFileUpload();

  const updateStepStatus = (stepId: string, status: BuildStep['status'], errorMessage?: string) => {
    setBuildSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, status, errorMessage } : step
      )
    );
  };

  // Helper function to strip TLD from domain for repo/bucket naming
  const stripDomainTLD = (domainName: string): string => {
    // Remove common TLDs
    return domainName.replace(/\.(com|net|org|ca|co\.uk|io|dev|app|info|biz|us|uk|au)$/i, '');
  };

  // Helper to extract error message from various error types
  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'An unknown error occurred';
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFaviconFile(file.name);
        updateData('seo.favicon', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to convert base64 to File
  const base64ToFile = (base64String: string, filename: string): File => {
    // Remove data URL prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);
    
    return new File([blob], filename, { type: blob.type });
  };

  const handleBuildLandingPage = async () => {
    // Clear any previous errors
    setDomainError('');
    setIsComplete(false);
    setRepoUrl('');

    // Validate domain is not empty
    if (!domain || domain.trim() === '') {
      setDomainError('Domain is required');
      return;
    }

      // Strip TLD from domain for repo/bucket naming
      const domainWithoutTLD = stripDomainTLD(domain.trim());
      const repoName = `${domainWithoutTLD}-landing`;

      try {
        // Pre-check: Check if repo exists BEFORE opening modal
        console.log('🔍 Pre-check: Checking for GitHub repo:', { 
          owner: 'roostergrin', 
          repo: repoName,
          originalDomain: domain,
          strippedDomain: domainWithoutTLD
        });
      
      const checkResult = await checkGithubRepo({
        owner: 'roostergrin',
        repo: repoName,
      });

      console.log('✅ GitHub repo check result:', checkResult);

      // Check for authentication or other errors in the message
      if (checkResult.message && (
        checkResult.message.includes('authentication') || 
        checkResult.message.includes('failed') ||
        checkResult.message.includes('error')
      )) {
        console.log('❌ GitHub API error:', checkResult.message);
        setDomainError(checkResult.message);
        return;
      }

      if (checkResult.exists) {
        console.log('❌ Repository already exists');
        setDomainError(`A GitHub repository already exists for this domain: ${repoName}`);
        return;
      }

      // Repo doesn't exist, proceed with build
      console.log('✅ Repository check passed, starting build...');

      // Reset all steps to pending
      setBuildSteps([
        { id: 'create', label: 'Creating GitHub repository', status: 'pending' },
        { id: 'upload', label: 'Uploading content', status: 'pending' },
        { id: 'provision', label: 'Provisioning AWS infrastructure', status: 'pending' },
        { id: 'plesk', label: 'Creating Plesk subscription', status: 'pending' },
      ]);

      // Now open modal
      setIsModalOpen(true);

      // Variable to store distribution result for use in final success message
      let distributionResult: any;

      // Step 1: Create GitHub repo
      console.log('🏗️ Step 1: Creating GitHub repository...');
      updateStepStatus('create', 'in-progress');
      
      try {
        const repoResult = await createRepo({
          new_name: repoName,
          template_repo: 'nuxt3-landing-automation',
        });
        
        console.log('✅ Repository created:', repoResult);
        updateStepStatus('create', 'completed');

        // Wait a moment for GitHub to fully initialize the repo from template
        console.log('⏳ Waiting for repository initialization...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        console.error('❌ Failed to create repository:', errorMsg);
        updateStepStatus('create', 'error', errorMsg);
        throw error;
      }

      // Step 2: Upload all content
      console.log('📄 Step 2: Uploading content...');
      updateStepStatus('upload', 'in-progress');
      
      try {
        // Create a copy of data and update logo to just "logo" instead of base64
        const dataForJson = {
          ...data,
          'global-data': {
            ...data['global-data'],
            logo: data['global-data'].logo ? 'logo' : ''
          }
        };
        
        const jsonContent = JSON.stringify(dataForJson, null, 2);
        
        await updateTextFile({
          owner: 'roostergrin',
          repo: repoName,
          path: 'content-data.json',
          content: jsonContent,
          message: 'Update content-data.json',
          branch: 'main',
        });
        
        console.log('✅ content-data.json uploaded');

        // Upload favicon if exists
        if (data.seo.favicon) {
          console.log('🎨 Uploading favicon...');
          
          const faviconFile = base64ToFile(data.seo.favicon, 'favicon.ico');
          await uploadBinaryFile({
            owner: 'roostergrin',
            repo: repoName,
            path: 'public/favicon.ico',
            upload_file: faviconFile,
            message: 'Update favicon',
            branch: 'main',
          });
          
          console.log('✅ Favicon uploaded');
        } else {
          console.log('⏭️ No favicon to upload, skipping');
        }

        // Upload logo if exists
        if (data['global-data'].logo) {
          console.log('🖼️ Uploading logo...');
          
          // Determine file extension from base64 data
          const logoBase64 = data['global-data'].logo;
          
          const logoPath = 'assets/icons/logo.svg';
          const logoFile = base64ToFile(logoBase64, 'logo.svg');
          
          await uploadBinaryFile({
            owner: 'roostergrin',
            repo: repoName,
            path: logoPath,
            upload_file: logoFile,
            message: 'Update logo',
            branch: 'main',
          });
          
          console.log('✅ Logo uploaded');
        } else {
          console.log('⏭️ No logo to upload, skipping');
        }

        // Mark upload step as completed
        updateStepStatus('upload', 'completed');
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        console.error('❌ Failed to upload content:', errorMsg);
        updateStepStatus('upload', 'error', errorMsg);
        throw error;
      }

      // Step 3: Provision AWS Infrastructure
      console.log('☁️ Step 3: Provisioning AWS infrastructure...');
      updateStepStatus('provision', 'in-progress');
      
      try {
        // 3a: Create S3 Bucket
        console.log('🪣 Creating S3 bucket...');
        const bucketResult = await createS3Bucket({
          bucket_name: repoName,
        });
        console.log('✅ S3 bucket created:', bucketResult);
        
        // 3b: Create CloudFront Distribution (needs to be created before CodePipeline)
        console.log('🌐 Creating CloudFront distribution...');
        distributionResult = await createDistribution({
          s3_bucket_name: repoName,
          distribution_type: '/landing',
        });
        console.log('✅ CloudFront distribution created:', distributionResult);
        
        // 3c: Create CodePipeline (needs distribution_id from step 3b)
        console.log('🔄 Creating CodePipeline...');
        const pipelineResult = await createCodePipeline({
          pipeline_name: repoName,
          bucket_name: repoName,
          github_owner: 'roostergrin',
          github_repo: repoName,
          distribution_id: distributionResult.distribution_id || '',
          distribution_type: '/landing',
        });
        console.log('✅ CodePipeline created:', pipelineResult);
        
        updateStepStatus('provision', 'completed');
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        console.error('❌ Failed to provision AWS infrastructure:', errorMsg);
        updateStepStatus('provision', 'error', errorMsg);
        throw error;
      }

      // Step 4: Create Plesk Subscription
      console.log('🌐 Step 4: Creating Plesk subscription...');
      updateStepStatus('plesk', 'in-progress');
      
      try {
        const pleskResult = await createPleskSubscription({
          plesk_ip: 'uluwatu',
          domain: domain.trim(), // Use full domain with TLD for Plesk
        });
        
        console.log('✅ Plesk subscription created:', pleskResult);
        console.log('✅ Plesk result success field:', pleskResult.success);
        console.log('✅ Plesk result message:', pleskResult.message);
        
        // Check if the subscription was actually successful
        if (pleskResult.success !== false) {
          updateStepStatus('plesk', 'completed');
        } else {
          throw new Error(pleskResult.message || 'Failed to create Plesk subscription');
        }
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        console.error('❌ Failed to create Plesk subscription:', errorMsg);
        console.error('❌ Full error object:', error);
        updateStepStatus('plesk', 'error', errorMsg);
        throw error;
      }

      // Success!
      console.log('🎉 Landing page built successfully!');
      
      // Set the CloudFront URL as the primary link
      const siteUrl = distributionResult.distribution_url || `https://github.com/roostergrin/${repoName}`;
      setRepoUrl(siteUrl);
      setIsComplete(true);
      
    } catch (error) {
      console.error('❌ Error building landing page:', error);
      const errorMessage = extractErrorMessage(error);
      
      // Only set domain error if it's not a success message from Plesk
      if (!errorMessage.toLowerCase().includes('subscription created')) {
        setDomainError(errorMessage);
      }
      // Note: Individual step errors are already handled in their respective try-catch blocks
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDomain = e.target.value;
    setDomain(newDomain);
    // Also update in the data object so it's included in the JSON
    updateData('global-data.domain', newDomain);
    // Clear error when user starts typing
    if (domainError) {
      setDomainError('');
    }
  };

  return (
    <div className="side-panel-form">
      
      <div className="side-panel-form__steps">
        <button 
          className={`side-panel-form__step ${activeStep === 1 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(1)}
        >
          <span className="side-panel-form__step-number">1</span>
          <span className="side-panel-form__step-label">Site Info</span>
        </button>
        <button 
          className={`side-panel-form__step ${activeStep === 2 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(2)}
        >
          <span className="side-panel-form__step-number">2</span>
          <span className="side-panel-form__step-label">SEO</span>
        </button>
        <button 
          className={`side-panel-form__step ${activeStep === 3 ? 'side-panel-form__step--active' : ''}`}
          onClick={() => setActiveStep(3)}
        >
          <span className="side-panel-form__step-number">3</span>
          <span className="side-panel-form__step-label">Theme Colors</span>
        </button>
      </div>
      
      {activeStep === 1 && (
        <>
          <div className="side-panel-form__section">
            <h2 className="side-panel-form__title">Site Information</h2>

            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Domain</label>
              <span className="side-panel-form__hint">Enter your domain name without the www</span>
              <input
                type="text"
                className={`side-panel-form__input ${domainError ? 'side-panel-form__input--error' : ''}`}
                value={domain}
                onChange={handleDomainChange}
                aria-invalid={!!domainError}
                aria-describedby={domainError ? 'domain-error' : undefined}
              />
              {domainError && (
                <span id="domain-error" className="side-panel-form__error-message" role="alert">
                  {domainError}
                </span>
              )}
            </div>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Company Name</label>
              <input
                type="text"
                className="side-panel-form__input"
                value={data['global-data'].title}
                onChange={(e) => updateData('global-data.title', e.target.value)}
              />
            </div>

            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Email</label>
              <input
                type="email"
                className="side-panel-form__input"
                value={data['global-data'].email.label}
                onChange={(e) => {
                  updateData('global-data.email.label', e.target.value);
                  updateData('global-data.email.href', `mailto:${e.target.value}`);
                }}
              />
            </div>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Phone</label>
              <input
                type="tel"
                className="side-panel-form__input"
                value={data['global-data'].phone.label}
                onChange={(e) => {
                  updateData('global-data.phone.label', e.target.value);
                  const cleanPhone = e.target.value.replace(/\D/g, '');
                  updateData('global-data.phone.href', `tel:+1${cleanPhone}`);
                }}
              />
            </div>
            
            <div className="side-panel-form__field">
              <label className="side-panel-form__label">Address</label>
              <textarea
                className="side-panel-form__textarea"
                value={data['global-data'].address.label.replace(/<br>/g, '\n')}
                onChange={(e) => {
                  const labelWithBr = e.target.value.replace(/\n/g, '<br>');
                  updateData('global-data.address.label', labelWithBr);
                  const cleanAddress = e.target.value.replace(/\n/g, '+');
                  updateData('global-data.address.href', `https://maps.google.com/?q=${cleanAddress}`);
                }}
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      {activeStep === 2 && (
        <>
          
      <div className="side-panel-form__section">
        <h2 className="side-panel-form__title">SEO Settings</h2>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Page Title</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.seo.title}
            onChange={(e) => updateData('seo.title', e.target.value)}
          />
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Meta Description</label>
          <textarea
            className="side-panel-form__textarea"
            value={data.seo.description}
            onChange={(e) => updateData('seo.description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="side-panel-form__field">
          <label className="side-panel-form__label">Favicon</label>
          <div className="side-panel-form__file-upload">
            <input
              type="file"
              id="favicon-upload"
              className="side-panel-form__file-input"
              accept="image/x-icon"
              onChange={handleFaviconUpload}
            />
            <label htmlFor="favicon-upload" className="side-panel-form__file-label">
              <span className="side-panel-form__file-icon">🌐</span>
              <span className="side-panel-form__file-text">
                {faviconFile || data.seo.favicon ? (faviconFile || 'Favicon uploaded') : 'Choose favicon file'}
              </span>
            </label>
            {(faviconFile || data.seo.favicon) && (
              <button 
                className="side-panel-form__file-clear"
                onClick={() => {
                  setFaviconFile('');
                  updateData('seo.favicon', '');
                }}
              >
                ✕
              </button>
            )}
          </div>
          <span className="side-panel-form__hint">Upload .ico</span>
        </div>
        
        <div className="side-panel-form__field">
          <label className="side-panel-form__label">GTM ID (Optional)</label>
          <input
            type="text"
            className="side-panel-form__input"
            value={data.seo.gtmId || ''}
            onChange={(e) => updateData('seo.gtmId', e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
        </div>
      </div>
        </>
      )}

      {activeStep === 3 && (
        <>
          <div className="side-panel-form__section">
            <h2 className="side-panel-form__title">Theme Colors</h2>
        
        <div className="side-panel-form__color-grid">
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Primary Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.primary}
                onChange={(e) => updateData('theme.colors.primary', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.primary}
                onChange={(e) => updateData('theme.colors.primary', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Secondary Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.secondary}
                onChange={(e) => updateData('theme.colors.secondary', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.secondary}
                onChange={(e) => updateData('theme.colors.secondary', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Header Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.header}
                onChange={(e) => updateData('theme.colors.header', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.header}
                onChange={(e) => updateData('theme.colors.header', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Text Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.text}
                onChange={(e) => updateData('theme.colors.text', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.text}
                onChange={(e) => updateData('theme.colors.text', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Button Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.button}
                onChange={(e) => updateData('theme.colors.button', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.button}
                onChange={(e) => updateData('theme.colors.button', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Button Hover Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.hover}
                onChange={(e) => updateData('theme.colors.hover', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.hover}
                onChange={(e) => updateData('theme.colors.hover', e.target.value)}
              />
            </div>
          </div>
          
          <div className="side-panel-form__field">
            <label className="side-panel-form__label">Background Color</label>
            <div className="side-panel-form__color-input">
              <input
                type="color"
                value={data.theme.colors.background}
                onChange={(e) => updateData('theme.colors.background', e.target.value)}
              />
              <input
                type="text"
                className="side-panel-form__input side-panel-form__input--small"
                value={data.theme.colors.background}
                onChange={(e) => updateData('theme.colors.background', e.target.value)}
              />
            </div>
          </div>
          
        </div>
      </div>
        </>
      )}
      
      <div className="side-panel-form__section">
        <button 
          className="side-panel-form__export-btn"
          onClick={handleBuildLandingPage}
          disabled={isModalOpen && !isComplete}
        >
          Build Landing Page
        </button>
      </div>

      <BuildProgressModal
        isOpen={isModalOpen}
        steps={buildSteps}
        isComplete={isComplete}
        repoUrl={repoUrl}
        domain={domain}
        distributionUrl={repoUrl?.replace('https://', '')}
        onClose={() => {
          setIsModalOpen(false);
          // Clear domain error if build was successful
          if (isComplete) {
            setDomainError('');
          }
        }}
      />
    </div>
  );
};

export default GlobalSettingsForm;

