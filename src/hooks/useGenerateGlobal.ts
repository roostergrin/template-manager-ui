import { useMutation, QueryStatus } from "@tanstack/react-query";
import generateGlobalService from "../services/generateGlobalService";
import { GenerateContentRequest, GenerateGlobalResponse } from "../types/APIServiceTypes";

const useGenerateGlobal = () => {
  const mutation = useMutation<GenerateGlobalResponse, Error, GenerateContentRequest>({
    mutationFn: generateGlobalService
  });
  return [mutation.data, mutation.status as QueryStatus, mutation.mutateAsync] as [GenerateGlobalResponse | undefined, QueryStatus, (request: GenerateContentRequest) => Promise<GenerateGlobalResponse>];
};

export default useGenerateGlobal; 