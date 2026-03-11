import { startAndPollAsyncJob } from '../../../services/apiService';
import { StepLogger } from '../../../utils/workflowLogger';
import { ContentStepResult } from '../../../types/UnifiedWorkflowTypes';
import {
  parseJsonForImages,
  updateImageSlot,
  getImageKitUrl,
  getSlotsNeedingImages,
  ImageSlot,
  ImageAgentResponse,
} from '../../../utils/jsonImageAnalyzer';
import { StepResult, StepRunnerDeps } from './stepRunnerTypes';

export async function runImagePicker(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const contentResult = deps.getGeneratedData<ContentStepResult>('contentResult');

  // Log what we have available for debugging
  logger.logProcessing(`Content result keys: ${contentResult ? Object.keys(contentResult).join(', ') : 'undefined'}`);

  // Check if there's edited input data for this step (from manual mode editing)
  // Use ref for immediate access since state updates are async
  const editedInputData = deps.editedInputDataRef.current['image-picker'];
  let pagesData: Record<string, unknown> | undefined;

  if (editedInputData !== undefined) {
    // Use edited input data instead of generated data
    logger.logProcessing('Using edited input data from manual mode');
    // The editor panel wraps the data as {pageData: {...}, config: {...}}
    const editedInputAny = editedInputData as Record<string, unknown>;
    if (editedInputAny.pageData) {
      // Unwrap the pageData from the editor's wrapper
      pagesData = editedInputAny.pageData as Record<string, unknown>;
      logger.logProcessing('Unwrapped pageData from editor wrapper');
    } else {
      // Use directly if not wrapped
      pagesData = editedInputData as Record<string, unknown>;
    }
    // Clear the edited data after using it (both ref and state)
    delete deps.editedInputDataRef.current['image-picker'];
    deps.clearEditedInputData();
  } else {
    // Check for page data under different possible keys
    // The API might return data as 'pageData', 'pages', or wrapped in a 'pages' object
    const contentResultAny = contentResult as Record<string, unknown> | undefined;
    pagesData = contentResultAny?.pageData as Record<string, unknown> ||
                      contentResultAny?.pages as Record<string, unknown> ||
                      (contentResultAny?.pages as Record<string, unknown>)?.pages as Record<string, unknown>;
  }

  if (!pagesData) {
    const availableKeys = contentResult ? Object.keys(contentResult).join(', ') : 'none';
    return { success: false, error: `No content data available. Available keys: ${availableKeys}` };
  }

  const pagesDataRecord = pagesData as Record<string, unknown>;
  logger.logProcessing(`Found page data with ${Object.keys(pagesDataRecord).length} pages`);

  // Debug: Verify preserve_image is present in the content result
  logger.logProcessing('📸 [Image Picker] Verifying preserve_image in content result:');
  let totalWithPreserveImage = 0;
  for (const [pageName, pageData] of Object.entries(pagesDataRecord)) {
    if (Array.isArray(pageData)) {
      const sectionsWithTrue = pageData.filter((s: Record<string, unknown>) => s.preserve_image === true).length;
      if (sectionsWithTrue > 0) {
        logger.logProcessing(`  📸 ${pageName}: ${sectionsWithTrue}/${pageData.length} sections have preserve_image=true`);
        totalWithPreserveImage += sectionsWithTrue;
      }
    }
  }
  if (totalWithPreserveImage === 0) {
    logger.logProcessing('  ⚠️ WARNING: No sections have preserve_image=true! Images may be replaced incorrectly.');
  }

  try {
    // Debug: Log preserve_image status on incoming data
    logger.logProcessing('📸 [Image Picker] Checking preserve_image on sections:');
    for (const [pageName, pageData] of Object.entries(pagesDataRecord)) {
      if (Array.isArray(pageData)) {
        pageData.forEach((section: Record<string, unknown>, idx: number) => {
          const preserveImage = section.preserve_image;
          const layout = section.acf_fc_layout || 'unknown';
          if (preserveImage !== undefined) {
            logger.logProcessing(`  📸 ${pageName}[${idx}] (${layout}): preserve_image=${preserveImage}`);
          }
        });
      }
    }

    // Parse the JSON to find all image slots (json-analyzer approach)
    const parsedJson = parseJsonForImages(pagesDataRecord);
    logger.logProcessing(`Parsed ${parsedJson.totalImages} total images, ${parsedJson.totalImagesNeeded} need replacement`);

    // Debug: Log which slots are marked as preserved
    let preservedCount = 0;
    for (const page of parsedJson.pages) {
      for (const section of page.sections) {
        for (const slot of section.imageSlots) {
          if (slot.preserveImage) {
            logger.logProcessing(`  🔒 Preserved: ${slot.path}`);
            preservedCount++;
          }
        }
      }
    }
    logger.logProcessing(`Total preserved image slots: ${preservedCount}`);

    // Get slots that need images (excluding preserved ones)
    // Always include existing images for replacement - the per-section preserve_image flag
    // handles which specific images should be preserved (skipped in getSlotsNeedingImages)
    const includeExistingImages = true;
    logger.logProcessing(`Replacing all images except ${preservedCount} preserved slots`);
    const slotsNeedingImages = getSlotsNeedingImages(parsedJson, includeExistingImages);
    logger.logProcessing(`Processing ${slotsNeedingImages.length} image slots (includeExisting: ${includeExistingImages}, preserved skipped: ${preservedCount})`);

    if (slotsNeedingImages.length === 0) {
      logger.logProcessing('No images need replacement');
      // Return raw data structure (same as input)
      deps.setGeneratedDataWithRef('imagePickerResult', { success: true, pageData: pagesDataRecord });
      return { success: true, data: pagesDataRecord };
    }

    // Process slots in batches to call image-agent for each
    const BATCH_SIZE = 20;
    let updatedJson = pagesDataRecord;
    const usedImageIds = new Set<number>();
    let processedCount = 0;
    let successCount = 0;

    // Helper to search for images for a single slot
    const searchForSlot = async (slot: ImageSlot): Promise<ImageAgentResponse | null> => {
      try {
        const searchTitle = slot.sectionTitle || 'Image';
        const searchCategory = slot.contextCategory || 'general';

        const layoutLower = (slot.sectionLayout || '').toLowerCase();
        let imageType = 'general';
        if (layoutLower.includes('hero')) imageType = 'hero';
        else if (layoutLower.includes('thumbnail')) imageType = 'thumbnail';
        else if (layoutLower.includes('background')) imageType = 'background';

        const searchBody = slot.sectionDescription || '';

        const requestBody = {
          title: searchTitle,
          body: searchBody,
          category: searchCategory,
          keywords: [],
          image_type: imageType,
          licensed_limit: 15,
          catalog_limit: 10,
          use_agent_reasoning: true,
          raw_section_data: slot.rawSectionData,
          exclude_ids: Array.from(usedImageIds),
        };

        const response = await startAndPollAsyncJob<ImageAgentResponse>(
          '/adobe/image-agent/find-images/start/',
          requestBody,
          { pollIntervalMs: 3000 },
        );

        return response;
      } catch (err) {
        console.error(`Search failed for slot ${slot.id}:`, err);
        return null;
      }
    };

    // Process in batches
    for (let i = 0; i < slotsNeedingImages.length; i += BATCH_SIZE) {
      const batch = slotsNeedingImages.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(slotsNeedingImages.length / BATCH_SIZE);

      logger.logProcessing(`Batch ${batchNum}/${totalBatches}: Searching for ${batch.length} images...`);

      // Run batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(slot => searchForSlot(slot))
      );

      // Process results and auto-select images
      batchResults.forEach((result, index) => {
        const slot = batch[index];
        processedCount++;

        if (result.status === 'fulfilled' && result.value?.results) {
          const searchResults = result.value.results;

          // Find first available image (prefer licensed, then catalog)
          const allImages = [
            ...searchResults.licensed_results,
            ...searchResults.catalog_results
          ];

          const availableImage = allImages.find(img => !usedImageIds.has(img.id));

          if (availableImage) {
            // Get ImageKit URLs from the filename
            const filename = availableImage.filename ||
              availableImage.s3_url?.split('/').pop() ||
              `${availableImage.id}.jpg`;
            // Check if this is a hero component for larger image dimensions
            const isHero = slot.sectionLayout?.toLowerCase().includes('hero') ?? false;
            const { src, webp } = getImageKitUrl(filename, isHero);

            // Update the JSON
            updatedJson = updateImageSlot(updatedJson, slot.path, src, webp);

            // Track used image
            usedImageIds.add(availableImage.id);
            successCount++;
          }
        }
      });

      // Small delay between batches (reduced from 500ms for faster processing)
      if (i + BATCH_SIZE < slotsNeedingImages.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    logger.logProcessing(`Image replacement complete: ${successCount}/${processedCount} slots updated`);

    // Store wrapped result for other steps that expect it
    deps.setGeneratedDataWithRef('imagePickerResult', { success: true, pageData: updatedJson });
    // Return raw data structure (same format as input)
    return { success: true, data: updatedJson };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Image picker failed' };
  }
}
