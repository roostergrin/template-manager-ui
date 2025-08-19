import { useMutation, QueryStatus } from "@tanstack/react-query";
import generateContentService from "../services/generateContentService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

const useGenerateContent = () => {
  const mutation = useMutation<GenerateContentResponse, Error, GenerateContentRequest>({
    mutationFn: generateContentService,
    retry: false,
    onSuccess: (data) => {
      console.log('Content generated successfully:', data);
    },
    onError: (error) => {
      console.error('Error generating content:', error);
    },
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [GenerateContentResponse | undefined, QueryStatus, (request: GenerateContentRequest) => Promise<GenerateContentResponse>];
};

export default useGenerateContent; 