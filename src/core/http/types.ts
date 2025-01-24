// src/core/http/types.ts
import { AxiosRequestConfig, AxiosHeaders } from 'axios'; // Add AxiosHeaders import

export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

export type SafeAxiosConfig = AxiosRequestConfig & {
  headers?: AxiosHeaders | Record<string, string>;
};


export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// Additional type for internal use in the client
export interface RetryConfig extends Required<HttpClientConfig> {
    currentRetry?: number;
}