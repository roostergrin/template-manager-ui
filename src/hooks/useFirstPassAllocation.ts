import { useMutation, MutationStatus } from '@tanstack/react-query';
import {
  firstPassAllocationService,
  FirstPassAllocationRequest,
  FirstPassAllocationResponse,
} from '../services/allocateContentService';

const useFirstPassAllocation = () => {
  const mutation = useMutation<FirstPassAllocationResponse, unknown, FirstPassAllocationRequest>({
    mutationFn: firstPassAllocationService,
    retry: false,
    onSuccess: (data) => {
      console.log('First Pass allocation completed:', data);
      console.log(`  📊 ${data.summary.pages_with_content}/${data.summary.total_pages} pages have content`);
      console.log(`  📋 ${data.summary.total_sections_suggested} sections suggested`);
    },
    onError: (error) => {
      console.error('Error in First Pass allocation:', error);
    },
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutate,
  ] as [
    FirstPassAllocationResponse | undefined,
    MutationStatus,
    (data: FirstPassAllocationRequest) => void
  ];
};

export default useFirstPassAllocation;
