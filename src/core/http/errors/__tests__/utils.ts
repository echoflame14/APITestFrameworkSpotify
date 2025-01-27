// src/core/http/errors/__tests__/utils.ts

import {
    SpotifyHttpError,
    SpotifyRateLimitError,
    SpotifyValidationError,
    ERROR_CODES,
    type BaseErrorContext,
    type SpotifyErrorData,
    ERROR_REGISTRY
} from '../index'; // Import from parent index

/**
 * Factory class for creating test error instances
 */
export class TestErrorFactory {
    // Example factory method
    static createRateLimitError(retryAfter = 30): SpotifyRateLimitError {
        return new SpotifyRateLimitError(
            'Test rate limit error',
            retryAfter,
            {
                contextData: {
                    additionalData: {
                        rateLimitLimit: 100,
                        rateLimitRemaining: 0
                    }
                }
            }
        );
    }

    // Add other factory methods as needed
}

// Type guard for Spotify error responses
export function isSpotifyErrorResponse(data: unknown): data is { error: { message: string; status: number; code?: string } } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as any).error === 'object' &&
    typeof (data as any).error.message === 'string' &&
    typeof (data as any).error.status === 'number'
  );
}

// Type guard for general Spotify errors (no need to redeclare SpotifyHttpError)
export function isSpotifyError(error: unknown): error is SpotifyHttpError {
  return error instanceof SpotifyHttpError;
}