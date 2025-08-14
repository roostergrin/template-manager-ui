import { AxiosError, AxiosResponse } from 'axios';

export class APIError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.originalError = originalError;
  }
}

export const createAPIError = (error: unknown, fallbackMessage = 'An unexpected error occurred'): APIError => {
  if (error instanceof APIError) {
    return error;
  }

  // Check for AxiosError properties (more flexible than instanceof for testing)
  if (error && typeof error === 'object' && ('isAxiosError' in error || error instanceof AxiosError)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    // Extract error message from various response formats
    let message = fallbackMessage;
    if (typeof data === 'string') {
      message = data;
    } else if (data && typeof data === 'object' && 'message' in (data as any)) {
      message = (data as any).message as string;
    } else if (data && typeof data === 'object' && 'detail' in (data as any)) {
      message = (data as any).detail as string;
    } else if (data && typeof data === 'object' && 'error' in (data as any)) {
      const err: any = (data as any).error;
      message = typeof err === 'string' ? err : err?.message || fallbackMessage;
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    return new APIError(
      message,
      status,
      (data as any)?.code || axiosError.code,
      (data as any)?.details,
      axiosError
    );
  }

  if (error instanceof Error) {
    return new APIError(error.message, undefined, undefined, undefined, error);
  }

  return new APIError(fallbackMessage, undefined, undefined, undefined, error);
};

export const handleAPIResponse = <T>(response: AxiosResponse<T>): T => {
  if (!response.data) {
    throw new APIError('No data received from server', response.status);
  }

  // Handle wrapped responses with success flag
  if (typeof response.data === 'object' && response.data !== null && 'success' in response.data) {
    const wrappedData = response.data as { success: boolean; data?: T; message?: string; error?: unknown };
    
    if (!wrappedData.success) {
      throw new APIError(
        wrappedData.message || 'Request failed',
        response.status,
        undefined,
        wrappedData.error as Record<string, unknown>
      );
    }
    
    return wrappedData.data as T || response.data;
  }

  return response.data;
};

export const logAPIError = (error: APIError, operation: string): void => {
  console.error(`❌ ${operation} failed:`, {
    message: error.message,
    status: error.status,
    code: error.code,
    details: error.details,
  });
};