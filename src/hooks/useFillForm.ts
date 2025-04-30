import { useMutation, MutationStatus } from '@tanstack/react-query';
import fillForm, { FillFormRequest, FillFormResponse } from '../services/fillForm';

const useFillForm = () => {
  const mutation = useMutation<FillFormResponse, unknown, FillFormRequest>({
    mutationFn: fillForm,
    onSuccess: (data) => {
      console.log('Success:', data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });
  return [mutation.data, mutation.status, mutation.mutate] as [FillFormResponse | undefined, MutationStatus, (data: FillFormRequest) => void];
};

export default useFillForm; 