import { useMutation, MutationStatus } from '@tanstack/react-query';
import allocateContentService, {
  AllocateContentRequest,
  AllocateContentResponse,
} from '../services/allocateContentService';

const useAllocateContent = () => {
  const mutation = useMutation<AllocateContentResponse, unknown, AllocateContentRequest>({
    mutationFn: allocateContentService,
    retry: false,
    onSuccess: (data) => {
      console.log('Content allocated successfully:', data);
      console.log(`  📊 Allocated ${data.allocation_summary.allocated_pages}/${data.allocation_summary.total_pages} pages`);
      console.log(`  📝 ${data.allocation_summary.total_content_length} total characters`);
      console.log(`  🖼️  ${data.allocation_summary.total_images} total images`);
      console.log(`  ⭐ ${(data.allocation_summary.average_confidence * 100).toFixed(1)}% average confidence`);
    },
    onError: (error) => {
      console.error('Error allocating content:', error);
    },
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutate,
  ] as [
    AllocateContentResponse | undefined,
    MutationStatus,
    (data: AllocateContentRequest) => void
  ];
};

export default useAllocateContent;
