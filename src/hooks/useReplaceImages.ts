import { useMutation, QueryStatus } from "@tanstack/react-query";
import replaceImagesService, {
  ReplaceImagesRequest,
  ReplaceImagesResponse
} from "../services/replaceImagesService";

/**
 * Hook for replacing images in generated content with stock images.
 *
 * This hook uses the image replacement endpoint which:
 * - Takes already-generated content
 * - Replaces ALL images with fresh stock images (served via CloudFront)
 * - Returns updated content with new images
 *
 * Use this hook when you want to replace scraped images with licensed stock photos
 * without regenerating the entire content.
 */
const useReplaceImages = () => {
  const mutation = useMutation<ReplaceImagesResponse, Error, ReplaceImagesRequest>({
    mutationFn: replaceImagesService,
    retry: false,
    onSuccess: (data) => {
      console.log('[useReplaceImages] Images replaced successfully:', data);
      console.log(`  Success: ${data.success_count}, Skipped: ${data.skipped_count}, Failed: ${data.failed_count}`);
    },
    onError: (error) => {
      console.error('[useReplaceImages] Error replacing images:', error);
    },
  });

  return [
    mutation.data,
    mutation.status as QueryStatus,
    mutation.mutateAsync
  ] as [
    ReplaceImagesResponse | undefined,
    QueryStatus,
    (request: ReplaceImagesRequest) => Promise<ReplaceImagesResponse>
  ];
};

export default useReplaceImages;

// Re-export types for convenience
export type { ReplaceImagesRequest, ReplaceImagesResponse };
