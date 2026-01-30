import { useMutation, MutationStatus } from '@tanstack/react-query';
import {
  secondPassAllocationService,
  SecondPassAllocationRequest,
  SecondPassAllocationResponse,
} from '../services/allocateContentService';

const useSecondPassAllocation = () => {
  const mutation = useMutation<SecondPassAllocationResponse, unknown, SecondPassAllocationRequest>({
    mutationFn: secondPassAllocationService,
    retry: false,
    onSuccess: (data) => {
      console.log('Second Pass allocation completed:', data);
      console.log(`  📊 ${data.summary.allocated_pages}/${data.summary.total_pages} pages allocated`);
      console.log(`  📝 ${data.summary.total_content_length} total characters`);
    },
    onError: (error) => {
      console.error('Error in Second Pass allocation:', error);
    },
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutate,
  ] as [
    SecondPassAllocationResponse | undefined,
    MutationStatus,
    (data: SecondPassAllocationRequest) => void
  ];
};

export default useSecondPassAllocation;
