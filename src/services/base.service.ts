// base.service.ts
import { AxiosRequestConfig } from 'axios';
import { HttpClient } from '../core/http/client';
import { AuthHandler } from '../core/auth/handler';

export interface ServiceDependencies {
  http: HttpClient;
  auth: AuthHandler;
}

export abstract class BaseService {
    protected readonly http: HttpClient;
    protected readonly auth: AuthHandler;

    constructor(dependencies: ServiceDependencies) {
        this.http = dependencies.http;
        this.auth = dependencies.auth;
    }

    protected async request<T>(
        method: 'get' | 'post' | 'put' | 'delete',
        endpoint: string,
        options?: AxiosRequestConfig
    ): Promise<T> {
        // Merge authentication headers with existing headers
        const authHeaders = await this.auth.getAuthHeader();
        const mergedConfig: AxiosRequestConfig = {
            ...options,
            headers: {
                ...options?.headers,
                ...authHeaders
            }
        };

        switch (method) {
            case 'get':
                return this.http.get<T>(endpoint, mergedConfig);
            case 'post': {
                // Extract data from config for proper axios usage
                const { data, ...config } = mergedConfig;
                return this.http.post<T>(endpoint, data, config);
            }
            case 'put': {
                const { data, ...config } = mergedConfig;
                return this.http.put<T>(endpoint, data, config);
            }
            case 'delete':
                return this.http.delete<T>(endpoint, mergedConfig);
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }
}