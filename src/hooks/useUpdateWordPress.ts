import { useState, useCallback } from 'react';
import { updateWordPressService, WordPressUpdateData, WordPressUpdateResponse } from '../services/updateWordPressService';

type UpdateStatus = 'idle' | 'pending' | 'success' | 'error';

const useUpdateWordPress = (): [
  WordPressUpdateResponse | null,
  UpdateStatus,
  (data: WordPressUpdateData) => Promise<void>,
  string | null
] => {
  const [response, setResponse] = useState<WordPressUpdateResponse | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const updateWordPress = useCallback(async (data: WordPressUpdateData) => {
    setStatus('pending');
    setError(null);
    setResponse(null);

    try {
      const result = await updateWordPressService(data);
      setResponse(result);
      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating WordPress';
      setError(errorMessage);
      setStatus('error');
    }
  }, []);

  return [response, status, updateWordPress, error];
};

export default useUpdateWordPress; 