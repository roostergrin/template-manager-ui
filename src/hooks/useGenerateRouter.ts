import { QueryStatus, useMutation } from '@tanstack/react-query';
import generateRouterService from '../services/generateRouterService';
import { GenerateRouterRequest, GenerateRouterResponse } from '../types/APIServiceTypes';

const useGenerateRouter = () => {
  const mutation = useMutation({
    mutationFn: generateRouterService,
    mutationKey: ['generateRouter'],
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutateAsync
  ] as [
    GenerateRouterResponse | undefined,
    QueryStatus,
    (variables: GenerateRouterRequest) => Promise<GenerateRouterResponse>
  ];
};

export default useGenerateRouter;
