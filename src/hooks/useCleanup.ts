// useCleanup Hook - manages cleanup/teardown of provisioned infrastructure
import { useState, useCallback, useMemo } from 'react';
import { useUnifiedWorkflow } from '../contexts/UnifiedWorkflowProvider';
import { cleanupService } from '../services/cleanupService';
import {
  CleanupConfig,
  CleanupResources,
  CleanupResult,
  ProvisionStepResult,
} from '../types/UnifiedWorkflowTypes';

export const useCleanup = () => {
  const { state } = useUnifiedWorkflow();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [manualCloudfrontId, setManualCloudfrontId] = useState<string>('');
  const [manualAssetsCloudfrontId, setManualAssetsCloudfrontId] = useState<string>('');

  /**
   * Get the current workflow domain (if any)
   */
  const workflowDomain = useMemo(() => {
    return state.config.siteConfig.domain || '';
  }, [state.config.siteConfig.domain]);

  /**
   * Get provision result from workflow (if any)
   */
  const provisionResult = useMemo(() => {
    return state.generatedData?.provisionResult as ProvisionStepResult | undefined;
  }, [state.generatedData]);

  /**
   * The active domain for cleanup (custom input takes precedence)
   */
  const activeDomain = useMemo(() => {
    return customDomain || workflowDomain;
  }, [customDomain, workflowDomain]);

  /**
   * Derive resources from a domain name
   * Some resources (CloudFront IDs, Pipeline name) can only be known from provision result
   * Manual CloudFront IDs can be provided for derived resources
   */
  const deriveResourcesFromDomain = useCallback((domain: string): CleanupResources => {
    if (!domain) {
      return {};
    }

    const domainSlug = domain.replace(/\./g, '-');

    // If this matches the workflow domain, use provision result for accurate IDs
    const useProvisionResult = domain === workflowDomain && provisionResult;

    return {
      s3Bucket: useProvisionResult ? provisionResult.bucket : domainSlug,
      cloudfrontDistributionId: useProvisionResult
        ? provisionResult.cloudfront_distribution_id
        : (manualCloudfrontId.trim() || undefined),
      assetsCloudfrontDistributionId: useProvisionResult
        ? provisionResult.assets_distribution_id
        : (manualAssetsCloudfrontId.trim() || undefined),
      githubRepo: domainSlug,
      pipelineName: useProvisionResult ? provisionResult.pipeline_name : `${domainSlug}-pipeline`,
    };
  }, [workflowDomain, provisionResult, manualCloudfrontId, manualAssetsCloudfrontId]);

  /**
   * Get cleanup config for the active domain
   */
  const cleanupConfig = useMemo((): CleanupConfig => {
    const resources = deriveResourcesFromDomain(activeDomain);
    return {
      domain: activeDomain,
      resources,
    };
  }, [activeDomain, deriveResourcesFromDomain]);

  /**
   * Check if there are any resources to clean up
   */
  const hasResourcesToCleanup = useMemo(() => {
    const { resources } = cleanupConfig;
    return Boolean(
      resources.s3Bucket ||
      resources.cloudfrontDistributionId ||
      resources.assetsCloudfrontDistributionId ||
      resources.githubRepo ||
      resources.pipelineName
    );
  }, [cleanupConfig]);

  /**
   * Get list of resources that will be deleted
   */
  const resourceList = useMemo(() => {
    const list: Array<{ type: string; id: string; derived?: boolean }> = [];
    const { resources } = cleanupConfig;
    const isUsingProvisionResult = activeDomain === workflowDomain && provisionResult;

    if (resources.s3Bucket) {
      list.push({
        type: 'S3 Bucket',
        id: resources.s3Bucket,
        derived: !isUsingProvisionResult,
      });
    }
    if (resources.cloudfrontDistributionId) {
      list.push({
        type: 'CloudFront Distribution',
        id: resources.cloudfrontDistributionId,
        derived: false,
      });
    }
    if (resources.assetsCloudfrontDistributionId) {
      list.push({
        type: 'Assets CloudFront',
        id: resources.assetsCloudfrontDistributionId,
        derived: false,
      });
    }
    if (resources.githubRepo) {
      list.push({
        type: 'GitHub Repository',
        id: `roostergrin/${resources.githubRepo}`,
        derived: !isUsingProvisionResult,
      });
    }
    if (resources.pipelineName) {
      list.push({
        type: 'CodePipeline',
        id: resources.pipelineName,
        derived: !isUsingProvisionResult,
      });
    }

    return list;
  }, [cleanupConfig, activeDomain, workflowDomain, provisionResult]);

  /**
   * Check if we're using derived (guessed) resource names vs actual provision result
   */
  const isUsingDerivedResources = useMemo(() => {
    return activeDomain !== workflowDomain || !provisionResult;
  }, [activeDomain, workflowDomain, provisionResult]);

  /**
   * Perform cleanup of all resources for the active domain
   */
  const performCleanup = useCallback(async (): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    setCleanupResult(null);

    try {
      const result = await cleanupService.deleteAll(cleanupConfig.domain, cleanupConfig.resources);
      setCleanupResult(result);
      return result;
    } catch (error) {
      const errorResult: CleanupResult = {
        success: false,
        deletedResources: [],
        failedResources: [{
          resource: 'All',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
      setCleanupResult(errorResult);
      return errorResult;
    } finally {
      setIsCleaningUp(false);
    }
  }, [cleanupConfig]);

  /**
   * Clear cleanup result
   */
  const clearCleanupResult = useCallback(() => {
    setCleanupResult(null);
  }, []);

  /**
   * Reset to workflow domain
   */
  const resetToWorkflowDomain = useCallback(() => {
    setCustomDomain('');
    setManualCloudfrontId('');
    setManualAssetsCloudfrontId('');
    setCleanupResult(null);
  }, []);

  return {
    // Domain management
    activeDomain,
    workflowDomain,
    customDomain,
    setCustomDomain,
    resetToWorkflowDomain,

    // Manual CloudFront ID input (for derived resources)
    manualCloudfrontId,
    setManualCloudfrontId,
    manualAssetsCloudfrontId,
    setManualAssetsCloudfrontId,

    // Resource info
    cleanupConfig,
    hasResourcesToCleanup,
    resourceList,
    isUsingDerivedResources,

    // Cleanup execution
    performCleanup,
    isCleaningUp,
    cleanupResult,
    clearCleanupResult,
  };
};

export default useCleanup;
