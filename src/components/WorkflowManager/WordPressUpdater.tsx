import React, { useState, useCallback } from 'react';
import useUpdateWordPress from '../../hooks/useUpdateWordPress';
import './WordPressUpdater.sass';

interface WordPressUpdaterProps {
  pagesContent: object | null;
  globalContent: object | null;
  onUpdateComplete?: () => void;
  sitemapData?: any; // Add sitemap data to get page IDs
}

const WordPressUpdater: React.FC<WordPressUpdaterProps> = ({
  pagesContent,
  globalContent,
  onUpdateComplete,
  sitemapData
}) => {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [useNewFormat, setUseNewFormat] = useState<boolean>(true);
  const [response, status, updateWordPress, error] = useUpdateWordPress();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUpdateWordPress = useCallback(async () => {
    setLocalError(null);
    
    if (!pagesContent || !globalContent) {
      setLocalError('Generate content before updating WordPress.');
      return;
    }
    
    if (!apiUrl || !username || !password) {
      setLocalError('Please provide WordPress API URL, username, and password.');
      return;
    }

    // Validate API URL format
    try {
      const url = new URL(apiUrl);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      setLocalError('Please provide a valid WordPress API URL (e.g., https://example.com/)');
      return;
    }

    try {
      // Prepare data for WordPress update
      let dataToSend;
      
      if (useNewFormat) {
        // NEW FORMAT: Transform to use existing page IDs and sections structure
        console.log('🆕 Using NEW format with page IDs and sections');
        
        // Extract page_id mapping from sitemap data
        const pageIdMapping: Record<string, string | number> = {};
        if (sitemapData?.pages) {
          if (Array.isArray(sitemapData.pages)) {
            // Handle array format
            sitemapData.pages.forEach((page: any) => {
              if (page.title && (page.page_id || page.wordpress_id)) {
                pageIdMapping[page.title] = page.page_id || page.wordpress_id;
              }
            });
          } else if (typeof sitemapData.pages === 'object') {
            // Handle object format
            for (const [pageName, pageInfo] of Object.entries(sitemapData.pages)) {
              if (typeof pageInfo === 'object' && pageInfo !== null) {
                const info = pageInfo as any;
                if (info.page_id || info.wordpress_id) {
                  pageIdMapping[pageName] = info.page_id || info.wordpress_id;
                }
              }
            }
          }
        }
        
        console.log('📄 Page ID mapping:', pageIdMapping);
        
        // Transform the structure to use page IDs and wrap content in sections
        const transformedData: Record<string, any> = {};
        for (const [pageName, content] of Object.entries(pagesContent || {})) {
          // Use the existing page_id from sitemap, or fallback to page_name
          const pageKey = pageIdMapping[pageName] || pageName;
          
          // Wrap content in sections structure
          transformedData[pageKey] = {
            sections: Array.isArray(content) ? content : [content]
          };
        }
        
        dataToSend = {
          ...transformedData,
          global: globalContent,
        };
        
        console.log('🔑 Transformed page keys:', Object.keys(transformedData));
        
      } else {
        // OLD FORMAT: Use page names directly without sections wrapper
        console.log('🔄 Using OLD format with page names and direct arrays');
        dataToSend = {
          ...pagesContent,
          global: globalContent,
        };
      }

      const updateData = {
        wordpress_config: {
          api_url: apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`,
          username,
          password,
        },
        data: dataToSend,
      };

      // Add detailed logging for debugging
      console.log('🔍 WordPress Update Debug Info:');
      console.log('📡 API URL:', updateData.wordpress_config.api_url);
      console.log('👤 Username:', updateData.wordpress_config.username);
      console.log('🔧 Format:', useNewFormat ? 'NEW (Page IDs + Sections)' : 'OLD (Page Names + Arrays)');
      console.log('📊 Data Structure:', Object.keys(updateData.data));
      console.log('📝 Full Data Being Sent:', JSON.stringify(updateData, null, 2));

      await updateWordPress(updateData);
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred while updating WordPress');
    }
  }, [apiUrl, username, password, pagesContent, globalContent, updateWordPress, onUpdateComplete, useNewFormat, sitemapData]);

  const isDisabled = !apiUrl || !username || !password || !pagesContent || !globalContent || status === 'pending';
  const hasContent = pagesContent && globalContent;
  const displayError = localError || error;

  return (
    <div className="wordpress-updater">
      {/* Backend Server Info */}
      <div className="info-banner">
        <div className="info-content">
          <span className="info-icon">ℹ️</span>
          <div className="info-text">
            <strong>Backend Server Required:</strong> This feature requires a backend server running on <code>https://localhost:8000</code> with the <code>/update-wordpress/</code> endpoint configured. 
            If you see "empty response" errors, the server may be running but the WordPress endpoint is not properly set up.
          </div>
        </div>
      </div>

      {/* Content Status */}
      <div className="content-status">
        <div className="status-item">
          <span className="status-label">Pages Content:</span>
          <span className={`status-indicator ${pagesContent ? 'ready' : 'missing'}`}>
            {pagesContent ? '✅ Ready' : '❌ Missing'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Global Content:</span>
          <span className={`status-indicator ${globalContent ? 'ready' : 'missing'}`}>
            {globalContent ? '✅ Ready' : '❌ Missing'}
          </span>
        </div>
      </div>

      {/* WordPress Configuration */}
      <div className="wp-config">
        <div className="form-group">
          <label htmlFor="wp-api-url">WordPress API URL</label>
          <input
            id="wp-api-url"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.zamoraorthodontics.com/"
            disabled={status === 'pending'}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="wp-username">WordPress Username</label>
          <input
            id="wp-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter WordPress username"
            disabled={status === 'pending'}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="wp-password">WordPress Password</label>
          <div className="password-input-container">
            <input
              id="wp-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter WordPress password"
              disabled={status === 'pending'}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={status === 'pending'}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="format-selection-label">
            <input
              type="checkbox"
              checked={useNewFormat}
              onChange={(e) => setUseNewFormat(e.target.checked)}
              disabled={status === 'pending'}
            />
            <span className="format-description">
              Use New Format (Recommended)
              <small className="format-details">
                {useNewFormat 
                  ? "✅ Uses existing page IDs, wraps content in sections, updates existing pages"
                  : "⚠️ Uses page names, direct arrays, may create new pages"
                }
              </small>
            </span>
          </label>
        </div>
      </div>

      {/* Update Button */}
      <button
        className="update-button"
        onClick={handleUpdateWordPress}
        disabled={isDisabled}
      >
        {status === 'pending' ? 'Updating WordPress...' : 'Update WordPress Site'}
      </button>

      {/* Status Display */}
      <div className="status-display">
        <div className="status-item">
          <span className="status-label">Update Status:</span>
          <span className={`status-value status-value--${status}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="error-message">
          <strong>Error:</strong> {displayError}
        </div>
      )}

      {/* Success Display */}
      {status === 'success' && response && (
        <div className="success-section">
          <h4>🎉 WordPress Updated Successfully!</h4>
          <p>Your generated content has been pushed to your WordPress site.</p>
          
          <div className="update-summary">
            <div className="summary-item">
              <span className="summary-label">Total Pages:</span>
              <span className="summary-value">{response.total_pages}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Successful Updates:</span>
              <span className="summary-value">{response.successful_updates}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Failed Updates:</span>
              <span className="summary-value">{response.failed_updates}</span>
            </div>
          </div>
          
          {response.results && response.results.length > 0 && (
            <div className="page-results">
              <h5>Page Update Results:</h5>
              {response.results.map((result, index) => (
                <div 
                  key={index} 
                  className={`result-item ${result.success ? 'success' : 'error'}`}
                >
                  <div className="page-info">
                    <div className="page-id">Page ID: {result.page_id}</div>
                    {result.message && (
                      <div className="page-message">{result.message}</div>
                    )}
                    {result.created_new_page && result.new_page_id && (
                      <div className="page-message">
                        Created new page with ID: {result.new_page_id}
                      </div>
                    )}
                  </div>
                  <div className={`status-badge ${result.success ? 'success' : 'error'}`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {response.message && (
            <p><strong>Summary:</strong> {response.message}</p>
          )}
        </div>
      )}

      {/* Help Text */}
      {!hasContent && (
        <div className="help-text">
          <p>💡 <strong>Tip:</strong> Generate content first using the Content Generation section above, then return here to update your WordPress site.</p>
        </div>
      )}
    </div>
  );
};

export default WordPressUpdater; 