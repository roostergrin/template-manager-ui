import React, { useState, useCallback, useEffect } from 'react';
import useUpdateGithubRepoFileUpload from '../../hooks/useUpdateGithubRepoFileUpload';
import useUpdateGithubRepoFile from '../../hooks/useUpdateGithubRepoFile';
import useGenerateRouter from '../../hooks/useGenerateRouter';
import { UpdateGithubRepoFileUploadRequest, UpdateGithubRepoFileRequest, GenerateRouterRequest } from '../../types/APIServiceTypes';
import { useGithubRepo } from '../../context/GithubRepoContext';
import useProgressTracking from '../../hooks/useProgressTracking';
import ProgressIndicator from '../Common/ProgressIndicator';
import './GithubFileUpdater.sass';

interface GithubFileUpdaterProps {
  onUpdateComplete?: (response: any) => void;
}

interface FileUploadData {
  file: File | null;
  filePath: string;
}

const GithubFileUpdater: React.FC<GithubFileUpdaterProps> = ({
  onUpdateComplete
}) => {
  const { state: githubState } = useGithubRepo();
  const { githubOwner, githubRepo, pageType } = githubState;
  const { progressState, updateTaskStatus } = useProgressTracking();
  
  // Shared repository configuration
  const [repoConfig, setRepoConfig] = useState({
    owner: githubOwner || 'roostergrin',
    repo: githubRepo || '',
    branch: 'main'
  });

  // Logo file upload state
  const [logoData, setLogoData] = useState<FileUploadData>({
    file: null,
    filePath: 'assets/icons/logo.svg'
  });

  // Favicon file upload state  
  const [faviconData, setFaviconData] = useState<FileUploadData>({
    file: null,
    filePath: 'static/favicon.ico'
  });

  const [logoResponse, logoStatus, updateLogoFile] = useUpdateGithubRepoFileUpload();
  const [faviconResponse, faviconStatus, updateFaviconFile] = useUpdateGithubRepoFileUpload();
  const [routerResponse, routerStatus, generateRouter] = useGenerateRouter();
  const [routerFileResponse, routerFileStatus, updateRouterFile] = useUpdateGithubRepoFile();
  const [, apiFileStatus, updateApiFile] = useUpdateGithubRepoFile();
  const [error, setError] = useState<string | null>(null);

  // Router generation state
  const [routerData, setRouterData] = useState<GenerateRouterRequest>({
    wordpress_api_url: '',
    site_type: 'stinson'
  });

  // Router file path state
  const [routerFilePath, setRouterFilePath] = useState('router/index.js');

  // API configuration state
  const [apiConfig, setApiConfig] = useState({
    api: '',
    url: ''
  });

  // API file path state
  const [apiFilePath, setApiFilePath] = useState('resources/api.js');

  // Auto-populate router API URL and API config based on GitHub repo name and page type
  useEffect(() => {
    if (githubRepo) {
      const subdomain = pageType === 'template' ? 'api' : 'landingapi';
      const apiUrl = `https://${subdomain}.${githubRepo}.com`;
      const siteUrl = `https://www.${githubRepo}.com/`;
      
      setRouterData(prev => ({
        ...prev,
        wordpress_api_url: `${apiUrl}/wp-json/wp/v2/pages`
      }));
      
      setApiConfig(prev => ({
        ...prev,
        api: `${apiUrl}/wp-json`,
        url: siteUrl
      }));
    }
  }, [githubRepo, pageType]);

  // Sync repo config with global context
  useEffect(() => {
    setRepoConfig(prev => ({
      ...prev,
      owner: githubOwner || 'roostergrin',
      repo: githubRepo || ''
    }));
  }, [githubOwner, githubRepo]);

  const handleRepoConfigChange = useCallback((field: 'owner' | 'repo' | 'branch', value: string) => {
    setRepoConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleLogoDataChange = useCallback((field: keyof FileUploadData, value: string | File | null) => {
    setLogoData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleFaviconDataChange = useCallback((field: keyof FileUploadData, value: string | File | null) => {
    setFaviconData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleRouterDataChange = useCallback((field: keyof GenerateRouterRequest, value: string) => {
    setRouterData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleApiConfigChange = useCallback((field: 'api' | 'url', value: string) => {
    setApiConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Individual handler - kept for potential future use
  // const handleLogoUpload = useCallback(async () => {
  //   if (!logoData.file || !logoData.filePath || !repoConfig.owner || !repoConfig.repo) {
  //     setError('Please provide all required fields for logo upload.');
  //     return;
  //   }

  //   setError(null);
  //   updateTaskStatus('deployment', 'frontendUpdate', 'in-progress');

  //   try {
  //     const request: UpdateGithubRepoFileUploadRequest = {
  //       owner: repoConfig.owner,
  //       repo: repoConfig.repo,
  //       path: logoData.filePath,
  //       upload_file: logoData.file,
  //       message: 'update logo',
  //       branch: repoConfig.branch
  //     };

  //     const result = await updateLogoFile(request);
  //     updateTaskStatus('deployment', 'frontendUpdate', 'completed');

  //     if (onUpdateComplete) {
  //       onUpdateComplete(result);
  //     }
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'An error occurred while uploading logo');
  //     updateTaskStatus('deployment', 'frontendUpdate', 'error');
  //   }
  // }, [logoData, repoConfig, updateLogoFile, onUpdateComplete, updateTaskStatus]);

  // Individual handler - kept for potential future use
  // const handleFaviconUpload = useCallback(async () => {
  //   if (!faviconData.file || !faviconData.filePath || !repoConfig.owner || !repoConfig.repo) {
  //     setError('Please provide all required fields for favicon upload.');
  //     return;
  //   }

  //   setError(null);
  //   updateTaskStatus('deployment', 'frontendUpdate', 'in-progress');

  //   try {
  //     const request: UpdateGithubRepoFileUploadRequest = {
  //       owner: repoConfig.owner,
  //       repo: repoConfig.repo,
  //       path: faviconData.filePath,
  //       upload_file: faviconData.file,
  //       message: 'update favicon',
  //       branch: repoConfig.branch
  //     };

  //     const result = await updateFaviconFile(request);
  //     updateTaskStatus('deployment', 'frontendUpdate', 'completed');

  //     if (onUpdateComplete) {
  //       onUpdateComplete(result);
  //     }
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'An error occurred while uploading favicon');
  //     updateTaskStatus('deployment', 'frontendUpdate', 'error');
  //   }
  // }, [faviconData, repoConfig, updateFaviconFile, onUpdateComplete, updateTaskStatus]);

  // Individual handler - kept for potential future use
  // const handleGenerateRouter = useCallback(async () => {
  //   if (!routerData.wordpress_api_url) {
  //     setError('Please provide WordPress API URL for router generation.');
  //     return;
  //   }

  //   if (!repoConfig.owner || !repoConfig.repo) {
  //     setError('Please provide GitHub owner and repository name for router file update.');
  //     return;
  //   }

  //   setError(null);
  //   updateTaskStatus('deployment', 'frontendUpdate', 'in-progress');

  //   console.log('🚀 Starting router generation with data:', routerData);

  //   try {
  //     // Step 1: Generate router
  //     const result = await generateRouter(routerData);
  //     console.log('✅ Router generation successful:', result);

  //     // Step 2: Automatically update router file if router_string is available
  //     if (result.router_string) {
  //       console.log('📁 Updating router file with generated content...');

  //       const routerFileRequest: UpdateGithubRepoFileRequest = {
  //         owner: repoConfig.owner,
  //         repo: repoConfig.repo,
  //         path: 'router/index.js',
  //         content: result.router_string,
  //         message: 'Updating router file',
  //         branch: repoConfig.branch
  //       };

  //       await updateRouterFile(routerFileRequest);
  //       console.log('✅ Router file updated successfully');
  //     }

  //     updateTaskStatus('deployment', 'frontendUpdate', 'completed');

  //     if (onUpdateComplete) {
  //       onUpdateComplete(result);
  //     }
  //   } catch (err) {
  //     console.error('❌ Router generation or file update failed:', err);

  //     // Enhanced error message with debugging info
  //     let errorMessage = 'An error occurred while generating router or updating file';
  //     if (err instanceof Error) {
  //       errorMessage = err.message;
  //     }

  //     // Add debugging information to the error
  //     const debugInfo = `
  //       Request data: ${JSON.stringify(routerData, null, 2)}
  //       Repo config: ${JSON.stringify(repoConfig, null, 2)}
  //       Error details: ${err instanceof Error ? err.stack : String(err)}
  //     `;

  //     console.error('🔍 Debug information:', debugInfo);
  //     setError(`${errorMessage}\n\nDebug info (check browser console for more details):\nWordPress API URL: ${routerData.wordpress_api_url}\nSite Type: ${routerData.site_type}\nRepo: ${repoConfig.owner}/${repoConfig.repo}`);
  //     updateTaskStatus('deployment', 'frontendUpdate', 'error');
  //   }
  // }, [routerData, repoConfig, generateRouter, updateRouterFile, onUpdateComplete, updateTaskStatus]);

  // Unified frontend update handler
  const handleUpdateFrontend = useCallback(async () => {
    // Validate all required fields
    if (!logoData.file || !logoData.filePath) {
      setError('Please select a logo file.');
      return;
    }
    if (!faviconData.file || !faviconData.filePath) {
      setError('Please select a favicon file.');
      return;
    }
    if (!routerData.wordpress_api_url) {
      setError('WordPress API URL is required for router generation.');
      return;
    }
    if (!apiConfig.api || !apiConfig.url) {
      setError('API and URL configuration are required.');
      return;
    }
    if (!routerFilePath || !apiFilePath) {
      setError('Router file path and API file path are required.');
      return;
    }
    if (!repoConfig.owner || !repoConfig.repo) {
      setError('Please provide GitHub owner and repository name.');
      return;
    }

    setError(null);
    updateTaskStatus('deployment', 'frontendUpdate', 'in-progress');

    try {
      // Step 1: Upload Logo
      console.log('🚀 Step 1/4: Uploading logo...');
      console.log('📋 Logo request details:', {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: logoData.filePath,
        fileName: logoData.file?.name,
        fileSize: logoData.file?.size,
        fileType: logoData.file?.type,
        message: 'update logo',
        branch: repoConfig.branch
      });
      
      const logoRequest: UpdateGithubRepoFileUploadRequest = {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: logoData.filePath,
        upload_file: logoData.file,
        message: 'update logo',
        branch: repoConfig.branch
      };
      
      try {
        await updateLogoFile(logoRequest);
        console.log('✅ Logo upload completed');
      } catch (logoError) {
        console.error('❌ Logo upload failed:', logoError);
        
        // Enhanced logo error logging
        const errorDetails: any = {
          errorType: logoError instanceof Error ? logoError.constructor.name : typeof logoError,
          message: logoError instanceof Error ? logoError.message : String(logoError),
          request: {
            owner: logoRequest.owner,
            repo: logoRequest.repo,
            path: logoRequest.path,
            message: logoRequest.message,
            branch: logoRequest.branch
          },
          fileInfo: {
            name: logoData.file?.name,
            size: logoData.file?.size,
            type: logoData.file?.type
          }
        };
        
        // Check if it's an APIError with additional details
        if (logoError && typeof logoError === 'object' && 'status' in logoError) {
          errorDetails.status = (logoError as any).status;
          errorDetails.details = (logoError as any).details;
          errorDetails.originalError = (logoError as any).originalError;
        }
        
        console.error('📋 Logo error details:', errorDetails);
        throw logoError;
      }

      // Step 2: Upload Favicon
      console.log('🚀 Step 2/4: Uploading favicon...');
      console.log('📋 Favicon request details:', {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: faviconData.filePath,
        fileName: faviconData.file?.name,
        fileSize: faviconData.file?.size,
        fileType: faviconData.file?.type,
        message: 'update favicon',
        branch: repoConfig.branch
      });
      
      const faviconRequest: UpdateGithubRepoFileUploadRequest = {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: faviconData.filePath,
        upload_file: faviconData.file,
        message: 'update favicon',
        branch: repoConfig.branch
      };
      
      try {
        await updateFaviconFile(faviconRequest);
        console.log('✅ Favicon upload completed');
      } catch (faviconError) {
        console.error('❌ Favicon upload failed:', faviconError);
        
        // Enhanced favicon error logging
        const errorDetails: any = {
          errorType: faviconError instanceof Error ? faviconError.constructor.name : typeof faviconError,
          message: faviconError instanceof Error ? faviconError.message : String(faviconError),
          request: {
            owner: faviconRequest.owner,
            repo: faviconRequest.repo,
            path: faviconRequest.path,
            message: faviconRequest.message,
            branch: faviconRequest.branch
          },
          fileInfo: {
            name: faviconData.file?.name,
            size: faviconData.file?.size,
            type: faviconData.file?.type
          }
        };
        
        // Check if it's an APIError with additional details
        if (faviconError && typeof faviconError === 'object' && 'status' in faviconError) {
          errorDetails.status = (faviconError as any).status;
          errorDetails.details = (faviconError as any).details;
          errorDetails.originalError = (faviconError as any).originalError;
        }
        
        console.error('📋 Favicon error details:', errorDetails);
        throw faviconError;
      }

      // Step 3: Update API Configuration
      console.log('🚀 Step 3/4: Updating API configuration...');
      const apiFileContent = `// Update the api to the api address of your project, i.e. https://api.arbitmanortho.com or https://api-oaktonbraces.roostertest2.com
// Update the url variable to the address where your project will be launched, i.e. https://www.arbitmanortho.com or https://hollevoetorthodontics.com

export const api = "${apiConfig.api}"
// Make sure the url contains the trailing "/"
export const url = "${apiConfig.url}"
`;

      const apiFileRequest: UpdateGithubRepoFileRequest = {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: apiFilePath,
        content: apiFileContent,
        message: 'update API configuration',
        branch: repoConfig.branch
      };
      await updateApiFile(apiFileRequest);
      console.log('✅ API configuration updated');

      // Step 4: Generate and Update Router
      console.log('🚀 Step 4/4: Generating and updating router...');
      const result = await generateRouter(routerData);
      console.log('✅ Router generation successful:', result);
      
      // Update router file if router_string is available
      if (result.router_string) {
        console.log('📁 Updating router file with generated content...');
        
        const routerFileRequest: UpdateGithubRepoFileRequest = {
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          path: routerFilePath,
          content: result.router_string,
          message: 'Updating router file',
          branch: repoConfig.branch
        };

        await updateRouterFile(routerFileRequest);
        console.log('✅ Router file updated successfully');
      }

      updateTaskStatus('deployment', 'frontendUpdate', 'completed');
      console.log('🎉 All frontend updates completed successfully!');
      
      if (onUpdateComplete) {
        onUpdateComplete({
          logo: logoResponse,
          favicon: faviconResponse,
          router: result
        });
      }
      
    } catch (err) {
      console.error('❌ Frontend update failed:', err);
      
      // Enhanced error message extraction
      let errorMessage = 'An error occurred during frontend update';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle APIError specifically
        if (err.name === 'APIError') {
          const apiError = err as any;
          console.error('📋 APIError details:', {
            message: apiError.message,
            status: apiError.status,
            code: apiError.code,
            details: apiError.details,
            originalError: apiError.originalError
          });
          
          // Try to extract more meaningful error message
          if (apiError.details) {
            errorMessage = `${apiError.message} (Status: ${apiError.status || 'unknown'})`;
          }
        }
      }
      
      setError(errorMessage);
      updateTaskStatus('deployment', 'frontendUpdate', 'error');
    }
  }, [logoData, faviconData, routerData, apiConfig, routerFilePath, apiFilePath, repoConfig, updateLogoFile, updateFaviconFile, updateApiFile, generateRouter, updateRouterFile, updateTaskStatus, onUpdateComplete, logoResponse, faviconResponse]);

  const isLogoDisabled = logoStatus === 'pending';
  const isFaviconDisabled = faviconStatus === 'pending';
  const isRouterDisabled = routerStatus === 'pending' || routerFileStatus === 'pending';
  const isRouterFileDisabled = routerFileStatus === 'pending';
  const isRouterSuccess = routerStatus === 'success';
  
  // Unified frontend update state
  const isFrontendUpdateDisabled = isLogoDisabled || isFaviconDisabled || isRouterDisabled || apiFileStatus === 'pending' ||
    !logoData.file || !faviconData.file || !routerData.wordpress_api_url || !apiConfig.api || !apiConfig.url || 
    !routerFilePath || !apiFilePath || !repoConfig.owner || !repoConfig.repo;
  const isFrontendUpdateInProgress = progressState.deployment.frontendUpdate === 'in-progress';
  const isFrontendUpdateSuccess = progressState.deployment.frontendUpdate === 'completed';
  const isRouterFileSuccess = routerFileStatus === 'success';

  return (
    <div className="github-file-updater">
      <div className="github-file-updater__header">
        <h4 className="github-file-updater__title">Frontend File Updates</h4>
        <ProgressIndicator 
          status={progressState.deployment?.frontendUpdate || 'pending'} 
          size="medium"
          showLabel={true}
        />
      </div>

      {/* Shared Repository Configuration */}
      <div >
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="owner">GitHub Owner *</label>
            <input
              id="owner"
              type="text"
              value={repoConfig.owner}
              onChange={(e) => handleRepoConfigChange('owner', e.target.value)}
              placeholder="e.g., octocat"
              disabled={isLogoDisabled || isFaviconDisabled || isRouterDisabled || isRouterFileDisabled}
              aria-label="GitHub repository owner"
              tabIndex={0}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="repo">Repository Name *</label>
            <input
              id="repo"
              type="text"
              value={repoConfig.repo}
              onChange={(e) => handleRepoConfigChange('repo', e.target.value)}
              placeholder="e.g., my-website"
              disabled={isLogoDisabled || isFaviconDisabled || isRouterDisabled || isRouterFileDisabled}
              aria-label="GitHub repository name"
              tabIndex={0}
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <input
              id="branch"
              type="text"
              value={repoConfig.branch}
              onChange={(e) => handleRepoConfigChange('branch', e.target.value)}
              placeholder="main"
              disabled={isLogoDisabled || isFaviconDisabled || isRouterDisabled || isRouterFileDisabled}
              aria-label="Git branch name"
              tabIndex={0}
            />
          </div>
        </div>
      </div>

      {/* Router Generation Section */}
      <div>
        <h5>Navigation Router Generation</h5>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="wordpress-api-url">WordPress API URL *</label>
            <input
              id="wordpress-api-url"
              type="text"
              value={routerData.wordpress_api_url}
              onChange={(e) => handleRouterDataChange('wordpress_api_url', e.target.value)}
              placeholder="https://your-site.com/wp-json/wp/v2"
              disabled={isRouterDisabled}
              aria-label="WordPress API URL"
              tabIndex={0}
            />
          </div>

          <div className="form-group">
            <label htmlFor="site-type">Site Type *</label>
            <select
              id="site-type"
              value={routerData.site_type}
              onChange={(e) => handleRouterDataChange('site_type', e.target.value)}
              disabled={isRouterDisabled}
              aria-label="Site type selection"
              tabIndex={0}
            >
              <option value="stinson">Stinson</option>
              <option value="haightashbury">Haight Ashbury</option>
              <option value="bayarea">Bay Area</option>
              <option value="calistoga">Calistoga</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="router-file-path">Router File Path *</label>
            <input
              id="router-file-path"
              type="text"
              value={routerFilePath}
              onChange={(e) => setRouterFilePath(e.target.value)}
              placeholder="router/index.js"
              disabled={isRouterDisabled}
              aria-label="Router file path in repository"
              tabIndex={0}
            />
          </div>
        </div>

      </div>

      {/* API Configuration Section */}
      <div>
        <h5>API Configuration</h5>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="api-url">API URL *</label>
            <input
              id="api-url"
              type="text"
              value={apiConfig.api}
              onChange={(e) => handleApiConfigChange('api', e.target.value)}
              placeholder="https://api.yoursite.com/wp-json"
              disabled={apiFileStatus === 'pending'}
              aria-label="API URL"
              tabIndex={0}
            />
            <small>The API endpoint for your project (e.g., https://api.arbitmanortho.com)</small>
          </div>

          <div className="form-group">
            <label htmlFor="site-url">Site URL *</label>
            <input
              id="site-url"
              type="text"
              value={apiConfig.url}
              onChange={(e) => handleApiConfigChange('url', e.target.value)}
              placeholder="https://www.yoursite.com/"
              disabled={apiFileStatus === 'pending'}
              aria-label="Site URL"
              tabIndex={0}
            />
            <small>The main website URL where your project will be launched (must include trailing "/")</small>
          </div>

          <div className="form-group">
            <label htmlFor="api-file-path">API File Path *</label>
            <input
              id="api-file-path"
              type="text"
              value={apiFilePath}
              onChange={(e) => setApiFilePath(e.target.value)}
              placeholder="resources/api.js"
              disabled={apiFileStatus === 'pending'}
              aria-label="API file path in repository"
              tabIndex={0}
            />
          </div>
        </div>

      </div>

      {/* Logo Upload Section */}
      <div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="logo-file">Select Logo File *</label>
            <input
              id="logo-file"
              type="file"
              accept=".svg,.png,.jpg,.jpeg"
              onChange={(e) => handleLogoDataChange('file', e.target.files?.[0] || null)}
              disabled={isLogoDisabled}
              aria-label="Select logo file"
              tabIndex={0}
            />
            
          </div>

          <div className="form-group">
            <label htmlFor="logo-path">Logo File Path *</label>
            <input
              id="logo-path"
              type="text"
              value={logoData.filePath}
              onChange={(e) => handleLogoDataChange('filePath', e.target.value)}
              placeholder="assets/icons/logo.svg"
              disabled={isLogoDisabled}
              aria-label="Logo file path in repository"
              tabIndex={0}
            />
          </div>
        </div>
      </div>

      {/* Favicon Upload Section */}
      <div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="favicon-file">Select Favicon File *</label>
            <input
              id="favicon-file"
              type="file"
              accept=".ico,.png,.jpg,.jpeg"
              onChange={(e) => handleFaviconDataChange('file', e.target.files?.[0] || null)}
              disabled={isFaviconDisabled}
              aria-label="Select favicon file"
              tabIndex={0}
            />
            
          </div>

          <div className="form-group">
            <label htmlFor="favicon-path">Favicon File Path *</label>
            <input
              id="favicon-path"
              type="text"
              value={faviconData.filePath}
              onChange={(e) => handleFaviconDataChange('filePath', e.target.value)}
              placeholder="public/favicon.ico"
              disabled={isFaviconDisabled}
              aria-label="Favicon file path in repository"
              tabIndex={0}
            />
          </div>
        </div>
      </div>

      

      {/* Unified Frontend Update Button */}
      <div>
        <button
          className="primary-button update-frontend-button"
          onClick={handleUpdateFrontend}
          disabled={isFrontendUpdateDisabled}
          aria-label="Update all frontend assets (logo, favicon, API config, and router)"
          tabIndex={0}
        >
          {isFrontendUpdateInProgress ? 'Updating Frontend...' : 'Update Frontend'}
        </button>
        
        {isFrontendUpdateInProgress && (
          <div className="progress-info">
            <p>Processing frontend updates in sequence...</p>
            <small>This may take a few moments to complete all updates.</small>
          </div>
        )}
      </div>

      {/* Combined Success Display */}
      {isFrontendUpdateSuccess && (
        <div className="success-section">
          <h4>🎉 Frontend Updated Successfully!</h4>
          <div className="success-details">
            <div className="detail-item">
              <strong>✅ Logo:</strong> Uploaded to {logoData.filePath}
            </div>
            <div className="detail-item">
              <strong>✅ Favicon:</strong> Uploaded to {faviconData.filePath}
            </div>
            <div className="detail-item">
              <strong>✅ API Config:</strong> Updated {apiFilePath} with API: {apiConfig.api}, URL: {apiConfig.url}
            </div>
            <div className="detail-item">
              <strong>✅ Router:</strong> Generated and updated in {routerFilePath}
            </div>
          </div>
        </div>
      )}

      {/* Individual Success Sections (only shown when not using unified update) */}
      <div className="individual-results" style={{ display: isFrontendUpdateSuccess ? 'none' : 'block' }}>
        {/* Router Success Display with Sample Structure */}
        {isRouterSuccess && routerResponse && (
          <div className="success-section">
            <h4>🎉 Router Generated Successfully!</h4>
            
            {/* Router File Update Status */}
            {isRouterFileSuccess && routerFileResponse && (
              <div className="info-banner">
                <p><strong>✅ Router file updated:</strong> {routerFilePath} has been updated in your repository with the generated router code.</p>
              </div>
            )}

            {/* Router Entries Structure Display */}
            {routerResponse.router_entries && (
              <details className="router-structure">
                <summary>🗺️ View Router Entries ({routerResponse.router_entries.length} pages)</summary>
                <div className="structure-content">
                  
                  {routerResponse.router_string && (
                    <div className="structure-example">
                      <pre>{routerResponse.router_string}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Show message if router_entries is missing */}
            {!routerResponse.router_entries && (
              <div className="info-banner">
                <p><strong>Note:</strong> No router_entries found in response. Check the debug section above to see the full API response structure.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default GithubFileUpdater;
