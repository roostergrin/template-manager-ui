import { useMutation, QueryStatus } from "@tanstack/react-query";
import generatePageContentService from "../services/generatePageContentService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

const useGeneratePageContent = () => {
  const mutation = useMutation<GenerateContentResponse, Error, GenerateContentRequest>({
    mutationFn: generatePageContentService,
    retry: false,
    onSuccess: (data) => {
      console.log('Page content generated successfully:', data);
    },
    onError: (error) => {
      console.error('Error generating page content:', error);
    },
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [GenerateContentResponse | undefined, QueryStatus, (request: GenerateContentRequest) => Promise<GenerateContentResponse>];
};

export default useGeneratePageContent;
