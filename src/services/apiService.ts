import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig } from 'axios';
import { createAPIError, handleAPIResponse, logAPIError, APIError } from './apiErrorHandler';

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
  try {
    const fromMemory = inMemoryInternalApiKey;
    const fromEnvRaw = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_INTERNAL_API_KEY || (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_INTERNAL_API_TOKEN || null;
    const fromEnv = typeof fromEnvRaw === 'string'
      ? fromEnvRaw.split(',')[0]?.trim()
      : null;
    const chosen = fromMemory || fromEnv || null;
    return chosen && chosen.length > 0 ? chosen : null;
  } catch {
    const fallbackRaw = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_INTERNAL_API_KEY || (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_INTERNAL_API_TOKEN || null;
    const fallback = typeof fallbackRaw === 'string' ? fallbackRaw.split(',')[0]?.trim() : null;
    return fallback && fallback.length > 0 ? fallback : null;
  }
}

class APIClient {
  private instance: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: APIClientConfig = {}) {
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.instance = axios.create({
      baseURL: config.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/',
      timeout: config.timeout || 300000, // 5 minutes for long-running operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        const internalApiKey = getInternalApiKey();
        if (internalApiKey) {
          const headers = new AxiosHeaders(config.headers);
          headers.set('X-API-Key', internalApiKey);
          config.headers = headers;
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
      const response = await this.instance.get<T>(url, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `GET ${url} failed`);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `POST ${url} failed`);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `PUT ${url} failed`);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return handleAPIResponse(response);
    } catch (error) {
      throw createAPIError(error, `PATCH ${url} failed`);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
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

// Create and export the default API client
const apiClient = new APIClient();

// Export both the class and default instance
export { APIClient, APIError };
export default apiClient;
