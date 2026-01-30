import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig } from 'axios';
import { createAPIError, handleAPIResponse, logAPIError, APIError } from './apiErrorHandler';
import { mockApiHandler } from '../mocks/mockApiClient';

export interface APIClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

let inMemoryInternalApiKey: string | null = null;

export function setInMemoryInternalApiKey(token: string | null) {
  inMemoryInternalApiKey = token && token.length > 0 ? token : null;
}

function getInternalApiKey(): string | null {
  console.log('🔍 getInternalApiKey() called');
  
  try {
    const fromMemory = inMemoryInternalApiKey;
    console.log('📝 fromMemory:', fromMemory);
    
    const envObj = (import.meta as unknown as { env?: Record<string, string> })?.env;
    console.log('🌍 Full env object:', envObj);
    
    const fromEnvRaw1 = envObj?.VITE_INTERNAL_API_KEY;
    const fromEnvRaw2 = envObj?.VITE_INTERNAL_API_TOKEN;
    console.log('🔑 VITE_INTERNAL_API_KEY from env:', fromEnvRaw1);
    console.log('🔑 VITE_INTERNAL_API_TOKEN from env:', fromEnvRaw2);
    
    const fromEnvRaw = fromEnvRaw1 || fromEnvRaw2 || null;
    console.log('🔑 Combined fromEnvRaw:', fromEnvRaw);
    
    const fromEnv = typeof fromEnvRaw === 'string'
      ? fromEnvRaw.split(',')[0]?.trim()
      : null;
    console.log('🔑 Processed fromEnv:', fromEnv);
    
    const chosen = fromMemory || fromEnv || null;
    console.log('✅ Final chosen API key:', chosen ? `${chosen.substring(0, 8)}...` : 'null');
    
    return chosen && chosen.length > 0 ? chosen : null;
  } catch (error) {
    console.error('❌ Error in getInternalApiKey:', error);
    
    const fallbackEnvObj = (import.meta as unknown as { env?: Record<string, string> })?.env;
    console.log('🌍 Fallback env object:', fallbackEnvObj);
    
    const fallbackRaw = fallbackEnvObj?.VITE_INTERNAL_API_KEY || fallbackEnvObj?.VITE_INTERNAL_API_TOKEN || null;
    const fallback = typeof fallbackRaw === 'string' ? fallbackRaw.split(',')[0]?.trim() : null;
    console.log('🔄 Fallback API key:', fallback ? `${fallback.substring(0, 8)}...` : 'null');
    
    return fallback && fallback.length > 0 ? fallback : null;
  }
}

class APIClient {
  private instance: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: APIClientConfig = {}) {
    console.log('🏗️ Creating new APIClient with config:', config);
    
    this.retries = config.retries || 0;
    this.retryDelay = config.retryDelay || 1000;

    const baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
    console.log('🌐 APIClient baseURL:', baseURL);
    console.log('🌍 import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

    this.instance = axios.create({
      baseURL,
      timeout: config.timeout || 900000, // 15 minutes for long-running operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('⚙️ Setting up request/response interceptors...');
    this.setupInterceptors();
    console.log('✅ APIClient created successfully');
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log('📋 Original headers:', config.headers);
        
        const internalApiKey = getInternalApiKey();
        console.log('🔑 Retrieved API key for request:', internalApiKey ? `${internalApiKey.substring(0, 8)}...` : 'null');
        
        if (internalApiKey) {
          const headers = new AxiosHeaders(config.headers);
          headers.set('X-API-Key', internalApiKey);
          config.headers = headers;
          console.log('✅ Added X-API-Key header to request');
          console.log('📋 Final headers:', config.headers);
        } else {
          console.warn('⚠️ No API key found - request will be sent without X-API-Key header!');
          console.log('📋 Headers without API key:', config.headers);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(createAPIError(error, 'Request configuration failed'));
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Retry logic for certain error types
        if (this.shouldRetry(error) && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount <= this.retries) {
            console.log(`🔄 Retrying request (${originalRequest._retryCount}/${this.retries}): ${originalRequest.url}`);
            await this.delay(this.retryDelay * originalRequest._retryCount);
            return this.instance(originalRequest);
          }
        }

        const apiError = createAPIError(error);
        logAPIError(apiError, `API call to ${originalRequest?.url || 'unknown endpoint'}`);
        return Promise.reject(apiError);
      }
    );
  }

  private shouldRetry(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors or 5xx server errors
      return !error.response || (error.response.status >= 500 && error.response.status <= 599);
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      const mockResult = await mockApiHandler<T>(url, config?.params);
      if (mockResult !== null) {
        return mockResult;
      }

      const response = await this.instance.get<T>(url, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `GET ${url} failed`);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      const mockResult = await mockApiHandler<T>(url, data);
      if (mockResult !== null) {
        return mockResult;
      }

      // For specific long-running operations, use extended timeout
      const extendedTimeoutConfig = this.getExtendedTimeoutConfig(url, config);
      const response = await this.instance.post<T>(url, data, extendedTimeoutConfig);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `POST ${url} failed`);
    }
  }

  async postForm<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      // Convert FormData to object for mock handler
      const formDataObj: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      const mockResult = await mockApiHandler<T>(url, formDataObj);
      if (mockResult !== null) {
        return mockResult;
      }

      const response = await this.instance.post<T>(url, formData, {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `POST (form) ${url} failed`);
    }
  }

  private getExtendedTimeoutConfig(url: string, config?: AxiosRequestConfig): AxiosRequestConfig {
    // Identify long-running operations that need extended timeouts
    const longRunningEndpoints = [
      '/generate-sitemap/',
      '/generate-sitemap-from-scraped/',
      '/generate-sitemap-from-hierarchy/',
      '/generate-sitemap-from-rag/',
      '/generate-content',
      '/generate-global',
      '/provision-site',
      '/generate-router/',
      // Content allocation endpoints (can take 5-15+ minutes for large sites with vector store queries)
      '/allocate-content-to-sitemap/',
      '/allocate-content-first-pass/',
      '/allocate-content-second-pass/'
    ];

    const isLongRunningOperation = longRunningEndpoints.some(endpoint => url.includes(endpoint));
    
    if (isLongRunningOperation) {
      return {
        ...config,
        timeout: 1800000, // 30 minutes for AI generation operations
      };
    }

    return config || {};
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      const mockResult = await mockApiHandler<T>(url, data);
      if (mockResult !== null) {
        return mockResult;
      }

      const response = await this.instance.put<T>(url, data, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `PUT ${url} failed`);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      const mockResult = await mockApiHandler<T>(url, data);
      if (mockResult !== null) {
        return mockResult;
      }

      const response = await this.instance.patch<T>(url, data, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `PATCH ${url} failed`);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check if mock mode is enabled - return mock data if available
      const mockResult = await mockApiHandler<T>(url, config?.data);
      if (mockResult !== null) {
        return mockResult;
      }

      const response = await this.instance.delete<T>(url, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `DELETE ${url} failed`);
    }
  }

  // Direct access to axios instance for advanced usage
  get axios(): AxiosInstance {
    return this.instance;
  }
}

// Create and export the default API client with retry support for transient failures
console.log('🚀 Creating default APIClient instance...');
const apiClient = new APIClient({
  retries: 2,           // Retry up to 2 times on network errors or 5xx responses
  retryDelay: 2000      // Wait 2 seconds before first retry (exponential backoff applied)
});
console.log('🎯 Default APIClient created and ready to use');

// Export both the class and default instance
export { APIClient, APIError };
export default apiClient;
