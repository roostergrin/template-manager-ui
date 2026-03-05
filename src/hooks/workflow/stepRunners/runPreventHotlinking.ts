import { startAndPollAsyncJob } from '../../../services/apiService';
import { createTimer } from '../../../utils/workflowLogger';
import { StepLogger } from '../../../utils/workflowLogger';
import {
  ImagePickerResult,
  ContentStepResult,
  ProvisionStepResult,
  ThemeStepResult,
  HotlinkProtectionResult,
} from '../../../types/UnifiedWorkflowTypes';
import { domainToSlug } from '../../../utils/domainUtils';
import { StepResult, StepRunnerDeps, isResponseSuccessful } from './stepRunnerTypes';

// Helper function to replace URLs in a JSON object recursively
function replaceUrlsInObject(obj: unknown, urlMap: Map<string, string>): unknown {
  if (typeof obj === 'string') {
    // Check if this string contains any of the original URLs
    let result = obj;
    for (const [originalUrl, cloudfrontUrl] of urlMap) {
      if (result.includes(originalUrl)) {
        result = result.split(originalUrl).join(cloudfrontUrl);
      }
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceUrlsInObject(item, urlMap));
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceUrlsInObject(value, urlMap);
    }
    return result;
  }
  return obj;
}

export async function runPreventHotlinking(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const siteConfig = deps.actions.getSiteConfigSync();

  // Check for edited input data first
  const editedInput = deps.editedInputDataRef.current['prevent-hotlinking'] as {
    pages?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    globalData?: Record<string, unknown>;
    config?: { siteIdentifier?: string; bucketName?: string; cloudFrontDomain?: string };
  } | undefined;

  let pageData: Record<string, unknown> | undefined;
  let themeData: Record<string, unknown> | undefined;
  let globalData: Record<string, unknown> | undefined;
  let bucketName: string;
  let cloudfrontDomain: string | undefined;

  if (editedInput) {
    logger.logProcessing('Using edited input data from pre-step editor');
    pageData = editedInput.pages;
    themeData = editedInput.theme;
    globalData = editedInput.globalData;
    bucketName = editedInput.config?.bucketName || editedInput.config?.siteIdentifier || domainToSlug(siteConfig.domain);
    cloudfrontDomain = editedInput.config?.cloudFrontDomain;
  } else {
    // Use original data sources
    const imagePickerResult = deps.getGeneratedData<ImagePickerResult>('imagePickerResult');
    const contentResult = deps.getGeneratedData<ContentStepResult>('contentResult');
    const provisionResult = deps.getGeneratedData<ProvisionStepResult>('provisionResult');
    const themeResult = deps.getGeneratedData<ThemeStepResult>('themeResult');

    // Get the page data (prefer image picker result which has updated images)
    pageData = imagePickerResult?.pageData || contentResult?.pageData;

    // Get globalData from content result
    globalData = contentResult?.globalData as Record<string, unknown> | undefined;

    // Extract bucket name and CloudFront domain from provision step (step 3)
    // Use provision result values if available, otherwise fall back to derived values
    bucketName = provisionResult?.bucket || domainToSlug(siteConfig.domain);

    // Use assets_cdn_domain directly if available, otherwise extract from assets_distribution_url
    cloudfrontDomain = provisionResult?.assets_cdn_domain;
    if (!cloudfrontDomain && provisionResult?.assets_distribution_url) {
      try {
        cloudfrontDomain = new URL(provisionResult.assets_distribution_url).hostname;
      } catch {
        // Invalid URL, leave undefined
      }
    }

    logger.logProcessing(`Provision result available: ${!!provisionResult}`);
    if (provisionResult) {
      logger.logProcessing(`Provision keys: ${Object.keys(provisionResult).join(', ')}`);
    }

    // Include theme data if available (logo_url, favicon_url will be synced to S3)
    themeData = themeResult?.theme as Record<string, unknown> | undefined;
  }

  if (!pageData) {
    logger.logProcessing('No page data available, skipping image sync');
    return { success: true, data: { skipped: true, message: 'No page data to sync' } };
  }

  logger.logProcessing(`Using bucket: ${bucketName}`);
  if (cloudfrontDomain) {
    logger.logProcessing(`CloudFront domain: ${cloudfrontDomain}`);
  }

  if (themeData) {
    const logoUrl = (themeData.default as Record<string, unknown>)?.logo_url || themeData.logo_url;
    const faviconUrl = (themeData.default as Record<string, unknown>)?.favicon_url || themeData.favicon_url;
    logger.logProcessing(`Theme data included - logo: ${logoUrl ? 'yes' : 'no'}, favicon: ${faviconUrl ? 'yes' : 'no'}`);
  }

  // Log what data we're sending
  logger.logProcessing(`--- Data being sent to sync ---`);
  logger.logProcessing(`Pages data keys: ${pageData ? Object.keys(pageData).join(', ') : 'none'}`);
  logger.logProcessing(`Pages count: ${pageData ? Object.keys(pageData).length : 0}`);
  logger.logProcessing(`GlobalData included: ${globalData ? 'yes' : 'no'}`);
  if (globalData) {
    logger.logProcessing(`GlobalData keys: ${Object.keys(globalData).join(', ')}`);
  }
  if (themeData) {
    const themeDefault = themeData.default as Record<string, unknown> | undefined;
    logger.logProcessing(`Theme logo_url: ${themeDefault?.logo_url || themeData.logo_url || 'none'}`);
    logger.logProcessing(`Theme favicon_url: ${themeDefault?.favicon_url || themeData.favicon_url || 'none'}`);
  } else {
    logger.logProcessing(`Theme data: none`);
  }

  const endpoint = '/sync-scraped-images/';
  const payload = {
    site_identifier: bucketName,
    bucket_name: bucketName,
    context: {
      pages: pageData,
      theme: themeData,
      globalData: globalData,
    },
    provision_result: cloudfrontDomain ? {
      assets_cdn_domain: cloudfrontDomain
    } : undefined
  };

  try {
    logger.logApiRequest(endpoint, payload);
    const apiTimer = createTimer();

    const response = await startAndPollAsyncJob<HotlinkProtectionResult>(
      endpoint + 'start/',
      payload,
      { onProgress: (s) => logger.logProcessing(`Syncing images... (${s}s)`) },
    );

    logger.logApiResponse(response, apiTimer.elapsed());

    // Log response structure for debugging
    logger.logProcessing(`Response keys: ${Object.keys(response).join(', ')}`);
    logger.logProcessing(`Total images found: ${response.total_found ?? 'undefined'}`);
    logger.logProcessing(`Successfully synced: ${response.processed_count ?? 0}`);
    logger.logProcessing(`Failed: ${response.failed_count ?? 0}`);
    if (response.cloudfront_domain) {
      logger.logProcessing(`CloudFront domain: ${response.cloudfront_domain}`);
    }

    // Log failed images with their errors
    if (response.failed_images && response.failed_images.length > 0) {
      logger.logProcessing(`--- Failed Images ---`);
      for (const failedImg of response.failed_images) {
        logger.logProcessing(`❌ ${failedImg.original_url}`);
        logger.logProcessing(`   Error: ${failedImg.error}`);
      }
    }

    // Log successful syncs
    if (response.synced_images && response.synced_images.length > 0) {
      logger.logProcessing(`--- Successfully Synced ---`);
      for (const img of response.synced_images) {
        logger.logProcessing(`✓ ${img.original_url}`);
        logger.logProcessing(`  → ${img.cloudfront_url}`);
      }
    }

    // Build URL mapping from synced images
    const urlMap = new Map<string, string>();
    if (response.synced_images && response.synced_images.length > 0) {
      for (const img of response.synced_images) {
        if (img.success && img.original_url && img.cloudfront_url) {
          urlMap.set(img.original_url, img.cloudfront_url);
        }
      }
      logger.logProcessing(`Built URL map with ${urlMap.size} CloudFront replacements`);
    } else {
      logger.logProcessing('No images were successfully synced to S3');
    }

    // Replace URLs in pages, theme, and globalData
    let updatedPages: Record<string, unknown> | undefined;
    let updatedTheme: Record<string, unknown> | undefined;
    let updatedGlobalData: Record<string, unknown> | undefined;

    if (urlMap.size > 0) {
      // Replace URLs in page data
      if (pageData) {
        updatedPages = replaceUrlsInObject(pageData, urlMap) as Record<string, unknown>;
        logger.logProcessing('Replaced URLs in pages data with CloudFront URLs');
      }

      // Replace URLs in theme data
      if (themeData) {
        updatedTheme = replaceUrlsInObject(themeData, urlMap) as Record<string, unknown>;
        logger.logProcessing('Replaced URLs in theme data with CloudFront URLs');
      }

      // Replace URLs in globalData
      if (globalData) {
        updatedGlobalData = replaceUrlsInObject(globalData, urlMap) as Record<string, unknown>;
        logger.logProcessing('Replaced URLs in globalData with CloudFront URLs');
      }
    } else {
      logger.logProcessing('No URL replacements needed - using original data');
      // Use original data when no URLs were replaced
      updatedPages = pageData;
      updatedTheme = themeData;
      updatedGlobalData = globalData;
    }

    // Always store the pages, theme, and globalData for download
    if (updatedPages) {
      logger.logProcessing(`Storing hotlinkPagesResult with ${Object.keys(updatedPages).length} pages`);
      deps.setGeneratedDataWithRef('hotlinkPagesResult', updatedPages);
    } else {
      logger.logProcessing('WARNING: No pages data to store');
    }

    if (updatedTheme) {
      logger.logProcessing(`Storing hotlinkThemeResult`);
      deps.setGeneratedDataWithRef('hotlinkThemeResult', updatedTheme);
    } else {
      logger.logProcessing('No theme data to store (this may be normal)');
    }

    if (updatedGlobalData) {
      logger.logProcessing(`Storing hotlinkGlobalDataResult`);
      deps.setGeneratedDataWithRef('hotlinkGlobalDataResult', updatedGlobalData);
    } else {
      logger.logProcessing('No globalData to store (this may be normal)');
    }

    // Store the full response with updated data
    const enrichedResponse: HotlinkProtectionResult = {
      ...response,
      updatedPages,
      updatedTheme,
      updatedGlobalData,
    };

    deps.setGeneratedDataWithRef('hotlinkResult', enrichedResponse);

    // Generate summary message
    const totalFound = response.total_found ?? 0;
    const processed = response.processed_count ?? 0;
    const failed = response.failed_count ?? 0;

    if (totalFound === 0) {
      logger.logProcessing(`⚠️ No images found in pages or theme data`);
    } else if (processed === 0 && failed > 0) {
      logger.logProcessing(`❌ All ${failed} image(s) failed to sync`);
    } else if (failed > 0) {
      logger.logProcessing(`⚠️ Partial success: ${processed}/${totalFound} synced, ${failed} failed`);
    } else {
      logger.logProcessing(`✓ Sync complete: ${processed} image(s) synced successfully`);
    }

    // Consider it successful as long as we have pages data to return
    // Even if images fail, we still want to proceed with the original URLs
    return { success: isResponseSuccessful(response as Record<string, unknown>), data: enrichedResponse };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Image sync failed' };
  }
}
