import { useMutation, QueryStatus } from "@tanstack/react-query";
import generateThemeService from "../services/generateThemeService";
import { GenerateThemeRequest, GenerateThemeResponse } from "../types/APIServiceTypes";

/**
 * Hook for generating a theme from design system data.
 *
 * Returns:
 * - data: The generated theme response (if successful)
 * - status: Query status ('idle', 'pending', 'error', 'success')
 * - mutateAsync: Function to trigger theme generation
 *
 * Example usage:
 * ```tsx
 * const [themeData, status, generateTheme] = useGenerateTheme();
 *
 * const handleGenerateTheme = async () => {
 *   const response = await generateTheme({
 *     design_system: designSystemData
 *   });
 *   console.log('Generated theme:', response.theme);
 * };
 * ```
 */
const useGenerateTheme = () => {
  const mutation = useMutation<GenerateThemeResponse, Error, GenerateThemeRequest>({
    mutationFn: generateThemeService,
    retry: false,
    onSuccess: (data) => {
      console.log('🎨 Theme generated successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Error generating theme:', error);
    },
  });

  return [
    mutation.data,
    mutation.status as QueryStatus,
    mutation.mutateAsync
  ] as [
    GenerateThemeResponse | undefined,
    QueryStatus,
    (request: GenerateThemeRequest) => Promise<GenerateThemeResponse>
  ];
};

export default useGenerateTheme;
