// Mock data for Hotlink Protection step
import { HotlinkProtectionResult, SyncedImage, FailedImage } from '../../types/UnifiedWorkflowTypes';

// Extract image URLs from a pages object (recursively searches for URLs)
const extractImageUrls = (obj: unknown): string[] => {
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"')\]]+\.(jpg|jpeg|png|gif|webp|svg)/gi;

  if (typeof obj === 'string') {
    const matches = obj.match(urlRegex);
    if (matches) {
      urls.push(...matches);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...extractImageUrls(item));
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      urls.push(...extractImageUrls(value));
    }
  }

  // Return unique URLs
  return [...new Set(urls)];
};

interface SyncScrapedImagesRequest {
  site_identifier: string;
  bucket_name: string;
  context?: {
    pages?: Record<string, unknown>;
    theme?: Record<string, unknown>;
  };
  provision_result?: {
    assets_cdn_domain?: string;
  };
}

export const createMockHotlinkResult = (
  bucketName: string,
  request?: SyncScrapedImagesRequest
): HotlinkProtectionResult => {
  // Extract image URLs from pages and theme if provided
  const imageUrls: string[] = [];

  if (request?.context?.pages) {
    imageUrls.push(...extractImageUrls(request.context.pages));
  }
  if (request?.context?.theme) {
    imageUrls.push(...extractImageUrls(request.context.theme));
  }

  // Generate mock CloudFront domain
  const cloudfrontDomain = request?.provision_result?.assets_cdn_domain || `d1234567890.cloudfront.net`;

  // Create synced images with CloudFront URLs
  const syncedImages: SyncedImage[] = imageUrls.map((url, index) => {
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || `image-${index}.jpg`;
    const s3Key = `images/${bucketName}/${filename}`;

    return {
      success: true,
      original_url: url,
      s3_key: s3Key,
      cloudfront_url: `https://${cloudfrontDomain}/${s3Key}`,
      content_type: url.endsWith('.png') ? 'image/png' :
                   url.endsWith('.gif') ? 'image/gif' :
                   url.endsWith('.webp') ? 'image/webp' :
                   url.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
    };
  });

  const failedImages: FailedImage[] = [];

  return {
    success: true,
    message: `[MOCK] Synced ${syncedImages.length} images to S3 bucket: ${bucketName}`,
    processed_count: syncedImages.length,
    failed_count: failedImages.length,
    synced_images: syncedImages,
    failed_images: failedImages,
    total_found: imageUrls.length,
    cloudfront_domain: cloudfrontDomain,
    bucket_name: bucketName,
  };
};
