// Mock data for Provision step
import { ProvisionStepResult } from '../../types/UnifiedWorkflowTypes';

const generateMockId = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const createMockProvisionResult = (bucketName: string): ProvisionStepResult => {
  const distributionId = `E${generateMockId(13)}`;
  const assetsDistributionId = `E${generateMockId(13)}`;

  return {
    success: true,
    bucket: bucketName,
    cloudfront_distribution_id: distributionId,
    cloudfront_distribution_url: `https://${generateMockId(13).toLowerCase()}.cloudfront.net`,
    pipeline_name: `${bucketName}-pipeline`,
    assets_cdn_domain: `${generateMockId(13).toLowerCase()}.cloudfront.net`,
    assets_distribution_id: assetsDistributionId,
    assets_distribution_url: `https://${generateMockId(13).toLowerCase()}.cloudfront.net`,
    redirect_function_arn: `arn:aws:cloudfront::123456789012:function/redirect-${bucketName}`,
    redirect_function_name: `redirect-${bucketName}`,
    redirect_status: 'Configured',
    redirect_type: 'General www redirect',
    already_existed: {
      s3_bucket: false,
      cloudfront_distribution: false,
      codebuild_role: true,
      codebuild_project: false,
      artifacts_bucket: false,
      assets_distribution: false,
    },
    message: '[MOCK] Infrastructure provisioned successfully',
  };
};
