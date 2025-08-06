import { describe, it, expect, vi } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import { APIError, createAPIError, handleAPIResponse, logAPIError } from '../apiErrorHandler';

describe('APIError', () => {
  it('should create an APIError with all properties', () => {
    const error = new APIError('Test error', 404, 'NOT_FOUND', { field: 'value' }, new Error('original'));
    
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual({ field: 'value' });
    expect(error.originalError).toBeInstanceOf(Error);
    expect(error.name).toBe('APIError');
  });

  it('should create an APIError with minimal properties', () => {
    const error = new APIError('Simple error');
    
    expect(error.message).toBe('Simple error');
    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
    expect(error.originalError).toBeUndefined();
  });
});

describe('createAPIError', () => {
  it('should return existing APIError unchanged', () => {
    const originalError = new APIError('Original error', 500);
    const result = createAPIError(originalError);
    
    expect(result).toBe(originalError);
  });

  it('should handle AxiosError with response data string', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: 'Bad request message'
      },
      message: 'Request failed'
    } as AxiosError;

    const result = createAPIError(axiosError);
    
    expect(result).toBeInstanceOf(APIError);
    expect(result.message).toBe('Bad request message');
    expect(result.status).toBe(400);
  });

  it('should handle AxiosError with response data object containing message', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { field: 'email' }
        }
      },
      message: 'Request failed'
    } as AxiosError;

    const result = createAPIError(axiosError);
    
    expect(result.message).toBe('Validation failed');
    expect(result.status).toBe(422);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.details).toEqual({ field: 'email' });
  });

  it('should handle AxiosError with response data object containing detail', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          detail: 'Access denied'
        }
      },
      message: 'Request failed'
    } as AxiosError;

    const result = createAPIError(axiosError);
    
    expect(result.message).toBe('Access denied');
    expect(result.status).toBe(403);
  });

  it('should handle AxiosError with response data object containing nested error', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          error: {
            message: 'Database connection failed'
          }
        }
      },
      message: 'Request failed'
    } as AxiosError;

    const result = createAPIError(axiosError);
    
    expect(result.message).toBe('Database connection failed');
    expect(result.status).toBe(500);
  });

  it('should handle AxiosError without response', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Network Error',
      code: 'NETWORK_ERROR'
    } as AxiosError;

    const result = createAPIError(axiosError);
    
    expect(result.message).toBe('Network Error');
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.status).toBeUndefined();
  });

  it('should handle regular Error', () => {
    const error = new Error('Regular error message');
    const result = createAPIError(error);
    
    expect(result).toBeInstanceOf(APIError);
    expect(result.message).toBe('Regular error message');
    expect(result.originalError).toBe(error);
  });

  it('should handle unknown error type', () => {
    const error = 'String error';
    const result = createAPIError(error, 'Custom fallback');
    
    expect(result).toBeInstanceOf(APIError);
    expect(result.message).toBe('Custom fallback');
    expect(result.originalError).toBe(error);
  });
});

describe('handleAPIResponse', () => {
  it('should return data directly for simple response', () => {
    const response = {
      data: { id: 1, name: 'Test' },
      status: 200
    } as AxiosResponse;

    const result = handleAPIResponse(response);
    
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('should handle wrapped response with success flag', () => {
    const response = {
      data: {
        success: true,
        data: { id: 1, name: 'Test' }
      },
      status: 200
    } as AxiosResponse;

    const result = handleAPIResponse(response);
    
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('should throw APIError for failed wrapped response', () => {
    const response = {
      data: {
        success: false,
        message: 'Operation failed',
        error: { code: 'FAILED' }
      },
      status: 400
    } as AxiosResponse;

    expect(() => handleAPIResponse(response)).toThrow(APIError);
    expect(() => handleAPIResponse(response)).toThrow('Operation failed');
  });

  it('should throw APIError for response without data', () => {
    const response = {
      data: null,
      status: 200
    } as AxiosResponse;

    expect(() => handleAPIResponse(response)).toThrow(APIError);
    expect(() => handleAPIResponse(response)).toThrow('No data received from server');
  });

  it('should return original response data for wrapped response without nested data', () => {
    const response = {
      data: {
        success: true,
        id: 1,
        name: 'Test'
      },
      status: 200
    } as AxiosResponse;

    const result = handleAPIResponse(response);
    
    expect(result).toEqual({
      success: true,
      id: 1,
      name: 'Test'
    });
  });
});

describe('logAPIError', () => {
  it('should log error details to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const error = new APIError('Test error', 404, 'NOT_FOUND', { field: 'value' });
    logAPIError(error, 'Test operation');
    
    expect(consoleSpy).toHaveBeenCalledWith('❌ Test operation failed:', {
      message: 'Test error',
      status: 404,
      code: 'NOT_FOUND',
      details: { field: 'value' }
    });
    
    consoleSpy.mockRestore();
  });
});