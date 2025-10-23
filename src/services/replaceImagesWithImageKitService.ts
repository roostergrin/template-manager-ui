import { QueryFunction } from "@tanstack/react-query";
import apiClient from "./apiService";

export interface ReplaceImagesRequest {
  generated_content: Record<string, any>;
  site_type: string;
}

export interface ReplaceImagesResponse {
  data: Record<string, any>;
  success_count: number;
  skipped_count: number;
  failed_count: number;
  duration: number;
}

/**
 * Replace all images in generated content with fresh ImageKit/Adobe Stock images.
 *
 * This service calls the /replace-images-with-imagekit/ endpoint which:
 * - Takes already-generated content
 * - Replaces ALL images with fresh Adobe Stock/ImageKit images
 * - Uses component context/keywords for image selection
 * - Returns updated content with new images
 *
 * Useful for:
 * - Replacing scraped images with licensed stock photos
 * - Regenerating images without regenerating content
 * - Trying different image styles
 */
const replaceImagesWithImageKitService = async (request: ReplaceImagesRequest): Promise<ReplaceImagesResponse> => {
  console.log("📤 replaceImagesWithImageKitService - Sending request:", request);
  console.log("   🎯 Using /replace-images-with-imagekit/ endpoint");
  const response = await apiClient.post<ReplaceImagesResponse>("/replace-images-with-imagekit/", request);
  console.log("✅ replaceImagesWithImageKitService - Images replaced successfully");
  console.log(`   📊 Replaced: ${response.success_count} images in ${response.duration.toFixed(2)}s`);
  return response;
};

// For useQuery - QueryFunction that extracts request from queryKey
const replaceImagesWithImageKitQueryFunction: QueryFunction<ReplaceImagesResponse, ["replace-images-with-imagekit", ReplaceImagesRequest]> = async ({ queryKey }) => {
  const [, request] = queryKey;
  return replaceImagesWithImageKitService(request);
};

export default replaceImagesWithImageKitService;
export { replaceImagesWithImageKitQueryFunction };
