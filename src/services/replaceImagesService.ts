import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";

export interface ReplaceImagesRequest {
  generated_content: Record<string, unknown>;
  site_type: string;
}

export interface ReplaceImagesResponse {
  data: Record<string, unknown>;
  success_count: number;
  skipped_count: number;
  failed_count: number;
  duration: number;
}

/**
 * Replace all images in generated content with fresh stock images.
 *
 * This service calls the /replace-images-with-imagekit/ endpoint which:
 * - Takes already-generated content
 * - Replaces ALL images with fresh stock images (served via CloudFront)
 * - Uses component context/keywords for image selection
 * - Returns updated content with new images
 *
 * Useful for:
 * - Replacing scraped images with licensed stock photos
 * - Regenerating images without regenerating content
 * - Trying different image styles
 */
const replaceImagesService = async (request: ReplaceImagesRequest): Promise<ReplaceImagesResponse> => {
  console.log("[replaceImagesService] Sending request:", request);
  const response = await apiClient.post<ReplaceImagesResponse>("/replace-images-with-imagekit/", request);
  console.log(`[replaceImagesService] Replaced: ${response.success_count} images in ${response.duration.toFixed(2)}s`);
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const replaceImagesQueryFunction: QueryFunction<ReplaceImagesResponse, ["replace-images", ReplaceImagesRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return replaceImagesService(request);
};

export default replaceImagesService;
export { replaceImagesQueryFunction };

// Backward compatibility exports
export const replaceImagesWithImageKitService = replaceImagesService;
export const replaceImagesWithImageKitQueryFunction = replaceImagesQueryFunction;
