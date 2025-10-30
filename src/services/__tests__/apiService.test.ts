import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import apiClient, { APIClient } from '../apiService';
import { APIError } from '../apiErrorHandler';

// Mock console methods to avoid noise in tests
vi.mock('console', () => ({
  log: vi.fn(),
  error: vi.fn(),
}));

describe.skip('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a fresh client for each test
    client = new APIClient({
      baseURL: 'https://test-api.com',
      timeout: 5000,
      retries: 2,
      retryDelay: 100
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultClient = new APIClient();
      expect(defaultClient.axios.defaults.baseURL).toContain('localhost:8000');
      expect(defaultClient.axios.defaults.timeout).toBe(300000);
    });

    it('should create instance with custom config', () => {
      const customClient = new APIClient({
        baseURL: 'https://custom-api.com',
        timeout: 10000,
        retries: 5,
        retryDelay: 2000
      });
      
      expect(customClient.axios.defaults.baseURL).toBe('https://custom-api.com');
      expect(customClient.axios.defaults.timeout).toBe(10000);
    });

    it('should use environment variable for base URL', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://env-api.com');
      const envClient = new APIClient();
      expect(envClient.axios.defaults.baseURL).toBe('https://env-api.com');
      vi.unstubAllEnvs();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      // Mock the axios instance methods
      vi.spyOn(client.axios, 'get').mockResolvedValue({ data: { test: 'data' }, status: 200 });
      vi.spyOn(client.axios, 'post').mockResolvedValue({ data: { created: true }, status: 201 });
      vi.spyOn(client.axios, 'put').mockResolvedValue({ data: { updated: true }, status: 200 });
      vi.spyOn(client.axios, 'patch').mockResolvedValue({ data: { patched: true }, status: 200 });
      vi.spyOn(client.axios, 'delete').mockResolvedValue({ data: { deleted: true }, status: 200 });
    });

    it('should handle GET requests', async () => {
      const result = await client.get('/test');
      expect(result).toEqual({ test: 'data' });
      expect(client.axios.get).toHaveBeenCalledWith('/test', undefined);
    });

    it('should handle POST requests', async () => {
      const data = { name: 'test' };
      const result = await client.post('/test', data);
      expect(result).toEqual({ created: true });
      expect(client.axios.post).toHaveBeenCalledWith('/test', data, undefined);
    });

    it('should handle PUT requests', async () => {
      const data = { name: 'updated' };
      const result = await client.put('/test', data);
      expect(result).toEqual({ updated: true });
      expect(client.axios.put).toHaveBeenCalledWith('/test', data, undefined);
    });

    it('should handle PATCH requests', async () => {
      const data = { name: 'patched' };
      const result = await client.patch('/test', data);
      expect(result).toEqual({ patched: true });
      expect(client.axios.patch).toHaveBeenCalledWith('/test', data, undefined);
    });

    it('should handle DELETE requests', async () => {
      const result = await client.delete('/test');
      expect(result).toEqual({ deleted: true });
      expect(client.axios.delete).toHaveBeenCalledWith('/test', undefined);
    });
  });

  describe('error handling', () => {
    it('should convert axios errors to APIErrors', async () => {
      const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        data: { message: 'Bad request' }
      } as any);

      vi.spyOn(client.axios, 'get').mockRejectedValue(axiosError);

      await expect(client.get('/test')).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      vi.spyOn(client.axios, 'get').mockRejectedValue(networkError);

      await expect(client.get('/test')).rejects.toThrow(APIError);
    });
  });

  describe('shouldRetry', () => {
    it('should identify retryable errors', () => {
      // Access private method for testing
      const shouldRetry = (client as any).shouldRetry;
      
      const networkError = new AxiosError('Network Error');
      const serverError = new AxiosError('Server Error', undefined, undefined, undefined, { status: 500 } as any);
      const clientError = new AxiosError('Client Error', undefined, undefined, undefined, { status: 400 } as any);

      expect(shouldRetry(networkError)).toBe(true);
      expect(shouldRetry(serverError)).toBe(true);
      expect(shouldRetry(clientError)).toBe(false);
    });
  });
});

describe('default apiClient', () => {
  it('should be an instance of APIClient', () => {
    expect(apiClient).toBeInstanceOf(APIClient);
  });

  it('should have all HTTP methods', () => {
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.patch).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });

  it('should provide access to axios instance', () => {
    expect(apiClient.axios).toBeDefined();
    expect(apiClient.axios.defaults).toBeDefined();
  });
});