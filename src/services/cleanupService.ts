// Cleanup Service - handles teardown of provisioned infrastructure
import apiClient from './apiService';
import { CleanupResources, CleanupResult } from '../types/UnifiedWorkflowTypes';

interface DeleteS3BucketRequest {
  bucket_name: string;
  force: boolean;
}

interface DeleteGithubRepoRequest {
  owner: string;
  repo: string;
}

interface DeleteCloudfrontRequest {
  distribution_id: string;
}

interface DeletePipelineRequest {
  pipeline_name: string;
}

interface CleanupResponse {
  success: boolean;
  message?: string;
}

export const cleanupService = {
  /**
   * Delete an S3 bucket
   */
  deleteS3Bucket: async (bucketName: string, force = true): Promise<CleanupResponse> => {
    return apiClient.delete<CleanupResponse>('/cleanup/s3-bucket/', {
      data: { bucket_name: bucketName, force } as DeleteS3BucketRequest,
    });
  },

  /**
   * Delete a GitHub repository
   */
  deleteGithubRepo: async (owner: string, repo: string): Promise<CleanupResponse> => {
    return apiClient.delete<CleanupResponse>('/cleanup/github-repo/', {
      data: { owner, repo } as DeleteGithubRepoRequest,
    });
  },

  /**
   * Delete a CloudFront distribution
   */
  deleteCloudfront: async (distributionId: string): Promise<CleanupResponse> => {
    return apiClient.delete<CleanupResponse>('/cleanup/cloudfront/', {
      data: { distribution_id: distributionId } as DeleteCloudfrontRequest,
    });
  },

  /**
   * Delete a CodePipeline
   */
  deletePipeline: async (pipelineName: string): Promise<CleanupResponse> => {
    return apiClient.delete<CleanupResponse>('/cleanup/pipeline/', {
      data: { pipeline_name: pipelineName } as DeletePipelineRequest,
    });
  },

  /**
   * Delete all resources for a domain
   * Deletes in correct order: CloudFront -> Pipeline -> S3 -> GitHub
   */
  deleteAll: async (domain: string, resources: CleanupResources): Promise<CleanupResult> => {
    const result: CleanupResult = {
      success: true,
      deletedResources: [],
      failedResources: [],
    };

    // 1. Delete CloudFront distributions first (they reference S3)
    if (resources.cloudfrontDistributionId) {
      try {
        await cleanupService.deleteCloudfront(resources.cloudfrontDistributionId);
        result.deletedResources.push(`CloudFront: ${resources.cloudfrontDistributionId}`);
      } catch (error) {
        result.success = false;
        result.failedResources.push({
          resource: `CloudFront: ${resources.cloudfrontDistributionId}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (resources.assetsCloudfrontDistributionId) {
      try {
        await cleanupService.deleteCloudfront(resources.assetsCloudfrontDistributionId);
        result.deletedResources.push(`Assets CloudFront: ${resources.assetsCloudfrontDistributionId}`);
      } catch (error) {
        result.success = false;
        result.failedResources.push({
          resource: `Assets CloudFront: ${resources.assetsCloudfrontDistributionId}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 2. Delete Pipeline
    if (resources.pipelineName) {
      try {
        await cleanupService.deletePipeline(resources.pipelineName);
        result.deletedResources.push(`Pipeline: ${resources.pipelineName}`);
      } catch (error) {
        result.success = false;
        result.failedResources.push({
          resource: `Pipeline: ${resources.pipelineName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 3. Delete S3 bucket
    if (resources.s3Bucket) {
      try {
        await cleanupService.deleteS3Bucket(resources.s3Bucket);
        result.deletedResources.push(`S3 Bucket: ${resources.s3Bucket}`);
      } catch (error) {
        result.success = false;
        result.failedResources.push({
          resource: `S3 Bucket: ${resources.s3Bucket}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 4. Delete GitHub repo last
    if (resources.githubRepo) {
      try {
        await cleanupService.deleteGithubRepo('roostergrin', resources.githubRepo);
        result.deletedResources.push(`GitHub Repo: ${resources.githubRepo}`);
      } catch (error) {
        result.success = false;
        result.failedResources.push({
          resource: `GitHub Repo: ${resources.githubRepo}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  },
};

export default cleanupService;
