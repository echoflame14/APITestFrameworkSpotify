// src/core/http/errors/__tests__/utils.ts

import {
    SpotifyHttpError,
    SpotifyRateLimitError,
    SpotifyValidationError
 } from '../../errors'; // Updated import path
 
 import { ERROR_CODES, type BaseErrorContext } from '../types'; // Import from types
 import type { SpotifyErrorData } from '../types'; // Import SpotifyErrorData type
 
 /**
 * Factory class for creating test error instances
 */
 export class TestErrorFactory {
    /**
     * Creates a rate limit error with specified retry time
     */
    static createRateLimitError(retryAfter = 60): SpotifyRateLimitError {
        const errorData: SpotifyErrorData = {
            retryAfter,
            contextData: {
                requestContext: {
                    endpoint: '/v1/tracks',
                    method: 'GET' // Added required method
                },
                additionalData: {
                    retryAfter,
                    rateLimitLimit: 100,
                    rateLimitRemaining: 0
                }
            }
        };
 
        return new SpotifyRateLimitError(
            'Rate limit exceeded',
            retryAfter,
            errorData
        );
    }
 
    /**
     * Creates a validation error with specified invalid fields
     */
    static createValidationError(
        fields?: string[],
        types?: string[]
    ): SpotifyValidationError {
        return new SpotifyValidationError(
            'Invalid input provided',
            {
                missingFields: fields,
                invalidTypes: types
            }
        );
    }
 
    /**
     * Creates a network error instance
     */
    static createNetworkError(): SpotifyHttpError {
        const errorData: SpotifyErrorData = {
            contextData: {
                additionalData: {
                    code: ERROR_CODES.NETWORK,
                    attempt: 1
                }
            }
        };
 
        return new SpotifyHttpError(
            'Network connection failed',
            0,
            ERROR_CODES.NETWORK,
            errorData
        );
    }
 
    /**
     * Creates a not found error for a specific resource
     */
    static createNotFoundError(resourceType: string, resourceId: string): SpotifyHttpError {
        const errorData: SpotifyErrorData = {
            contextData: {
                resourceType,
                resourceId
            }
        };
 
        return new SpotifyHttpError(
            `${resourceType} not found: ${resourceId}`,
            404,
            ERROR_CODES.NOT_FOUND,
            errorData
        );
    }
 }
 
 /**
 * Type guard assertion for rate limit errors
 */
 export function assertIsRateLimitError(error: unknown): asserts error is SpotifyRateLimitError {
    if (!(error instanceof SpotifyRateLimitError)) {
        throw new Error(`Expected RateLimitError but got ${typeof error}`);
    }
 }
 
 /**
 * Type guard assertion for validation errors
 */
 export function assertIsValidationError(error: unknown): asserts error is SpotifyValidationError {
    if (!(error instanceof SpotifyValidationError)) {
        throw new Error(`Expected ValidationError but got ${typeof error}`);
    }
 }
 
 /**
 * Asserts that an error has the expected error code
 */
 export function assertErrorCode(error: unknown, expectedCode: string): void {
    if (!(error instanceof SpotifyHttpError)) {
        throw new Error('Expected SpotifyHttpError');
    }
    if (error.code !== expectedCode) {
        throw new Error(`Expected error code ${expectedCode} but got ${error.code}`);
    }
 }
 
 /**
 * Asserts that an error contains the expected context data
 */
 export function assertErrorContext(
    error: unknown,
    expectedContext: Partial<BaseErrorContext>
 ): void {
    if (!(error instanceof SpotifyHttpError)) {
        throw new Error('Expected SpotifyHttpError');
    }
 
    const context = error.getContextData();
    if (!context) {
        throw new Error('Error context is undefined');
    }
 
    // Deep comparison of expected context properties
    Object.entries(expectedContext).forEach(([key, value]) => {
        if (JSON.stringify(context[key]) !== JSON.stringify(value)) {
            throw new Error(
                `Context mismatch for ${key}. Expected ${JSON.stringify(value)} but got ${JSON.stringify(context[key])}`
            );
        }
    });
 }
 
 /**
 * Type guard for checking if value is a SpotifyHttpError
 */
 export function isSpotifyError(error: unknown): error is SpotifyHttpError {
    return error instanceof SpotifyHttpError;
 }