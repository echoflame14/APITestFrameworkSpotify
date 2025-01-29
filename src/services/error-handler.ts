// src/services/error-handler.ts

import { 
    SpotifyHttpError, 
    SpotifyRateLimitError,
    SpotifyAuthenticationError,
    SpotifyValidationError
} from '../core/http/errors/spotify-errors';
import {
    SpotifyErrorResponse,
    ERROR_CODES
} from '../core/http/errors/types';
import { BaseErrorContext } from '../core/http/errors/types';

export type ResourceType = 
    'track' | 
    'playlist' | 
    'album' | 
    'artist' |
    'paged-playlists';

export interface ServiceErrorContext extends BaseErrorContext {
    resourceType: ResourceType;
    resourceId?: string;
    market?: string;
    timestamp: string;
    additionalContext?: Record<string, unknown>;
}

/**
 * Centralizes error handling logic for Spotify API services
 */
export class ServiceErrorHandler {
    /**
     * Process errors with service-specific context
     */
    static handleError(error: unknown, context: ServiceErrorContext): never {
        // Ensure we're working with a SpotifyHttpError
        const spotifyError = error instanceof SpotifyHttpError 
            ? error 
            : SpotifyHttpError.createFromError(error);

        const errorData = spotifyError.data || {};
        const apiError = (errorData as SpotifyErrorResponse).error;
        const errorMessage = apiError?.message?.toLowerCase() || '';

        // Process based on status code and message patterns
        switch (spotifyError.statusCode) {
            case 404:
                throw this.handleNotFoundError(context);

            case 429:
                throw this.handleRateLimitError(spotifyError, context);

            case 400:
                throw this.handleBadRequestError(errorMessage, context);

            case 401:
                throw this.handleAuthenticationError(context);

            case 403:
                throw this.handleAuthorizationError(context);

            default:
                throw this.handleGenericError(spotifyError, context);
        }
    }

    private static handleNotFoundError(context: ServiceErrorContext): never {
        throw new SpotifyHttpError(
            `${context.resourceType} not found: ${context.resourceId}`,
            404,
            ERROR_CODES.NOT_FOUND,
            {
                contextData: {
                    ...context,
                    timestamp: new Date().toISOString()
                }
            }
        );
    }

    private static handleRateLimitError(
        originalError: SpotifyHttpError, 
        context: ServiceErrorContext
    ): never {
        throw new SpotifyRateLimitError(
            originalError.message,
            originalError.data?.retryAfter,
            {
                error: originalError.data?.error,
                contextData: {
                    ...context,
                    timestamp: new Date().toISOString()
                }
            }
        );
    }

    private static handleBadRequestError(
        errorMessage: string,
        context: ServiceErrorContext
    ): never {
        if (errorMessage.includes('market')) {
            throw new SpotifyValidationError(
                'Invalid market code provided',
                {
                    invalidTypes: {
                        market: {
                            expected: 'ISO 3166-1 alpha-2 code',
                            received: context.market || 'unknown'
                        }
                    }
                }
            );
        }

        if (errorMessage.includes('invalid id') || errorMessage.includes('base62')) {
            throw new SpotifyValidationError(
                `Invalid ${context.resourceType} ID format`,
                {
                    invalidTypes: {
                        id: {
                            expected: 'Spotify ID format',
                            received: context.resourceId || 'unknown'
                        }
                    }
                }
            );
        }

        throw new SpotifyValidationError(
            `Invalid ${context.resourceType} request`,
            {
                customErrors: {
                    request: errorMessage
                }
            }
        );
    }

    private static handleAuthenticationError(context: ServiceErrorContext): never {
        throw new SpotifyAuthenticationError(
            'Authentication failed. Please check your credentials.',
            'token'
        );
    }

    private static handleAuthorizationError(context: ServiceErrorContext): never {
        throw new SpotifyAuthenticationError(
            'Insufficient permissions for this operation',
            'client'
        );
    }

    private static handleGenericError(
        originalError: SpotifyHttpError,
        context: ServiceErrorContext
    ): never {
        throw new SpotifyHttpError(
            `Failed to process ${context.resourceType} request: ${originalError.message}`,
            originalError.statusCode,
            originalError.code,
            {
                error: originalError.data?.error,
                contextData: {
                    ...context,
                    timestamp: new Date().toISOString()
                }
            }
        );
    }

    /**
     * Validates required fields in API responses
     */
    static validateResponse<T extends object>(
        response: T,
        requiredFields: ReadonlyArray<keyof T>,
        context: ServiceErrorContext
    ): T {
        const missingFields = requiredFields.filter(
            field => !(field in response) || !response[field]
        );

        if (missingFields.length > 0) {
            throw new SpotifyValidationError(
                `Invalid ${context.resourceType} response: missing required fields`,
                {
                    missingFields: missingFields.map(String)
                }
            );
        }

        return response;
    }

    /**
     * Validates market codes
     */
    static validateMarketCode(market: string): boolean {
        return /^[A-Z]{2}$/.test(market) && 
               Intl.getCanonicalLocales(market).length > 0;
    }
}