import { useMutation, QueryStatus } from "@tanstack/react-query";
import generateContentService from "../services/generateContentService";
import { GenerateContentRequest, GenerateContentResponse } from "../types/APIServiceTypes";

const useGenerateContent = () => {
  const mutation = useMutation<GenerateContentResponse, Error, GenerateContentRequest>({
    mutationFn: generateContentService
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [GenerateContentResponse | undefined, QueryStatus, (request: GenerateContentRequest) => Promise<GenerateContentResponse>];
};

export default useGenerateContent; 