import { useMutation, QueryStatus } from "@tanstack/react-query";
import replaceImagesWithImageKitService, {
  ReplaceImagesRequest,
  ReplaceImagesResponse
} from "../services/replaceImagesWithImageKitService";

/**
 * Hook for replacing images in generated content with ImageKit/Adobe Stock images.
 *
 * This hook uses the /replace-images-with-imagekit/ endpoint which:
 * - Takes already-generated content
 * - Replaces ALL images with fresh Adobe Stock/ImageKit images
 * - Returns updated content with new images
 *
 * Use this hook when you want to replace scraped images with licensed stock photos
 * without regenerating the entire content.
 */
const useReplaceImagesWithImageKit = () => {
  const mutation = useMutation<ReplaceImagesResponse, Error, ReplaceImagesRequest>({
    mutationFn: replaceImagesWithImageKitService,
    retry: false,
    onSuccess: (data) => {
      console.log('✅ Images replaced successfully with ImageKit/Adobe Stock:', data);
      console.log(`   📊 Success: ${data.success_count}, Skipped: ${data.skipped_count}, Failed: ${data.failed_count}`);
    },
    onError: (error) => {
      console.error('❌ Error replacing images with ImageKit:', error);
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

export default useReplaceImagesWithImageKit;
