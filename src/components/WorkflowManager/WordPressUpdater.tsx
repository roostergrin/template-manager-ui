import React, { useState, useCallback, useEffect } from 'react';
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
  const [apiUrl, setApiUrl] = useState<string>('https://api.zamoraorthodontics.com/');
  const [username, setUsername] = useState<string>('Rooster Grin');
  const [password, setPassword] = useState<string>('F(@@zPzb4kAkvk#j!R!QHeaY');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [useNewFormat, setUseNewFormat] = useState<boolean>(true);
  const [response, status, updateWordPress, error] = useUpdateWordPress();
  const [localError, setLocalError] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<string>('');
  const [useTestContent, setUseTestContent] = useState<boolean>(false);

  // Generate default test content using page IDs from sitemap
  const generateDefaultTestContent = useCallback(() => {
    if (!sitemapData?.pages) {
      return `{
  "8": {
    "seo": {
      "page_title": "Home - Stinson Orthodontics",
      "page_description": "Welcome to our orthodontic practice where your smile is our priority",
      "page_keywords": "orthodontics, braces, smile, dental care",
      "additional_settings": false,
      "social_meta": {
        "og_meta": {
          "title": "Stinson Orthodontics - Expert Orthodontic Care",
          "description": "Your smile is our priority",
          "image": ""
        }
      }
    },
    "sections": [
      {
        "acf_fc_layout": "hero",
        "title": "Welcome to Stinson Orthodontics",
        "text": "Your smile is our priority. We provide expert orthodontic care with personalized treatment plans.",
        "button_text": "Schedule Consultation",
        "button_url": "/contact",
        "image_url": "https://d2jdm9a19iwpm4.cloudfront.net/home/hero-home.jpg",
        "image_alt": "Smiling woman at sunset"
      }
    ]
  }
}`;
    }

    // Use actual page IDs from sitemap
    const samplePages: Record<string, any> = {};
    const pageEntries = Object.entries(sitemapData.pages).slice(0, 1); // Take first 3 pages

    pageEntries.forEach(([pageName, pageInfo], index) => {
      let pageId = pageName; // fallback to page name
      
      if (typeof pageInfo === 'object' && pageInfo !== null) {
        const info = pageInfo as any;
        pageId = info.page_id || info.wordpress_id || pageName;
      }

      if (index === 0) {
        // First page gets hero + content with simplified, common ACF structure
        samplePages[pageId] = {
          "seo": {
            "page_title": `${pageName} - Stinson Orthodontics`,
            "page_description": `Welcome to our ${pageName.toLowerCase()} page`,
            "page_keywords": "orthodontics, braces, smile",
            "additional_settings": false,
            "social_meta": {
              "og_meta": {
                "title": "Stinson Orthodontics",
                "description": "Your smile is our priority",
                "image": ""
              }
            }
          },
          "sections": [
            {
              "acf_fc_layout": "hero",
              "title": "Welcome to Stinson Orthodontics",
              "text": "Your smile is our priority. We provide expert orthodontic care with personalized treatment plans.",
              "button_text": "Schedule Consultation",
              "button_url": "/contact",
              "image_url": "https://d2jdm9a19iwpm4.cloudfront.net/home/hero-home.jpg",
              "image_alt": "Smiling woman at sunset"
            },
            {
              "acf_fc_layout": "content_block",
              "title": "Why Choose Us",
              "content": "Expert orthodontic care with state-of-the-art technology and personalized treatment plans designed just for you."
            }
          ]
        };
      } else {
        // Other pages get content block with simplified structure
        samplePages[pageId] = {
          "seo": {
            "page_title": `${pageName} - Stinson Orthodontics`,
            "page_description": `Learn more about our ${pageName.toLowerCase()}`,
            "page_keywords": `${pageName.toLowerCase()}, orthodontics`,
            "additional_settings": false,
            "social_meta": {
              "og_meta": {
                "title": "",
                "description": "",
                "image": ""
              }
            }
          },
          "sections": [
            {
              "acf_fc_layout": "content_block",
              "title": `${pageName} Information`,
              "content": `Comprehensive information about our ${pageName.toLowerCase()} services and how we can help you achieve your perfect smile.`,
              "button_text": "Learn More",
              "button_url": `/${pageName.toLowerCase().replace(/\s+/g, '-')}`
            }
          ]
        };
      }
    });

    return JSON.stringify(samplePages, null, 2);
  }, [sitemapData]);

  // Initialize test content when sitemap data changes
  useEffect(() => {
    if (sitemapData && !testContent) {
      setTestContent(generateDefaultTestContent());
    }
  }, [sitemapData, testContent, generateDefaultTestContent]);

  const handleUpdateWordPress = useCallback(async () => {
    setLocalError(null);
    
    // Check content availability
    let contentToUse = pagesContent;
    let globalToUse = globalContent;
    
    if (useTestContent) {
      // Parse test content
      try {
        const parsedTestContent = JSON.parse(testContent);
        contentToUse = parsedTestContent;
        globalToUse = {}; // Use empty global for test content
        console.log('📝 Using test content from text area');
      } catch (err) {
        setLocalError('Invalid JSON in test content. Please check the format.');
        return;
      }
    } else {
      if (!pagesContent || !globalContent) {
        setLocalError('Generate content before updating WordPress or enable test content mode.');
        return;
      }
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
    } catch (error) {
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
        
        // Transform the structure to use page IDs and restructure content with seo + sections
        const transformedData: Record<string, any> = {};
        for (const [pageName, content] of Object.entries(contentToUse || {})) {
          // Use the existing page_id from sitemap, or fallback to page_name
          const pageKey = pageIdMapping[pageName] || pageName;
          
          // Check if content is already in the final format (has seo and sections keys)
          if (content && typeof content === 'object' && 'seo' in content && 'sections' in content) {
            // Content is already in final format, just use it
            transformedData[pageKey] = content;
            console.log(`📄 Using pre-formatted content for ${pageName} -> ${pageKey}:`, {
              seoKeys: Object.keys((content as any).seo || {}),
              sectionsCount: ((content as any).sections || []).length
            });
          } else {
            // Content needs restructuring (legacy format)
            const contentArray = Array.isArray(content) ? content : [content];
            
            // Extract SEO data if it exists (look for seo object in content)
            let seoData = {};
            const sectionsData: any[] = [];
            
            // Check if any content item has seo data
            for (let i = 0; i < contentArray.length; i++) {
              const item = contentArray[i];
              if (item && typeof item === 'object' && item.seo) {
                // Found SEO data, extract it
                seoData = item.seo;
                // Remove seo from this item and keep the rest
                const itemWithoutSeo = { ...item };
                delete itemWithoutSeo.seo;
                // Add this item (without seo) to sections if it has other content
                if (Object.keys(itemWithoutSeo).length > 0) {
                  sectionsData.push(itemWithoutSeo);
                }
              } else if (item) {
                // No SEO data in this item, add to sections
                sectionsData.push(item);
              }
            }
            
            // Structure as: { seo: {...}, sections: [...] }
            transformedData[pageKey] = {
              seo: seoData,
              sections: sectionsData
            };
            
            console.log(`📄 Restructured ${pageName} -> ${pageKey}:`, {
              seoKeys: Object.keys(seoData),
              sectionsCount: sectionsData.length
            });
          }
        }
        
        dataToSend = {
          ...transformedData,
          global: globalToUse,
        };
        
        console.log('🔑 Transformed page keys:', Object.keys(transformedData));
        
      } else {
        // OLD FORMAT: Use page names directly without sections wrapper
        console.log('🔄 Using OLD format with page names and direct arrays');
        dataToSend = {
          ...contentToUse,
          global: globalToUse,
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
  }, [apiUrl, username, password, pagesContent, globalContent, updateWordPress, onUpdateComplete, useNewFormat, sitemapData, testContent, useTestContent]);

  const isDisabled = !apiUrl || !username || !password || (!pagesContent || !globalContent) && (!useTestContent || !testContent) || status === 'pending';
  const hasContent = (pagesContent && globalContent) || (useTestContent && testContent);
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

      {/* HTTPS Certificate Warning */}
      <div className="info-banner" style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}>
        <div className="info-content">
          <span className="info-icon">⚠️</span>
          <div className="info-text">
            <strong>HTTPS Certificate Fix:</strong> If you get "ERR_CERT_AUTHORITY_INVALID" errors:
            <br />
            <strong>1.</strong> Open <a href="https://localhost:8000" target="_blank" rel="noopener noreferrer">https://localhost:8000</a> in a new tab
            <br />
            <strong>2.</strong> Click "Advanced" → "Proceed to localhost (unsafe)"
            <br />
            <strong>3.</strong> Return here and try again
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

      {/* Test Content Section */}
      <div className="test-content-section">
        <h4>🧪 Test Content (Optional)</h4>
        <div className="test-content-controls">
          <label className="test-content-toggle">
            <input
              type="checkbox"
              checked={useTestContent}
              onChange={(e) => setUseTestContent(e.target.checked)}
              disabled={status === 'pending'}
            />
            <span>Use test content instead of generated content</span>
          </label>
        </div>
        
        {useTestContent && (
          <div className="test-content-input">
            <div className="test-content-header">
              <label htmlFor="test-content-textarea">
                Content JSON (using actual page IDs from sitemap):
              </label>
              <div className="test-content-actions">
                <button
                  type="button"
                  className="regenerate-btn"
                  onClick={() => setTestContent(generateDefaultTestContent())}
                  disabled={status === 'pending'}
                >
                  🔄 Regenerate Sample
                </button>
                <button
                  type="button"
                  className="regenerate-btn"
                  onClick={() => setTestContent(`{
  "8": {
    "seo": {
      "page_title": "Test Page - Stinson Orthodontics",
      "page_description": "Test page description",
      "page_keywords": "test, orthodontics"
    },
    "sections": [
      {
        "acf_fc_layout": "text_block",
        "title": "Simple Text Block",
        "content": "This is a simple text block for testing."
      }
    ]
  }
}`)}
                  disabled={status === 'pending'}
                >
                  📝 Simple Test
                </button>
              </div>
            </div>
            <textarea
              id="test-content-textarea"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={20}
              disabled={status === 'pending'}
            />
            <div className="test-content-help">
              <p><strong>Format:</strong> JSON object where keys are page IDs and values have <code>seo</code> and <code>sections</code> properties.</p>
              <p><strong>SEO Structure:</strong> Includes <code>page_title</code>, <code>page_description</code>, <code>page_keywords</code>, <code>additional_settings</code>, and nested <code>social_meta</code> with <code>og_meta</code>.</p>
              <p><strong>Sections:</strong> Array of content components with <code>acf_fc_layout</code> field. Common layouts: <code>hero</code>, <code>content_block</code>, <code>text_block</code>, <code>image_text</code>.</p>
              <p><strong>Common Fields:</strong> <code>title</code>, <code>content</code> (or <code>text</code>), <code>button_text</code>, <code>button_url</code>, <code>image_url</code>, <code>image_alt</code>.</p>
              <p><strong>⚠️ Important:</strong> The <code>acf_fc_layout</code> values must match exactly what's defined in your WordPress ACF Flexible Content field. If you get schema errors, check your ACF field group settings.</p>
              <p><strong>Page IDs:</strong> Content keys use actual WordPress page IDs from your sitemap data.</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {hasContent && (
        <div className="preview-section">
          <h4>📋 WordPress Update Preview</h4>
          <div className="preview-content">
            <div className="preview-format">
              <strong>Format:</strong> {useNewFormat ? 'NEW (Page IDs + Sections)' : 'OLD (Page Names + Arrays)'}
            </div>
            
            {/* Show page structure that will be sent */}
            <div className="preview-structure">
              <strong>Pages to Update:</strong>
              <div className="page-list">
                {Object.entries((useTestContent && testContent) ? (() => {
                  try {
                    return JSON.parse(testContent);
                  } catch (error) {
                    return {};
                  }
                })() : (pagesContent || {})).map(([pageName, content]) => {
                  // Calculate the page key that will be used
                  let pageKey = pageName;
                  if (useNewFormat && sitemapData?.pages) {
                    const pageIdMapping: Record<string, string | number> = {};
                    if (Array.isArray(sitemapData.pages)) {
                      sitemapData.pages.forEach((page: any) => {
                        if (page.title && (page.page_id || page.wordpress_id)) {
                          pageIdMapping[page.title] = page.page_id || page.wordpress_id;
                        }
                      });
                    }
                    pageKey = pageIdMapping[pageName]?.toString() || pageName;
                  }
                  
                  const contentArray = Array.isArray(content) ? content : [content];
                  
                  return (
                    <div key={pageName} className="page-preview-item">
                      <div className="page-header">
                        <span className="page-name">{pageName}</span>
                        <span className="page-id">→ ID: {pageKey}</span>
                        <span className="section-count">{contentArray.length} sections</span>
                      </div>
                      
                      {/* Show ACF structure preview */}
                      <div className="acf-preview">
                        <code>
                          {useNewFormat ? (
                            `"acf": { "sections": [${contentArray.length} components] }`
                          ) : (
                            `"acf": { "sections": [${contentArray.length} components] }`
                          )}
                        </code>
                      </div>
                      
                      {/* Show first component preview */}
                      {contentArray.length > 0 && contentArray[0] && (
                        <div className="component-preview">
                          <strong>First Component:</strong>
                          <code>
                            {JSON.stringify({
                              acf_fc_layout: contentArray[0].acf_fc_layout || 'unknown',
                              // Show just a few key fields
                              ...(contentArray[0].title ? { title: contentArray[0].title } : {}),
                              ...(contentArray[0].text ? { text: `${String(contentArray[0].text).substring(0, 50)}...` } : {}),
                            }, null, 2)}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* API Request Preview */}
            <div className="api-preview">
              <strong>WordPress API Request:</strong>
              <code className="api-request-preview">
                {Object.entries((useTestContent && testContent) ? (() => {
                  try {
                    return JSON.parse(testContent);
                  } catch (error) {
                    return {};
                  }
                })() : (pagesContent || {})).slice(0, 1).map(([pageName]) => {
                  let pageKey = pageName;
                  if (useNewFormat && sitemapData?.pages) {
                    const pageIdMapping: Record<string, string | number> = {};
                    if (Array.isArray(sitemapData.pages)) {
                      sitemapData.pages.forEach((page: any) => {
                        if (page.title && (page.page_id || page.wordpress_id)) {
                          pageIdMapping[page.title] = page.page_id || page.wordpress_id;
                        }
                      });
                    }
                    pageKey = pageIdMapping[pageName]?.toString() || pageName;
                  }
                  
                  return `POST ${apiUrl}wp-json/wp/v2/pages/${pageKey}\n{\n  "acf": {\n    "seo": {\n      "page_title": "...",\n      "page_description": "...",\n      "social_meta": {"og_meta": {...}}\n    },\n    "sections": [...]\n  }\n}`;
                })}
              </code>
            </div>
          </div>
        </div>
      )}

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