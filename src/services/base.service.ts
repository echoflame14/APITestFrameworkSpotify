// src/services/base.service.ts

import { AxiosRequestConfig } from 'axios';
import { HttpClient } from '../core/http/client';
import { AuthHandler } from '../core/auth/handler';
import { SpotifyHttpError } from '../core/http/errors/spotify-errors';
import { ServiceErrorHandler, ResourceType, ServiceErrorContext } from './error-handler';

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
        try {
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
                    return await this.http.get<T>(endpoint, mergedConfig);
                case 'post': {
                    const { data, ...config } = mergedConfig;
                    return await this.http.post<T>(endpoint, data, config);
                }
                case 'put': {
                    const { data, ...config } = mergedConfig;
                    return await this.http.put<T>(endpoint, data, config);
                }
                case 'delete':
                    return await this.http.delete<T>(endpoint, mergedConfig);
                default:
                    throw new SpotifyHttpError(
                        `Unsupported HTTP method: ${method}`,
                        405,
                        'INVALID_METHOD'
                    );
            }
        } catch (error) {
            ServiceErrorHandler.handleError(error, {
                resourceType: this.getResourceType(),
                timestamp: new Date().toISOString()
            });
        }
    }

    protected abstract getResourceType(): ResourceType;

    protected createErrorContext(
        resourceId?: string,
        additionalContext?: Record<string, unknown>
    ): ServiceErrorContext {
        return {
            resourceType: this.getResourceType(),
            resourceId,
            timestamp: new Date().toISOString(),
            additionalContext
        };
    }

    protected validateRequiredFields<T extends object>(
        response: T,
        requiredFields: ReadonlyArray<keyof T>
    ): T {
        return ServiceErrorHandler.validateResponse(
            response,
            requiredFields,
            this.createErrorContext()
        );
    }

    protected validateMarketCode(market: string): boolean {
        return ServiceErrorHandler.validateMarketCode(market);
    }
}