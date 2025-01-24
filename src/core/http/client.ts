// src/core/http/client.ts
import axios, { 
    AxiosInstance, 
    AxiosError, 
    AxiosRequestConfig,
    InternalAxiosRequestConfig 
} from 'axios';
import { Logger } from '../logging/types';
import { HttpClientConfig } from './types';
import { 
    SpotifyHttpError,
    SpotifyRateLimitError,
    isSpotifyErrorResponse 
} from './errors';

/**
 * HttpClient provides a robust wrapper around Axios for making HTTP requests to the Spotify API.
 * It includes automatic retry logic, error transformation, and comprehensive logging.
 */
export class HttpClient {
    private client: AxiosInstance;
    private readonly config: Required<HttpClientConfig>;
    private readonly logger: Logger;

    constructor(config: HttpClientConfig, logger: Logger) {
        // Ensure all config values have sensible defaults
        this.config = {
            ...config,
            timeout: config.timeout ?? 10000,      // 10 second default timeout
            retries: config.retries ?? 3,          // 3 default retries
            retryDelay: config.retryDelay ?? 1000  // 1 second default retry delay
        };
        this.logger = logger;
        
        // Initialize Axios with base configuration
        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: { 'Content-Type': 'application/json' }
        });

        this.setupInterceptors();
    }

    /**
     * Configures request and response interceptors for logging and error handling
     */
    private setupInterceptors(): void {
        // Request interceptor for logging and error transformation
        this.client.interceptors.request.use(
            (config) => {
                const method = config.method?.toUpperCase() ?? 'GET';
                const url = config.url ?? 'unknown';
                this.logger.info(`Making ${method} request to ${url}`, {
                    method,
                    url,
                    headers: this.sanitizeHeaders(config.headers)
                });
                return config;
            },
            (error) => {
                this.logger.error('Request interceptor error:', this.sanitizeError(error));
                return Promise.reject(this.transformError(error as AxiosError));
            }
        );

        // Response interceptor for logging and automatic retry logic
        this.client.interceptors.response.use(
            (response) => {
                const url = response.config.url ?? 'unknown';
                this.logger.info(`Received response from ${url} with status ${response.status}`, {
                    status: response.status,
                    url,
                    headers: this.sanitizeHeaders(response.headers)
                });
                return response;
            },
            async (error) => {
                return this.handleRequestError(error as AxiosError);
            }
        );
    }

    /**
     * Transforms Axios errors into our custom SpotifyHttpError format
     */
    private transformError(error: AxiosError): SpotifyHttpError {
        if (error.response?.data) {
            const data = error.response.data;
            if (isSpotifyErrorResponse(data)) {
                // Special handling for rate limiting
                if (error.response.status === 429) {
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '0', 10);
                    return new SpotifyRateLimitError(
                        data.error?.message || 'Rate limit exceeded',
                        retryAfter
                    );
                }

                return new SpotifyHttpError(
                    data.error?.message || error.message,
                    error.response.status,
                    data.error?.code,
                    data
                );
            }
        }

        // Handle network errors (no response received)
        if (error.request) {
            return new SpotifyHttpError(
                'Network error occurred',
                undefined,
                'NETWORK_ERROR',
                error.message
            );
        }

        // Handle client-side errors (request never sent)
        return new SpotifyHttpError(
            'Request failed',
            undefined,
            'CLIENT_ERROR',
            error.message
        );
    }

    /**
     * Implements retry logic with exponential backoff for failed requests
     */
    private async handleRequestError(error: AxiosError): Promise<never> {
        const config = error.config as InternalAxiosRequestConfig | undefined;
        if (!config) {
            throw this.transformError(error);
        }

        const retryCount = (config as any).__retryCount || 0;
        const shouldRetry = this.shouldRetryRequest(error, retryCount);

        if (shouldRetry) {
            (config as any).__retryCount = retryCount + 1;
            this.logger.warn(`Retrying request (${retryCount + 1}/${this.config.retries})`, {
                attempt: retryCount + 1,
                maxRetries: this.config.retries,
                url: config.url
            });
            
            const backoffDelay = this.calculateBackoff(retryCount);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return this.client.request(config);
        }

        throw this.transformError(error);
    }

    /**
     * Determines if a failed request should be retried based on error type and retry count
     */
    private shouldRetryRequest(error: AxiosError, retryCount: number): boolean {
        if (retryCount >= this.config.retries) return false;
        if (!error.response) return true; // Always retry network errors
        return error.response.status >= 500 || error.response.status === 429;
    }

    /**
     * Calculates retry delay using exponential backoff with jitter
     */
    private calculateBackoff(retryCount: number): number {
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * baseDelay;
        // Cap at 10 seconds to prevent excessive delays
        return Math.min(exponentialDelay + jitter, 10000);
    }

    /**
     * Sanitizes error objects for safe logging
     */
    private sanitizeError(error: unknown): unknown {
        if (error instanceof Error) {
            const sanitized = {
                message: error.message,
                name: error.name,
                stack: error.stack
            };
            
            if (error instanceof AxiosError) {
                const data = error.response?.data;
                return {
                    ...sanitized,
                    status: error.response?.status,
                    data: isSpotifyErrorResponse(data) ? data : undefined,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        baseURL: error.config?.baseURL
                    }
                };
            }
            
            return sanitized;
        }
        
        return error;
    }

    /**
     * Removes sensitive information from headers before logging
     */
    private sanitizeHeaders(headers: unknown): unknown {
        if (headers && typeof headers === 'object') {
            const sanitized = { ...headers as Record<string, unknown> };
            const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
            
            for (const header of sensitiveHeaders) {
                if (header in sanitized) {
                    sanitized[header] = '[REDACTED]';
                }
            }
            
            return sanitized;
        }
        return headers;
    }

    /**
     * Makes a GET request to the specified URL
     */
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.get<T>(url, config);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw this.transformError(error);
            }
            throw error;
        }
    }

    /**
     * Makes a POST request to the specified URL
     */
    public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw this.transformError(error);
            }
            throw error;
        }
    }

    /**
     * Makes a PUT request to the specified URL
     */
    public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw this.transformError(error);
            }
            throw error;
        }
    }

    /**
     * Makes a DELETE request to the specified URL
     */
    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.delete<T>(url, config);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw this.transformError(error);
            }
            throw error;
        }
    }
}