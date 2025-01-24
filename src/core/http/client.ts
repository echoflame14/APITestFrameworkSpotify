// src/core/http/client.ts
import axios, { 
    AxiosInstance, 
    AxiosError, 
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosHeaders // Add this import
} from 'axios';
import { Logger } from '../logging/types';
import { HttpClientConfig } from './types';
import { 
    SpotifyHttpError,
    SpotifyRateLimitError,
    isSpotifyErrorResponse,
    SpotifyErrorData
} from './errors';

export class HttpClient {
    private client: AxiosInstance;
    private readonly config: Required<HttpClientConfig>;
    private readonly logger: Logger;

    constructor(config: HttpClientConfig, logger: Logger) {
        this.config = {
            ...config,
            timeout: config.timeout ?? 10000,
            retries: config.retries ?? 3,
            retryDelay: config.retryDelay ?? 1000
        };
        this.logger = logger;
        
        // In the axios.create() configuration
        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: new AxiosHeaders({ 'Content-Type': 'application/json' })
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            (config) => {
                const method = config.method?.toUpperCase() ?? 'GET';
                const url = config.url ?? 'unknown';
                this.logger.info(`Initiating ${method} ${url}`);
                return config;
            },
            (error) => {
                this.logger.error('Request setup failed:', this.sanitizeError(error));
                return Promise.reject(this.transformError(error as AxiosError));
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                this.logger.info(`Received ${response.status} from ${response.config.url}`);
                return response;
            },
            async (error) => this.handleRequestError(error as AxiosError)
        );
    }

    private transformError(error: AxiosError): SpotifyHttpError {
        const errorData: SpotifyErrorData = {
            originalError: error,
            originalStatus: error.response?.status
        };

        if (error.response) {
            const { status, headers, data } = error.response;
            
            if (status === 429) {
                const retryAfter = this.parseRetryAfter(headers);
                return new SpotifyRateLimitError(
                    'API rate limit exceeded',
                    retryAfter,
                    {
                        ...errorData,
                        retryAfter,
                        contextData: {
                            retryAfterSeconds: retryAfter,
                            rateLimitLimit: headers['x-ratelimit-limit'],
                            rateLimitRemaining: headers['x-ratelimit-remaining']
                        }
                    }
                );
            }

            if (isSpotifyErrorResponse(data) && data.error) {
                return new SpotifyHttpError(
                    data.error.message,
                    status,
                    data.error.code,
                    { ...errorData, error: data.error }
                );
            }
        }

        return this.createGenericError(error, errorData);
    }

    private parseRetryAfter(headers: Record<string, any>): number {
        const retryValue = headers?.['retry-after'] || '0';
        return Math.max(parseInt(retryValue, 10) * 1000, 0);
    }

    private createGenericError(error: AxiosError, data: SpotifyErrorData): SpotifyHttpError {
        if (error.request) {
            return new SpotifyHttpError(
                'Network connection failed',
                undefined,
                'NETWORK_ERROR',
                { ...data, contextData: { code: 'NETWORK_ERROR' } }
            );
        }

        return new SpotifyHttpError(
            'Request processing failed',
            undefined,
            'CLIENT_ERROR',
            { ...data, contextData: { code: 'CLIENT_ERROR' } }
        );
    }

    private async handleRequestError(error: AxiosError): Promise<never> {
        const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };
        const retryCount = config?.__retryCount || 0;
        
        if (this.shouldRetry(error, retryCount)) {
            config.__retryCount = retryCount + 1;
            const delay = this.calculateBackoff(retryCount);
            
            this.logger.warn(`Retrying request (${config.__retryCount}/${this.config.retries})`, {
                url: config.url,
                delay,
                status: error.response?.status
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client.request(config);
        }

        throw this.transformError(error);
    }

    private shouldRetry(error: AxiosError, retryCount: number): boolean {
        return retryCount < this.config.retries && 
            (!error.response || error.response.status === 429 || error.response.status >= 500);
    }

    private calculateBackoff(retryCount: number): number {
        const base = this.config.retryDelay;
        const maxDelay = 30000;
        const delay = base * Math.pow(2, retryCount) + Math.random() * base;
        return Math.min(delay, maxDelay);
    }

    private sanitizeError(error: unknown): unknown {
        if (error instanceof AxiosError) {
            return {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status
            };
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