import React, { useState } from 'react';
import api from '../../services/apiService';
import './ScrapedImageTester.sass';

interface SyncedImage {
  success: boolean;
  original_url: string;
  s3_key: string;
  cloudfront_url: string;
  content_type: string;
}

interface FailedImage {
  success: boolean;
  original_url: string;
  error: string;
}

interface SyncResponse {
  success: boolean;
  processed_count: number;
  failed_count: number;
  synced_images: SyncedImage[];
  failed_images: FailedImage[];
  total_found: number;
  cloudfront_domain?: string;
  bucket_name: string;
  message?: string;
}

interface StatusImage {
  s3_key: string;
  size: number;
  last_modified: string;
  original_url: string;
  content_type: string;
  upload_timestamp?: string;
}

interface StatusResponse {
  site_identifier: string;
  bucket_name: string;
  total_images: number;
  images: StatusImage[];
  retrieved_at: string;
}

const ScrapedImageTester: React.FC = () => {
  const [siteIdentifier, setSiteIdentifier] = useState('test-site');
  const [bucketName, setBucketName] = useState('');
  const [cloudFrontDomain, setCloudFrontDomain] = useState('');
  const [imageUrls, setImageUrls] = useState('https://via.placeholder.com/800x600/0066cc/ffffff?text=Sample+Image+1\nhttps://via.placeholder.com/400x300/cc6600/ffffff?text=Sample+Image+2');
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [statusResult, setStatusResult] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMockContext = (urls: string[]) => {
    const markdown = urls.map((url, index) => `![Test Image ${index + 1}](${url})`).join('\n\n');
    return {
      pages: {
        home: markdown,
        about: "Some text content here"
      },
      global: {
        site_name: "Test Site",
        description: "Test site for image sync"
      }
    };
  };

  const handleSyncImages = async () => {
    if (!siteIdentifier.trim()) {
      setError('Site identifier is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const urls = imageUrls.split('\n').filter(url => url.trim());
      const context = createMockContext(urls);

      const requestData: any = {
        context,
        site_identifier: siteIdentifier
      };

      if (bucketName.trim()) {
        requestData.bucket_name = bucketName;
      }

      if (cloudFrontDomain.trim()) {
        requestData.provision_result = {
          assets_cdn_domain: cloudFrontDomain,
          assets_distribution_url: `https://${cloudFrontDomain}`
        };
      }

      console.log('Sending request:', requestData);

      const response = await api.post<SyncResponse>('/sync-scraped-images/', requestData);
      setSyncResult(response);
      console.log('Sync response:', response);
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to sync images');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!siteIdentifier.trim()) {
      setError('Site identifier is required');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusResult(null);

    try {
      const params = new URLSearchParams();
      if (bucketName.trim()) {
        params.append('bucket_name', bucketName);
      }

      const url = `/scraped-images/status/${siteIdentifier}${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Checking status at:', url);

      const response = await api.get<StatusResponse>(url);
      setStatusResult(response);
      console.log('Status response:', response);
    } catch (err: any) {
      console.error('Status error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to get status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="scraped-image-tester">
      <div className="scraped-image-tester__header">
        <h2>🖼️ Scraped Image Sync Tester</h2>
        <p>Test the scraped image sync endpoints to upload images to S3 and get CloudFront URLs</p>
      </div>

      <div className="scraped-image-tester__form">
        <div className="form-group">
          <label htmlFor="siteIdentifier">Site Identifier *</label>
          <input
            id="siteIdentifier"
            type="text"
            value={siteIdentifier}
            onChange={(e) => setSiteIdentifier(e.target.value)}
            placeholder="e.g., test-site, my-dental-practice"
          />
          <small>Used as a prefix for S3 filenames</small>
        </div>

        <div className="form-group">
          <label htmlFor="bucketName">S3 Bucket Name (Optional)</label>
          <input
            id="bucketName"
            type="text"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            placeholder="Leave empty to use default bucket"
          />
          <small>Custom S3 bucket name, uses default if empty</small>
        </div>

        <div className="form-group">
          <label htmlFor="cloudFrontDomain">CloudFront Domain (Optional)</label>
          <input
            id="cloudFrontDomain"
            type="text"
            value={cloudFrontDomain}
            onChange={(e) => setCloudFrontDomain(e.target.value)}
            placeholder="e.g., d123abc.cloudfront.net"
          />
          <small>CloudFront distribution domain for CDN URLs</small>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrls">Test Image URLs (one per line)</label>
          <textarea
            id="imageUrls"
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
            rows={6}
          />
          <small>Enter image URLs to test (one per line). Default URLs are placeholder images that should work.</small>
        </div>

        <div className="scraped-image-tester__actions">
          <button
            onClick={handleSyncImages}
            disabled={loading}
            className="btn btn--primary"
          >
            {loading ? '🔄 Syncing...' : '📤 Sync Images to S3'}
          </button>

          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="btn btn--secondary"
          >
            {loading ? '🔄 Checking...' : '📊 Check Status'}
          </button>
        </div>
      </div>

      {error && (
        <div className="scraped-image-tester__error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {syncResult && (
        <div className="scraped-image-tester__result">
          <h3>✅ Sync Results</h3>
          <div className="result-summary">
            <div className="summary-item">
              <span className="label">Success:</span>
              <span className={`value ${syncResult.success ? 'success' : 'error'}`}>
                {syncResult.success ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Total Found:</span>
              <span className="value">{syncResult.total_found}</span>
            </div>
            <div className="summary-item">
              <span className="label">Processed:</span>
              <span className="value success">{syncResult.processed_count}</span>
            </div>
            <div className="summary-item">
              <span className="label">Failed:</span>
              <span className="value error">{syncResult.failed_count}</span>
            </div>
            <div className="summary-item">
              <span className="label">Bucket:</span>
              <span className="value">{syncResult.bucket_name}</span>
            </div>
            {syncResult.cloudfront_domain && (
              <div className="summary-item">
                <span className="label">CloudFront:</span>
                <span className="value">{syncResult.cloudfront_domain}</span>
              </div>
            )}
          </div>

          {syncResult.message && (
            <div className="result-message">
              <p>{syncResult.message}</p>
            </div>
          )}

          {syncResult.synced_images.length > 0 && (
            <div className="synced-images">
              <h4>✅ Successfully Synced Images</h4>
              {syncResult.synced_images.map((image, index) => (
                <div key={index} className="image-item">
                  <div className="image-details">
                    <div className="detail-row">
                      <span className="label">Original URL:</span>
                      <span className="value">
                        <a href={image.original_url} target="_blank" rel="noopener noreferrer">
                          {image.original_url}
                        </a>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">S3 Key:</span>
                      <span className="value">
                        {image.s3_key}
                        <button
                          onClick={() => copyToClipboard(image.s3_key)}
                          className="copy-btn"
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">CloudFront URL:</span>
                      <span className="value">
                        <a href={image.cloudfront_url} target="_blank" rel="noopener noreferrer">
                          {image.cloudfront_url}
                        </a>
                        <button
                          onClick={() => copyToClipboard(image.cloudfront_url)}
                          className="copy-btn"
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Content Type:</span>
                      <span className="value">{image.content_type}</span>
                    </div>
                  </div>
                  <div className="image-preview">
                    <img
                      src={image.cloudfront_url}
                      alt="Synced image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {syncResult.failed_images.length > 0 && (
            <div className="failed-images">
              <h4>❌ Failed Images</h4>
              {syncResult.failed_images.map((image, index) => (
                <div key={index} className="image-item error">
                  <div className="detail-row">
                    <span className="label">URL:</span>
                    <span className="value">{image.original_url}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Error:</span>
                    <span className="value error">{image.error}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statusResult && (
        <div className="scraped-image-tester__result">
          <h3>📊 Status Results</h3>
          <div className="result-summary">
            <div className="summary-item">
              <span className="label">Site:</span>
              <span className="value">{statusResult.site_identifier}</span>
            </div>
            <div className="summary-item">
              <span className="label">Bucket:</span>
              <span className="value">{statusResult.bucket_name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Images:</span>
              <span className="value">{statusResult.total_images}</span>
            </div>
            <div className="summary-item">
              <span className="label">Retrieved At:</span>
              <span className="value">{new Date(statusResult.retrieved_at).toLocaleString()}</span>
            </div>
          </div>

          {statusResult.images.length > 0 && (
            <div className="status-images">
              <h4>🖼️ Stored Images</h4>
              {statusResult.images.map((image, index) => (
                <div key={index} className="image-item">
                  <div className="detail-row">
                    <span className="label">S3 Key:</span>
                    <span className="value">
                      {image.s3_key}
                      <button
                        onClick={() => copyToClipboard(image.s3_key)}
                        className="copy-btn"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Original URL:</span>
                    <span className="value">
                      <a href={image.original_url} target="_blank" rel="noopener noreferrer">
                        {image.original_url}
                      </a>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Size:</span>
                    <span className="value">{(image.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Content Type:</span>
                    <span className="value">{image.content_type}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Last Modified:</span>
                    <span className="value">{new Date(image.last_modified).toLocaleString()}</span>
                  </div>
                  {image.upload_timestamp && (
                    <div className="detail-row">
                      <span className="label">Upload Time:</span>
                      <span className="value">{new Date(image.upload_timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {statusResult.images.length === 0 && (
            <div className="no-images">
              <p>No images found for site identifier "{statusResult.site_identifier}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScrapedImageTester; 