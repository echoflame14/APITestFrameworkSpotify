// base.service.ts
import { AxiosRequestConfig } from 'axios';
import { HttpClient } from '../core/http/client';
import { AuthHandler } from '../core/auth/handler';
import { SpotifyHttpError, SpotifyErrorData, SpotifyErrorResponse } from '../core/http/errors';

export interface ServiceDependencies {
    http: HttpClient;
    auth: AuthHandler;
}

// src/services/base.service.ts
export type ResourceType = 
  'track' | 
  'playlist' | 
  'album' | 
  'artist' |
  'paged-playlists';  // Add here
  
export interface ErrorContext {
    resourceType: ResourceType;
    resourceId: string;
    additionalContext?: Record<string, unknown>;
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
                throw new SpotifyHttpError(
                    `Unsupported HTTP method: ${method}`,
                    500,
                    'INVALID_METHOD'
                );
        }
    }

    protected isValidMarketCode(market: string): boolean {
        return /^[A-Z]{2}$/.test(market) && 
               Intl.getCanonicalLocales(market).length > 0;
    }

    protected handleResourceError(error: SpotifyHttpError, context: ErrorContext): never {
        const errorData = error.data || {};
        const spotifyError = (errorData as SpotifyErrorResponse).error;
        const errorMessage = spotifyError?.message?.toLowerCase() || '';

        // Handle common error patterns
        switch (error.statusCode) {
            case 404:
                throw new SpotifyHttpError(
                    `${context.resourceType} not found: ${context.resourceId}`,
                    404,
                    `${context.resourceType.toUpperCase()}_NOT_FOUND`,
                    {
                        error: spotifyError,
                        contextData: {
                            resourceType: context.resourceType,
                            resourceId: context.resourceId,
                            ...context.additionalContext
                        }
                    }
                );

                case 429:
                    throw new SpotifyHttpError(
                      error.message, // Preserve original message
                      error.statusCode,
                      error.code === 'RATE_LIMIT_ERROR' ? error.code : 'RATE_LIMIT_EXCEEDED',
                      {
                        error: spotifyError,
                        retryAfter: errorData.retryAfter,
                        contextData: context.additionalContext
                      }
                    );

            case 400:
                if (errorMessage.includes('market')) {
                    throw new SpotifyHttpError(
                        'Invalid market code provided',
                        400,
                        'INVALID_MARKET',
                        {
                            error: spotifyError,
                            contextData: context.additionalContext
                        }
                    );
                }
                if (errorMessage.includes('invalid id') || errorMessage.includes('base62')) {
                    throw new SpotifyHttpError(
                        `Invalid ${context.resourceType} ID format: ${context.resourceId}`,
                        400,
                        'INVALID_ID_FORMAT',
                        {
                            error: spotifyError,
                            contextData: {
                                resourceType: context.resourceType,
                                resourceId: context.resourceId
                            }
                        }
                    );
                }
                break;

            case 401:
                throw new SpotifyHttpError(
                    'Authentication failed. Please check your credentials.',
                    401,
                    'AUTH_ERROR',
                    {
                        error: spotifyError,
                        contextData: context.additionalContext
                    }
                );
        }

        // Default error handling with enhanced context
        throw new SpotifyHttpError(
            `Failed to process ${context.resourceType} request: ${errorMessage || error.message}`,
            error.statusCode || 500,
            error.code || 'UNKNOWN_ERROR',
            {
                error: spotifyError,
                contextData: {
                    resourceType: context.resourceType,
                    resourceId: context.resourceId,
                    ...context.additionalContext
                }
            }
        );
    }

    protected validateRequiredFields<T extends object>(
        response: T,
        requiredFields: ReadonlyArray<keyof T>,
        resourceType: ResourceType
    ): T {
        for (const field of requiredFields) {
            if (!(field in response) || !response[field]) {
                throw new SpotifyHttpError(
                    `Invalid ${resourceType} response: missing ${String(field)}`,
                    500,
                    'INVALID_RESPONSE',
                    {
                        contextData: {
                            resourceType,
                            missingField: field
                        }
                    }
                );
            }
        }
        return response;
    }
}