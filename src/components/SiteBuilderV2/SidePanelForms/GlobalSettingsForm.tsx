import React, { useState } from 'react';
import { useLandingPage } from '../LandingPageContext';
import useCheckGithubRepo from '../../../hooks/useCheckGithubRepo';
import useCreateGithubRepoFromTemplate from '../../../hooks/useCreateGithubRepoFromTemplate';
import useUpdateGithubRepoFile from '../../../hooks/useUpdateGithubRepoFile';
import useUpdateGithubRepoFileUpload from '../../../hooks/useUpdateGithubRepoFileUpload';
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
  const [domain, setDomain] = useState<string>(data['global-data']?.domain || 'example-ortho');
  const [domainError, setDomainError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([
    { id: 'check', label: 'Checking if repository exists', status: 'pending' },
    { id: 'create', label: 'Creating GitHub repository', status: 'pending' },
    { id: 'content', label: 'Uploading content data', status: 'pending' },
    { id: 'favicon', label: 'Uploading favicon', status: 'pending' },
    { id: 'logo', label: 'Uploading logo', status: 'pending' },
  ]);
  
  const { mutateAsync: checkGithubRepo } = useCheckGithubRepo();
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

    // Reset all steps to pending
    setBuildSteps([
      { id: 'check', label: 'Checking if repository exists', status: 'pending' },
      { id: 'create', label: 'Creating GitHub repository', status: 'pending' },
      { id: 'content', label: 'Uploading content data', status: 'pending' },
      { id: 'favicon', label: 'Uploading favicon', status: 'pending' },
      { id: 'logo', label: 'Uploading logo', status: 'pending' },
    ]);

    // Validate domain is not empty
    if (!domain || domain.trim() === '') {
      setDomainError('Domain is required');
      return;
    }

    // Open modal
    setIsModalOpen(true);

    try {
      const repoName = `${domain}-landing`;
      
      // Step 1: Check if repo exists
      console.log('🔍 Step 1: Checking for GitHub repo:', { owner: 'roostergrin', repo: repoName });
      updateStepStatus('check', 'in-progress');
      
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
        updateStepStatus('check', 'error', checkResult.message);
        setDomainError(checkResult.message);
        return;
      }

      if (checkResult.exists) {
        console.log('❌ Repository already exists');
        const errorMsg = `Repository ${repoName} already exists`;
        updateStepStatus('check', 'error', errorMsg);
        setDomainError(`A GitHub repository already exists for this domain: ${repoName}`);
        return;
      }

      updateStepStatus('check', 'completed');

      // Step 2: Create GitHub repo
      console.log('🏗️ Step 2: Creating GitHub repository...');
      updateStepStatus('create', 'in-progress');
      
      const repoResult = await createRepo({
        new_name: repoName,
        template_repo: 'nuxt3-landing-automation',
      });
      
      console.log('✅ Repository created:', repoResult);
      updateStepStatus('create', 'completed');

      // Wait a moment for GitHub to fully initialize the repo from template
      console.log('⏳ Waiting for repository initialization...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Upload content-data.json
      console.log('📄 Step 3: Uploading content-data.json...');
      updateStepStatus('content', 'in-progress');
      
      const jsonContent = JSON.stringify(data, null, 2);
      
      await updateTextFile({
        owner: 'roostergrin',
        repo: repoName,
        path: 'content-data.json',
        content: jsonContent,
        message: 'Update content-data.json',
        branch: 'master',
      });
      
      console.log('✅ content-data.json uploaded');
      updateStepStatus('content', 'completed');

      // Step 4: Upload favicon if exists
      updateStepStatus('favicon', 'in-progress');
      if (data.seo.favicon) {
        console.log('🎨 Step 4: Uploading favicon...');
        
        const faviconFile = base64ToFile(data.seo.favicon, 'favicon.ico');
        await uploadBinaryFile({
          owner: 'roostergrin',
          repo: repoName,
          path: 'public/favicon.ico',
          upload_file: faviconFile,
          message: 'Update favicon',
          branch: 'master',
        });
        
        console.log('✅ Favicon uploaded');
        updateStepStatus('favicon', 'completed');
      } else {
        console.log('⏭️ No favicon to upload, skipping');
        updateStepStatus('favicon', 'completed');
      }

      // Step 5: Upload logo if exists
      updateStepStatus('logo', 'in-progress');
      if (data['global-data'].logo) {
        console.log('🖼️ Step 5: Uploading logo...');
        
        // Determine file extension from base64 data
        const logoBase64 = data['global-data'].logo;
        let logoExtension = 'png';
        if (logoBase64.includes('image/svg')) logoExtension = 'svg';
        else if (logoBase64.includes('image/jpeg') || logoBase64.includes('image/jpg')) logoExtension = 'jpg';
        
        const logoPath = `public/logo.${logoExtension}`;
        const logoFile = base64ToFile(logoBase64, `logo.${logoExtension}`);
        
        await uploadBinaryFile({
          owner: 'roostergrin',
          repo: repoName,
          path: logoPath,
          upload_file: logoFile,
          message: 'Update logo',
          branch: 'master',
        });
        
        console.log('✅ Logo uploaded');
        updateStepStatus('logo', 'completed');
      } else {
        console.log('⏭️ No logo to upload, skipping');
        updateStepStatus('logo', 'completed');
      }

      // Success!
      console.log('🎉 Landing page built successfully!');
      setRepoUrl(`https://github.com/roostergrin/${repoName}`);
      setIsComplete(true);
      
    } catch (error) {
      console.error('❌ Error building landing page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error building landing page';
      setDomainError(errorMessage);
      
      // Mark current in-progress step as error
      const inProgressStep = buildSteps.find(step => step.status === 'in-progress');
      if (inProgressStep) {
        updateStepStatus(inProgressStep.id, 'error', errorMessage);
      }
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
              <span className="side-panel-form__hint">Enter your domain name without the www. or .com</span>
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
              accept="image/x-icon,image/png,image/svg+xml"
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
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default GlobalSettingsForm;

