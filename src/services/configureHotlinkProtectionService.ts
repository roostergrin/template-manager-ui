import apiClient from './apiService';

export interface ConfigureHotlinkProtectionRequest {
  bucket_name: string;
  cloudfront_distribution_arn?: string;
}

export interface ConfigureHotlinkProtectionResponse {
  success: boolean;
  message: string;
  bucket_name?: string;
  policy_applied?: boolean;
}

/**
 * Configure S3 bucket policy to allow access only from CloudFront
 * This prevents direct access to S3 bucket URLs (hotlinking)
 *
 * @param request - Configuration with bucket name and optional CloudFront ARN
 * @returns Response indicating success or failure
 */
const configureHotlinkProtection = async (
  request: ConfigureHotlinkProtectionRequest
): Promise<ConfigureHotlinkProtectionResponse> => {
  return await apiClient.post<ConfigureHotlinkProtectionResponse>(
    '/configure-s3-hotlink-protection/',
    request
  );
};

export default configureHotlinkProtection;
