// src/core/http/types.ts

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