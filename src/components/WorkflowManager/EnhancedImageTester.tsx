import React, { useState, useEffect } from 'react';
import '../ScrapedImageTester/ScrapedImageTester.sass';

interface EnhancedImageTesterProps {
  prefilledBucket?: string;
  prefilledCloudFront?: string;
  questionnaireData?: Record<string, unknown>;
}

interface SyncResponse {
  success: boolean;
  processed_count: number;
  failed_count: number;
  synced_images: Array<{
    success: boolean;
    original_url: string;
    s3_key: string;
    s3_url: string;
    cloudfront_url: string;
    content_type: string;
  }>;
  failed_images: Array<{
    success: boolean;
    original_url: string;
    error: string;
  }>;
  total_found: number;
  cloudfront_domain?: string;
  bucket_name: string;
  message?: string;
}

interface StatusResponse {
  site_identifier: string;
  images: Array<{
    s3_key: string;
    file_size: number;
    last_modified: string;
    cloudfront_url: string;
  }>;
  total_images: number;
}

const EnhancedImageTester: React.FC<EnhancedImageTesterProps> = ({
  prefilledBucket,
  prefilledCloudFront,
  questionnaireData
}) => {
  const [siteIdentifier, setSiteIdentifier] = useState('test-site');
  const [bucketName, setBucketName] = useState('');
  const [cloudfrontDomain, setCloudfrontDomain] = useState('');
  const [imageUrls, setImageUrls] = useState('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800');
  const [syncResponse, setSyncResponse] = useState<SyncResponse | null>(null);
  const [statusResponse, setStatusResponse] = useState<StatusResponse | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [syncMode, setSyncMode] = useState<'questionnaire' | 'json'>('questionnaire');
  const [jsonData, setJsonData] = useState('');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showOriginalJson, setShowOriginalJson] = useState(true);

  // Auto-fill values when provisioning data is available
  useEffect(() => {
    if (prefilledBucket) {
      setBucketName(prefilledBucket);
    }
  }, [prefilledBucket]);

  useEffect(() => {
    if (prefilledCloudFront) {
      // Extract domain from full URL
      try {
        const url = new URL(prefilledCloudFront);
        setCloudfrontDomain(url.hostname);
      } catch {
        setCloudfrontDomain(prefilledCloudFront);
      }
    }
  }, [prefilledCloudFront]);

  // Extract image URLs from questionnaire data
  const extractImageUrlsFromQuestionnaire = (): string[] => {
    if (!questionnaireData) return [];
    
    const imageUrls: string[] = [];
    
    // Recursively search for image URLs in the questionnaire data
    const findImageUrls = (obj: any, path: string = '') => {
      if (typeof obj === 'string') {
        // Check if string looks like an image URL
        if (obj.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
            obj.includes('unsplash.com') || 
            obj.includes('pexels.com') ||
            obj.includes('pixabay.com') ||
            obj.startsWith('http') && obj.includes('image')) {
          imageUrls.push(obj);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => findImageUrls(item, `${path}[${index}]`));
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          // Look for common image field names
          if (key.toLowerCase().includes('photo') || 
              key.toLowerCase().includes('image') || 
              key.toLowerCase().includes('picture') ||
              key.toLowerCase().includes('url')) {
            findImageUrls(value, `${path}.${key}`);
          } else {
            findImageUrls(value, `${path}.${key}`);
          }
        });
      }
    };
    
    findImageUrls(questionnaireData);
    return [...new Set(imageUrls)]; // Remove duplicates
  };

  // Handle JSON file upload
  const handleJsonFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setJsonFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setJsonData(content);
          
          // Try to extract image URLs from the JSON
          const parsed = JSON.parse(content);
          const extractedUrls = extractImageUrlsFromJson(parsed);
          if (extractedUrls.length > 0) {
            setImageUrls(extractedUrls.join('\n'));
          }
        } catch (error) {
          setSyncError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Extract image URLs from JSON data
  const extractImageUrlsFromJson = (obj: any): string[] => {
    const imageUrls: string[] = [];
    
    const findUrls = (data: any) => {
      if (typeof data === 'string') {
        if (data.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
            data.includes('unsplash.com') || 
            data.includes('pexels.com') ||
            data.includes('pixabay.com') ||
            data.startsWith('http') && data.includes('image')) {
          imageUrls.push(data);
        }
      } else if (Array.isArray(data)) {
        data.forEach(item => findUrls(item));
      } else if (data && typeof data === 'object') {
        Object.values(data).forEach(value => findUrls(value));
      }
    };
    
    findUrls(obj);
    return [...new Set(imageUrls)]; // Remove duplicates
  };

  // Get image URLs based on selected mode
  const getImageUrls = (): string[] => {
    if (syncMode === 'questionnaire') {
      return extractImageUrlsFromQuestionnaire();
    } else {
      return imageUrls.split('\n').map(url => url.trim()).filter(url => url);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncError('');
    setSyncResponse(null);

    try {
      const urlsToSync = getImageUrls();
      
      if (urlsToSync.length === 0) {
        throw new Error('No image URLs found to sync');
      }

      const response = await fetch('https://localhost:8000/sync-scraped-images/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_identifier: siteIdentifier,
          bucket_name: bucketName,
          context: {
            pages: {
              "asset-sync": {
                title: "Asset Sync",
                content: urlsToSync.map(url => `![Image](${url})`).join('\n\n')
              }
            }
          },
          provision_result: cloudfrontDomain ? {
            assets_cdn_domain: cloudfrontDomain
          } : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSyncResponse(data);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleStatus = async () => {
    setStatusLoading(true);
    setStatusError('');
    setStatusResponse(null);

    try {
      const response = await fetch(`https://localhost:8000/scraped-images/status/${siteIdentifier}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatusResponse(data);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setStatusLoading(false);
    }
  };

  const questionnaireImageUrls = React.useMemo(() => extractImageUrlsFromQuestionnaire(), [questionnaireData]);
  const currentImageUrls = React.useMemo(() => getImageUrls(), [syncMode, imageUrls, questionnaireData]);

  // Get preview URLs from sync response or generate them if no sync has been done
  const getPreviewUrls = (): Array<{original: string, cloudfront: string, s3_url?: string}> => {
    // If we have sync response, use the actual URLs from backend
    if (syncResponse && syncResponse.synced_images) {
      return syncResponse.synced_images.map(img => ({
        original: img.original_url,
        cloudfront: img.cloudfront_url,
        s3_url: img.s3_url
      }));
    }
    
    // Fallback: generate preview URLs (for display before syncing)
    if (!cloudfrontDomain) return [];
    
    return currentImageUrls.map((url) => {
      try {
        // Parse the original URL to preserve its structure
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;
        let path = parsedUrl.pathname;
        const query = parsedUrl.search.substring(1);
        
        // URL decode the path to preserve original case and characters
        path = decodeURIComponent(path);
        
        // Remove leading slash if present
        if (path.startsWith('/')) {
          path = path.substring(1);
        }
        
        // If no path, use a default
        if (!path) {
          path = 'image';
        }
        
        // Handle query parameters by creating a hash
        if (query) {
          const queryHash = btoa(query).substring(0, 8).replace(/[^a-zA-Z0-9]/g, '');
          
          if (path.includes('.')) {
            const lastDot = path.lastIndexOf('.');
            const namePart = path.substring(0, lastDot);
            const ext = path.substring(lastDot + 1);
            path = `${namePart}_${queryHash}.${ext}`;
          } else {
            path = `${path}_${queryHash}.jpg`;
          }
        }
        
        // URL encode the path components
        const pathParts = path.split('/');
        const encodedParts = pathParts.map(part => encodeURIComponent(part));
        const encodedPath = encodedParts.join('/');
        
        const cloudfrontUrl = `https://${cloudfrontDomain}/scraped-images/${domain}/${encodedPath}`;
        
        return {
          original: url,
          cloudfront: cloudfrontUrl
        };
      } catch (error) {
        const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
        const cloudfrontUrl = `https://${cloudfrontDomain}/scraped-images/invalid-url_${Date.now()}.${extension}`;
        
        return {
          original: url,
          cloudfront: cloudfrontUrl
        };
      }
    });
  };

  const previewUrls = React.useMemo(() => getPreviewUrls(), [syncResponse, cloudfrontDomain, currentImageUrls]);

  // Generate updated JSON with CloudFront URLs
  const generateUpdatedJson = (): string => {
    if (syncMode !== 'json' || !jsonData) return '';
    
    try {
      const parsed = JSON.parse(jsonData);
      const urlMapping = new Map(previewUrls.map(p => [p.original, p.cloudfront]));
      
      // Recursively replace URLs in the JSON
      const replaceUrls = (obj: any): any => {
        if (typeof obj === 'string') {
          return urlMapping.get(obj) || obj;
        } else if (Array.isArray(obj)) {
          return obj.map(item => replaceUrls(item));
        } else if (obj && typeof obj === 'object') {
          const newObj: any = {};
          Object.entries(obj).forEach(([key, value]) => {
            newObj[key] = replaceUrls(value);
          });
          return newObj;
        }
        return obj;
      };
      
      const updatedJson = replaceUrls(parsed);
      return JSON.stringify(updatedJson, null, 2);
    } catch (error) {
      return '';
    }
  };

  // Download updated JSON file
  const downloadUpdatedJson = () => {
    const updatedJson = generateUpdatedJson();
    if (!updatedJson) return;
    
    const blob = new Blob([updatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${siteIdentifier}-updated-images.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scraped-image-tester">
      {(prefilledBucket || prefilledCloudFront) && (
        <div className="auto-filled-notice">
          <h4>✅ Auto-filled from Provisioning</h4>
          {prefilledBucket && <p><strong>Bucket:</strong> {prefilledBucket}</p>}
          {prefilledCloudFront && <p><strong>CloudFront:</strong> {prefilledCloudFront}</p>}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="site-identifier">Site Identifier</label>
        <input
          id="site-identifier"
          type="text"
          value={siteIdentifier}
          onChange={(e) => setSiteIdentifier(e.target.value)}
          placeholder="e.g., bayareaortho"
        />
      </div>

      <div className="form-group">
        <label htmlFor="bucket-name">S3 Bucket Name</label>
        <input
          id="bucket-name"
          type="text"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          placeholder="e.g., my-site-assets"
        />
      </div>

      <div className="form-group">
        <label htmlFor="cloudfront-domain">CloudFront Domain</label>
        <input
          id="cloudfront-domain"
          type="text"
          value={cloudfrontDomain}
          onChange={(e) => setCloudfrontDomain(e.target.value)}
          placeholder="e.g., d1234567890.cloudfront.net"
        />
      </div>

      {/* Sync Mode Selection */}
      <div className="form-group">
        <label>Image Source</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              value="questionnaire"
              checked={syncMode === 'questionnaire'}
              onChange={(e) => setSyncMode(e.target.value as 'questionnaire' | 'json')}
            />
            <span>Use Questionnaire Photos ({questionnaireImageUrls.length} found)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              value="json"
              checked={syncMode === 'json'}
              onChange={(e) => setSyncMode(e.target.value as 'questionnaire' | 'json')}
            />
            <span>Upload JSON with Image URLs</span>
          </label>
        </div>
      </div>

      {/* Questionnaire Mode Display */}
      {syncMode === 'questionnaire' && (
        <div className="form-group">
          <label>Found Image URLs from Questionnaire</label>
          <div className="questionnaire-images">
            {questionnaireImageUrls.length > 0 ? (
              <ul>
                {questionnaireImageUrls.map((url, index) => (
                  <li key={index}>
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-images">No image URLs found in questionnaire data</p>
            )}
          </div>
        </div>
      )}

      {/* JSON Mode Input */}
      {syncMode === 'json' && (
        <>
          <div className="form-group">
            <label htmlFor="json-file">Upload JSON File</label>
            <input
              id="json-file"
              type="file"
              accept=".json"
              onChange={handleJsonFileUpload}
            />
            {jsonFile && <p className="file-info">📁 {jsonFile.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="image-urls">Image URLs (one per line) or JSON Data</label>
            <textarea
              id="image-urls"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              rows={6}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png&#10;&#10;Or paste JSON data containing image URLs..."
            />
          </div>
        </>
      )}

      {/* Current URLs Preview */}
      {currentImageUrls.length > 0 && (
        <div className="form-group">
          <div className="preview-header">
            <label>URLs to Sync ({currentImageUrls.length})</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="preview-toggle"
            >
              {showPreview ? '🔼 Hide Preview' : '🔽 Show CloudFront Preview'}
            </button>
          </div>
          
          {!showPreview ? (
            <div className="url-preview">
              {currentImageUrls.map((url, index) => {
                const previewMapping = previewUrls.find(p => p.original === url);
                const cloudfrontUrl = previewMapping?.cloudfront || '';
                
                return (
                  <div key={index} className="url-item">
                    <div 
                      className="image-preview-card"
                      onClick={() => {
                        if (cloudfrontUrl) {
                          navigator.clipboard.writeText(cloudfrontUrl);
                          // Visual feedback
                          const card = document.querySelector(`[data-url-index="${index}"]`) as HTMLElement;
                          if (card) {
                            card.classList.add('copied');
                            setTimeout(() => card.classList.remove('copied'), 1000);
                          }
                        }
                      }}
                      data-url-index={index}
                      title={cloudfrontUrl ? `Click to copy: ${cloudfrontUrl}` : 'CloudFront URL will be available after sync'}
                    >
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="url-info">
                        <div className="url-label">Original:</div>
                        <div className="url-link" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                          {url}
                        </div>
                        {cloudfrontUrl && (
                          <>
                            <div className="url-label cloudfront-label">CloudFront:</div>
                            <div className="cloudfront-url-preview" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                              {cloudfrontUrl}
                            </div>
                          </>
                        )}
                        <div className="copy-hint">
                          {cloudfrontUrl ? '📋 Click to copy CloudFront URL' : '⏳ Sync to get CloudFront URL'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="preview-section">
              {/* JSON Preview */}
              {syncMode === 'json' && jsonData && (
                <div className="json-preview">
                  <div className="json-preview-header">
                    <h4>📄 JSON Structure Preview</h4>
                    <div className="json-tabs">
                      <button
                        type="button"
                        className={`json-tab ${showOriginalJson ? 'active' : ''}`}
                        onClick={() => setShowOriginalJson(true)}
                      >
                        Original JSON
                      </button>
                      <button
                        type="button"
                        className={`json-tab ${!showOriginalJson ? 'active' : ''}`}
                        onClick={() => setShowOriginalJson(false)}
                      >
                        Updated JSON
                      </button>
                    </div>
                  </div>
                  
                  <pre className="json-display">
                    {showOriginalJson 
                      ? JSON.stringify(JSON.parse(jsonData || '{}'), null, 2)
                      : generateUpdatedJson() || 'CloudFront domain required to generate updated JSON'
                    }
                  </pre>
                  
                  {!showOriginalJson && generateUpdatedJson() && (
                    <div className="json-actions">
                      <button
                        type="button"
                        onClick={downloadUpdatedJson}
                        className="download-json-btn"
                      >
                        📥 Download Updated JSON
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* URL Mapping Preview */}
              <div className="url-mapping-preview">
                <h4>🔗 URL Mapping Preview</h4>
                <div className="mapping-controls">
                  <p>Original URLs → CloudFront Distribution URLs</p>
                  {cloudfrontDomain ? (
                    <p className="cloudfront-info">✅ Using CloudFront: <code>{cloudfrontDomain}</code></p>
                  ) : (
                    <p className="cloudfront-warning">⚠️ CloudFront domain required for preview</p>
                  )}
                </div>
                
                {previewUrls.length > 0 ? (
                  <div className="url-mappings">
                    {previewUrls.map((mapping, index) => {
                      const actualCloudfront = syncResponse && syncResponse.synced_images.find(img => img.original_url === mapping.original) 
                        ? syncResponse.synced_images.find(img => img.original_url === mapping.original)!.cloudfront_url 
                        : mapping.cloudfront;
                        
                      return (
                        <div key={index} className="url-mapping">
                          <div className="image-comparison">
                            <div className="image-preview-container">
                              <div className="image-preview-header">
                                <span className="mapping-label">Original Image:</span>
                              </div>
                              <img 
                                src={mapping.original} 
                                alt={`Original ${index + 1}`}
                                className="comparison-image"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="url-display">
                                <a href={mapping.original} target="_blank" rel="noopener noreferrer" className="original-url" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                  {mapping.original}
                                </a>
                              </div>
                            </div>
                            
                            <div className="mapping-arrow">→</div>
                            
                            <div 
                              className="image-preview-container clickable-cloudfront-card"
                              onClick={() => {
                                navigator.clipboard.writeText(actualCloudfront);
                                // Visual feedback
                                const card = document.querySelector(`[data-cloudfront-index="${index}"]`) as HTMLElement;
                                if (card) {
                                  card.classList.add('copied');
                                  setTimeout(() => card.classList.remove('copied'), 1000);
                                }
                              }}
                              data-cloudfront-index={index}
                              title={`Click to copy: ${actualCloudfront}`}
                            >
                              <div className="image-preview-header">
                                <span className="mapping-label">CloudFront Image:</span>
                                <div className="copy-indicator">📋 Click to copy</div>
                              </div>
                              <img 
                                src={actualCloudfront} 
                                alt={`CloudFront ${index + 1}`}
                                className="comparison-image"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="url-display">
                                <code className="cloudfront-url" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                  {actualCloudfront}
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-preview">Enter CloudFront domain to see URL preview</p>
                )}
                
                {/* Copy All URLs */}
                {previewUrls.length > 0 && (
                  <div className="copy-all-section">
                    <button
                      type="button"
                      onClick={() => {
                        const allUrls = previewUrls.map(p => p.cloudfront).join('\n');
                        navigator.clipboard.writeText(allUrls);
                      }}
                      className="copy-all-btn"
                    >
                      📋 Copy All CloudFront URLs
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleSync}
          disabled={syncLoading || !siteIdentifier || !bucketName || !cloudfrontDomain || currentImageUrls.length === 0}
          className="sync-button"
        >
          {syncLoading ? 'Syncing...' : `Sync ${currentImageUrls.length} Images`}
        </button>

        <button
          onClick={handleStatus}
          disabled={statusLoading || !siteIdentifier}
          className="status-button"
        >
          {statusLoading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {syncError && (
        <div className="error-message">
          <strong>Sync Error:</strong> {syncError}
        </div>
      )}

      {statusError && (
        <div className="error-message">
          <strong>Status Error:</strong> {statusError}
        </div>
      )}

      {syncResponse && (
        <div className="response-section">
          <h3>✅ Sync Results</h3>
          <div className="response-summary">
            <p><strong>Success:</strong> {syncResponse.success ? 'Yes' : 'No'}</p>
            <p><strong>Bucket:</strong> {syncResponse.bucket_name}</p>
            <p><strong>Images Found:</strong> {syncResponse.total_found}</p>
            <p><strong>Successfully Processed:</strong> {syncResponse.processed_count}</p>
            <p><strong>Failed:</strong> {syncResponse.failed_count}</p>
            {syncResponse.message && <p><strong>Message:</strong> {syncResponse.message}</p>}
          </div>
          
          {syncResponse.synced_images && syncResponse.synced_images.length > 0 && (
            <div className="uploaded-images">
              <h4>Successfully Synced Images:</h4>
              {syncResponse.synced_images.map((img, index) => (
                <div key={index} className="image-result">
                  <div 
                    className="image-result-preview clickable-result-card"
                    onClick={() => {
                      navigator.clipboard.writeText(img.cloudfront_url);
                      // Visual feedback
                      const card = document.querySelector(`[data-result-index="${index}"]`) as HTMLElement;
                      if (card) {
                        card.classList.add('copied');
                        setTimeout(() => card.classList.remove('copied'), 1000);
                      }
                    }}
                    data-result-index={index}
                    title={`Click to copy: ${img.cloudfront_url}`}
                  >
                    <div className="result-image-container">
                      <img 
                        src={img.cloudfront_url} 
                        alt={`Synced ${index + 1}`}
                        className="result-image"
                        onError={(e) => {
                          // Fallback to original URL if CloudFront fails
                          (e.target as HTMLImageElement).src = img.original_url;
                        }}
                      />
                      <div className="copy-overlay">
                        <div className="copy-text">📋 Click to copy CloudFront URL</div>
                      </div>
                    </div>
                    <div className="result-details">
                      <div><strong>Original:</strong> <a href={img.original_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{img.original_url}</a></div>
                      <div><strong>S3 Key:</strong> <code>{img.s3_key}</code></div>
                      <div><strong>S3 URL:</strong> <a href={img.s3_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View S3 File</a></div>
                      <div><strong>CloudFront URL:</strong> <a href={img.cloudfront_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View CloudFront File</a></div>
                      <div><strong>Content Type:</strong> {img.content_type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {syncResponse.failed_images && syncResponse.failed_images.length > 0 && (
            <div className="failed-images">
              <h4>Failed Images:</h4>
              {syncResponse.failed_images.map((img, index) => (
                <div key={index} className="image-error">
                  <div><strong>Original:</strong> <a href={img.original_url} target="_blank" rel="noopener noreferrer">{img.original_url}</a></div>
                  <div><strong>Error:</strong> {img.error}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statusResponse && (
        <div className="response-section">
          <h3>📊 Status Results</h3>
          <div className="response-summary">
            <p><strong>Site:</strong> {statusResponse.site_identifier}</p>
            <p><strong>Total Images:</strong> {statusResponse.total_images}</p>
          </div>
          
          {statusResponse.images && statusResponse.images.length > 0 && (
            <div className="status-images">
              <h4>Images in S3:</h4>
              {statusResponse.images.map((img, index) => (
                <div key={index} className="image-status">
                  <div><strong>S3 Key:</strong> {img.s3_key}</div>
                  <div><strong>Size:</strong> {img.file_size} bytes</div>
                  <div><strong>Modified:</strong> {img.last_modified}</div>
                  <div><strong>CloudFront URL:</strong> <a href={img.cloudfront_url} target="_blank" rel="noopener noreferrer">{img.cloudfront_url}</a></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedImageTester; 