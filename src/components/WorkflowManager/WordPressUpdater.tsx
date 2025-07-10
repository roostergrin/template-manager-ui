import React, { useState, useCallback, useEffect } from 'react';
import useUpdateWordPress from '../../hooks/useUpdateWordPress';
import EnhancedPreviewSection from './EnhancedPreviewSection';
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
  const [apiUrl, setApiUrl] = useState<string>('https://api-haightashbury.roostergrintemplates.com/');
  const [username, setUsername] = useState<string>('Rooster Grin');
  const [password, setPassword] = useState<string>('E%SxY)1TtOroreDbVVKGcb8j');
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
      "page_title": "Rooster Grin Media",
      "page_description": "Clean, textural & bright, Rooster Grin's Haight Ashbury template is perfect for any business looking to make their website pop. Create your online advantage!",
      "page_keywords": "",
      "additional_settings": true,
      "social_meta": {
        "og_meta": {
          "title": "Rooster Grin Media",
          "description": "Clean, textural & bright, Rooster Grin's Haight Ashbury template is perfect for any business looking to make their website pop. Create your online advantage!",
          "image": " https://d30hu1ergm5305.cloudfront.net/home/meta.jpg"
        }
      }
    },
    "page_sections": [
      {
        "acf_fc_layout": "hero",
        "header": "PLOMP DOMP",
        "subheader": "Proin sed imperdiet ligula",
        "buttons": [
          {
            "link_type": "ext_link",
            "label": "Schedule Appointment",
            "aria": "schedule an appointment through Calendly",
            "path": "",
            "hash": "",
            "href": "https://calendly.com/alicia_rg",
            "external": true,
            "open_chair": false
          }
        ],
        "type": "image",
        "image": {
          "src": "https://d30hu1ergm5305.cloudfront.net/home/home-hero.jpg",
          "webp": "https://d30hu1ergm5305.cloudfront.net/home/home-hero.webp"
        },
        "image_mobile": {
          "src": "https://d30hu1ergm5305.cloudfront.net/home/home-hero-mobile.jpg",
          "webp": "https://d30hu1ergm5305.cloudfront.net/home/home-hero-mobile.webp"
        },
        "image_position": "center top",
        "video": {
          "title": "",
          "src": "",
          "poster": ""
        }
      },`;
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
              "button": {
                "button_type": "nuxt_link",
                "text": "Schedule Consultation",
                "url": "/contact"
              },
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
              "button": {
                "button_type": "nuxt_link",
                "text": "Learn More",
                "url": `/${pageName.toLowerCase().replace(/\s+/g, '-')}`
              }
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
        console.log('🔍 Content to transform:', Object.keys(contentToUse || {}));
        console.log('🧪 Using test content:', useTestContent);
        
        // Transform the structure to use page IDs and restructure content with seo + sections
        const transformedData: Record<string, any> = {};
        
        // First, determine the expected sections key based on existing content or template needs
        let expectedSectionsKey = 'sections'; // default
        
        // Check if any existing content uses 'page_sections' to maintain consistency
        for (const [, existingContent] of Object.entries(contentToUse || {})) {
          if (existingContent && typeof existingContent === 'object' && 'page_sections' in existingContent) {
            expectedSectionsKey = 'page_sections';
            break;
          }
        }
        
        // For templates that use 'page_sections', default to that key if not explicitly using test content
        // Check API URL for known templates that use 'page_sections'
        const templatesUsingPageSections = ['haightashbury', 'haight-ashbury'];
        if (!useTestContent && templatesUsingPageSections.some(template => apiUrl.includes(template))) {
          expectedSectionsKey = 'page_sections';
        }
        
        console.log(`🔑 Expected sections key: ${expectedSectionsKey}`);
        
        for (const [pageKey, content] of Object.entries(contentToUse || {})) {
          // If using test content, the keys are already page IDs
          // If using generated content, we need to map page names to IDs
          let finalPageKey = pageKey;
          
          if (!useTestContent) {
            // For generated content, map page names to IDs
            finalPageKey = (pageIdMapping[pageKey] || pageKey).toString();
          }
          // For test content, use the key as-is (it's already a page ID)
          
          // Check if content is already in the final format (has seo and sections/page_sections keys)
          if (content && typeof content === 'object' && 'seo' in content && ('sections' in content || 'page_sections' in content)) {
            // Content is in final format, but check if sections key needs transformation
            const currentSectionsKey = 'page_sections' in content ? 'page_sections' : 'sections';
            const sectionsData = (content as any)[currentSectionsKey] || [];
            
            // If the current key doesn't match expected key, transform it
            if (currentSectionsKey !== expectedSectionsKey) {
              const transformedContent = { ...content };
              transformedContent[expectedSectionsKey] = sectionsData;
              delete transformedContent[currentSectionsKey];
              transformedData[finalPageKey] = transformedContent;
              
              console.log(`📄 Transformed sections key for ${pageKey} -> ${finalPageKey}: ${currentSectionsKey} -> ${expectedSectionsKey}`, {
                seoKeys: Object.keys((content as any).seo || {}),
                sectionsCount: sectionsData.length,
                transformedFrom: currentSectionsKey,
                transformedTo: expectedSectionsKey
              });
            } else {
              // Keys match, use as-is
              transformedData[finalPageKey] = content;
              console.log(`📄 Using pre-formatted content for ${pageKey} -> ${finalPageKey}:`, {
                seoKeys: Object.keys((content as any).seo || {}),
                sectionsCount: sectionsData.length,
                sectionsKey: currentSectionsKey
              });
            }
          } else {
            // Content needs restructuring (legacy format)
            const contentArray = Array.isArray(content) ? content : [content];
            
            // Extract SEO data if it exists (look for standalone seo objects)
            let seoData = {};
            const sectionsData: any[] = [];
            
            // Check each content item
            for (let i = 0; i < contentArray.length; i++) {
              const item = contentArray[i];
              if (item && typeof item === 'object') {
                // Check if this item is SEO data (has seo property but no acf_fc_layout)
                if (item.seo && !item.acf_fc_layout) {
                  // Found standalone SEO data, extract it
                  seoData = item.seo;
                  console.log(`📄 Extracted SEO data for ${pageKey}:`, Object.keys(seoData));
                } else if (item.acf_fc_layout) {
                  // This is a content section, add to sections
                  sectionsData.push(item);
                } else if (item.seo && item.acf_fc_layout) {
                  // Item has both SEO and content - extract SEO and keep content
                  seoData = { ...seoData, ...item.seo };
                  const itemWithoutSeo = { ...item };
                  delete itemWithoutSeo.seo;
                  sectionsData.push(itemWithoutSeo);
                  console.log(`📄 Extracted SEO from content section for ${pageKey}`);
                } else {
                  // Item doesn't have expected structure, log and skip
                  console.warn(`⚠️ Skipping unexpected item structure in ${pageKey}:`, Object.keys(item));
                }
              }
            }
            
            // Structure as: { seo: {...}, [sections|page_sections]: [...] }
            transformedData[finalPageKey] = {
              seo: seoData,
              [expectedSectionsKey]: sectionsData
            };
            
            console.log(`📄 Restructured ${pageKey} -> ${finalPageKey}:`, {
              seoKeys: Object.keys(seoData),
              sectionsCount: sectionsData.length,
              originalItemsCount: contentArray.length,
              sectionsKey: expectedSectionsKey
            });
          }
        }
        
        dataToSend = {
          ...transformedData,
        };
        
        // Add global data separately if it exists
        if (globalToUse && Object.keys(globalToUse).length > 0) {
          dataToSend.global = globalToUse;
        }
        
        console.log('🔑 Transformed page keys:', Object.keys(transformedData));
        
        // Warn about non-numeric page IDs that will create new pages
        const nonNumericKeys = Object.keys(transformedData).filter(key => key !== 'global' && isNaN(Number(key)));
        if (nonNumericKeys.length > 0) {
          console.warn('⚠️ Non-numeric page IDs detected - these will create NEW pages instead of updating existing ones:', nonNumericKeys);
          console.warn('💡 To update existing pages, ensure your sitemap contains numeric WordPress page IDs (not slugs)');
        }
        
      } else {
        // OLD FORMAT: Use page names directly without sections wrapper
        console.log('🔄 Using OLD format with page names and direct arrays');
        dataToSend = {
          ...contentToUse,
        };
        
        // Add global data separately if it exists
        if (globalToUse && Object.keys(globalToUse).length > 0) {
          dataToSend.global = globalToUse;
        }
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
                  onClick={
                    () => setTestContent(`
                      {
                        "8": {
                          "seo": {
                            "page_title": "Rooster Grin Media",
                            "page_description": "Clean, textural & bright, Rooster Grin's Haight Ashbury template is perfect for any business looking to make their website pop. Create your online advantage!",
                            "page_keywords": "",
                            "additional_settings": true,
                            "social_meta": {
                              "og_meta": {
                                "title": "Rooster Grin Media",
                                "description": "Clean, textural & bright, Rooster Grin's Haight Ashbury template is perfect for any business looking to make their website pop. Create your online advantage!",
                                "image": " https://d30hu1ergm5305.cloudfront.net/home/meta.jpg"
                              }
                            }
                          },
                          "page_sections": [
                            {
                              "acf_fc_layout": "hero",
                              "header": "PLOMP DOMP",
                              "subheader": "Proin sed imperdiet ligula",
                              "buttons": [
                                {
                                  "link_type": "ext_link",
                                  "label": "Schedule Appointment",
                                  "aria": "schedule an appointment through Calendly",
                                  "path": "",
                                  "hash": "",
                                  "href": "https://calendly.com/alicia_rg",
                                  "external": true,
                                  "open_chair": false
                                }
                              ],
                              "type": "image",
                              "image": {
                                "src": "https://d30hu1ergm5305.cloudfront.net/home/home-hero.jpg",
                                "webp": "https://d30hu1ergm5305.cloudfront.net/home/home-hero.webp"
                              },
                              "image_mobile": {
                                "src": "https://d30hu1ergm5305.cloudfront.net/home/home-hero-mobile.jpg",
                                "webp": "https://d30hu1ergm5305.cloudfront.net/home/home-hero-mobile.webp"
                              },
                              "image_position": "center top",
                              "video": {
                                "title": "",
                                "src": "",
                                "poster": ""
                              }
                            }
                          ]
                        }
                      }
                    `)}
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
              <p><strong>Common Fields:</strong> <code>title</code>, <code>content</code> (or <code>text</code>), <code>button</code> object with <code>button_type</code>, <code>image_url</code>, <code>image_alt</code>.</p>
              <p><strong>Button Structure:</strong> <code>{`{"button": {"button_type": "nuxt_link|ext_link|button", "text": "...", "url": "..."}}`}</code></p>
              <p><strong>⚠️ Important:</strong> The <code>acf_fc_layout</code> values must match exactly what's defined in your WordPress ACF Flexible Content field. If you get schema errors, check your ACF field group settings.</p>
              <p><strong>Page IDs:</strong> Content keys use actual WordPress page IDs from your sitemap data.</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Preview Section */}
      {hasContent && (
        <EnhancedPreviewSection
          pagesContent={useTestContent && testContent ? (() => {
            try {
              return JSON.parse(testContent);
            } catch (error) {
              return {};
            }
          })() : (pagesContent || {})}
          globalContent={globalContent}
          useNewFormat={useNewFormat}
          apiUrl={apiUrl}
          sitemapData={sitemapData}
          onContentUpdate={(updatedContent) => {
            if (useTestContent) {
              setTestContent(JSON.stringify(updatedContent, null, 2));
            }
            // For generated content, we'd need to update the parent state
            // This would require passing an update callback from parent
          }}
        />
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