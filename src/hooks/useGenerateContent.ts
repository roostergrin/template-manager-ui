import { useMutation, MutationStatus } from "@tanstack/react-query";
import generateContent, { GenerateContentRequest, GenerateContentResponse } from "../services/generateContent";

const useGenerateContent = () => {
  const mutation = useMutation<GenerateContentResponse, unknown, GenerateContentRequest>(generateContent);
  return [mutation.mutate, mutation.status] as [
    (data: GenerateContentRequest) => void,
    MutationStatus
  ];
};

export default useGenerateContent; 