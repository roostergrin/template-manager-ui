import React, { useState, useEffect } from 'react';
import '../ScrapedImageTester/ScrapedImageTester.sass';

interface EnhancedImageTesterProps {
  prefilledBucket?: string;
  prefilledCloudFront?: string;
}

interface SyncResponse {
  message: string;
  uploaded_images: Array<{
    original_url: string;
    s3_key: string;
    cloudfront_url: string;
  }>;
  site_identifier: string;
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
  prefilledCloudFront
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

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncError('');
    setSyncResponse(null);

    try {
      const response = await fetch('http://localhost:8000/sync-scraped-images/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_identifier: siteIdentifier,
          bucket_name: bucketName,
          cloudfront_domain: cloudfrontDomain,
          context: {
            pages: [
              {
                title: "Test Page",
                content: imageUrls.split('\n').map(url => url.trim()).filter(url => url).map(url => `![Image](${url})`).join('\n\n')
              }
            ]
          }
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
      const response = await fetch(`http://localhost:8000/scraped-images/status/${siteIdentifier}`);
      
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

      <div className="form-group">
        <label htmlFor="image-urls">Image URLs (one per line)</label>
        <textarea
          id="image-urls"
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          rows={4}
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
        />
      </div>

      <div className="button-group">
        <button
          onClick={handleSync}
          disabled={syncLoading || !siteIdentifier || !bucketName || !cloudfrontDomain || !imageUrls}
          className="sync-button"
        >
          {syncLoading ? 'Syncing...' : 'Sync Images'}
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
            <p><strong>Message:</strong> {syncResponse.message}</p>
            <p><strong>Site:</strong> {syncResponse.site_identifier}</p>
            <p><strong>Images Uploaded:</strong> {syncResponse.uploaded_images?.length || 0}</p>
          </div>
          
          {syncResponse.uploaded_images && syncResponse.uploaded_images.length > 0 && (
            <div className="uploaded-images">
              <h4>Uploaded Images:</h4>
              {syncResponse.uploaded_images.map((img, index) => (
                <div key={index} className="image-result">
                  <div><strong>Original:</strong> <a href={img.original_url} target="_blank" rel="noopener noreferrer">{img.original_url}</a></div>
                  <div><strong>S3 Key:</strong> {img.s3_key}</div>
                  <div><strong>CloudFront URL:</strong> <a href={img.cloudfront_url} target="_blank" rel="noopener noreferrer">{img.cloudfront_url}</a></div>
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