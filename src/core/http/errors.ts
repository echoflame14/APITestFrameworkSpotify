// src/core/http/errors.ts
import type { 
    BaseErrorContext, 
    ErrorTypeMetadata, 
    NormalizedError,
    ErrorCode
} from './errors/types';

import { ERROR_CODES, ERROR_REGISTRY } from './errors/types';

export interface SpotifyErrorResponse {
    error?: {
        message: string;
        status: number;
        code?: string;
    };
    retryAfter?: number;
} 

export interface SpotifyErrorData {
    error?: {
        message: string;
        status: number;
        code?: string;
    };
    retryAfter?: number;
    originalError?: unknown;
    originalStatus?: number;
    contextData?: BaseErrorContext;
    market?: string;
    additionalContext?: Record<string, unknown>;
    spotifyError?: {
        message: string;
        status: number;
        code?: string;
    };
    playlistId?: string;
}

export class SpotifyHttpError extends Error {
    declare code: ErrorCode;

    constructor(
        public message: string,
        public statusCode?: number,
        code?: ErrorCode,
        public data?: SpotifyErrorData
    ) {
        super(message);
        this.code = code || this.deriveErrorCode(message) as ErrorCode;
        this.name = 'SpotifyHttpError';
        Object.setPrototypeOf(this, SpotifyHttpError.prototype);
    }

    static createFromError(error: unknown, context?: BaseErrorContext): SpotifyHttpError {
        if (error instanceof SpotifyHttpError) return error;
        
        if (isSpotifyErrorResponse(error)) {
            return new SpotifyHttpError(
                error.error?.message || 'Unknown Spotify error',
                error.error?.status,
                error.error?.code as ErrorCode,
                {
                    originalError: error,
                    contextData: context
                }
            );
        }

        if (error instanceof Error) {
            return new SpotifyHttpError(
                error.message,
                undefined,
                ERROR_CODES.UNKNOWN,
                {
                    originalError: error,
                    contextData: context
                }
            );
        }

        return new SpotifyHttpError(
            'Unknown error occurred',
            undefined,
            ERROR_CODES.UNKNOWN,
            { contextData: context }
        );
    }

    private deriveErrorCode(message: string): ErrorCode {
        const codeMap: Record<string, ErrorCode> = {
            'not found': ERROR_CODES.NOT_FOUND,
            'invalid id': ERROR_CODES.INVALID_ID,
            'invalid playlist': ERROR_CODES.INVALID_ID,
            'rate limit': ERROR_CODES.RATE_LIMIT,
            'network error': ERROR_CODES.NETWORK,
            'invalid market': ERROR_CODES.INVALID_MARKET
        };

        const lowerMessage = message.toLowerCase();
        const matchedKey = Object.keys(codeMap).find(key => 
            lowerMessage.includes(key)
        );

        return matchedKey ? codeMap[matchedKey] : ERROR_CODES.UNKNOWN;
    }

    getMetadata(): ErrorTypeMetadata {
        return ERROR_REGISTRY[this.code] || ERROR_REGISTRY[ERROR_CODES.UNKNOWN];
    }

    getSpotifyErrorMessage(): string {
        return this.data?.error?.message || this.message;
    }

    getContextData(): BaseErrorContext | undefined {
        return this.data?.contextData;
    }

    isClientError(): boolean {
        return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false;
    }

    isServerError(): boolean {
        return this.statusCode ? this.statusCode >= 500 : false;
    }

    toNormalizedError(): NormalizedError {
        const metadata = this.getMetadata();
        const now = new Date().toISOString();
        const contextData = this.getContextData();
        
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode || metadata.statusCode,
            context: {
                ...(contextData || {}),
                timestamp: contextData?.timestamp || now
            },
            isRetryable: metadata.isRetryable,
            timestamp: now,
            metadata
        };
    }
}

export class SpotifyRateLimitError extends SpotifyHttpError {
    constructor(message: string, retryAfter?: number, data?: SpotifyErrorData) {
        super(
            `Rate limited: ${message}`,
            429,
            ERROR_CODES.RATE_LIMIT,
            {
                ...data,
                retryAfter
            }
        );
        this.name = 'SpotifyRateLimitError';
    }

    getRetryAfter(): number {
        return this.data?.retryAfter || 0;
    }
}

export class SpotifyAuthenticationError extends SpotifyHttpError {
    constructor(message: string, public authType: 'token' | 'client') {
        super(message, 401, ERROR_CODES.AUTHENTICATION);
        this.name = 'SpotifyAuthenticationError';
    }
}

export class SpotifyValidationError extends SpotifyHttpError {
    constructor(
        message: string,
        public validationDetails: BaseErrorContext['validationErrors']
    ) {
        super(message, 400, ERROR_CODES.VALIDATION);
        this.name = 'SpotifyValidationError';
    }
}

export class TrackValidationError extends SpotifyHttpError {
    constructor(message: string, public invalidFields: string[]) {
        super(message, 400, ERROR_CODES.VALIDATION);
        this.name = 'TrackValidationError';
    }
}

export function isSpotifyErrorResponse(data: unknown): data is SpotifyErrorResponse {
    if (typeof data !== 'object' || data === null) return false;
    
    const potentialError = data as SpotifyErrorResponse;
    return !!(
        potentialError.error?.message &&
        typeof potentialError.error.status === 'number' &&
        (!potentialError.error.code || typeof potentialError.error.code === 'string')
    );
}

export function enhanceErrorWithContext(
    error: unknown,
    context: BaseErrorContext
): SpotifyHttpError {
    const spotifyError = SpotifyHttpError.createFromError(error);
    spotifyError.data = {
        ...spotifyError.data,
        contextData: {
            ...spotifyError.data?.contextData,
            ...context,
            timestamp: context.timestamp || new Date().toISOString()
        }
    };
    return spotifyError;
}

export function isRetryableError(error: unknown): boolean {
    if (!(error instanceof SpotifyHttpError)) return false;
    
    return (
        error.code === ERROR_CODES.RATE_LIMIT ||
        error.code === ERROR_CODES.NETWORK ||
        (error.statusCode !== undefined && error.statusCode >= 500)
    );
}

export function areSameErrorType(err1: unknown, err2: unknown): boolean {
    return err1 instanceof SpotifyHttpError && 
           err2 instanceof SpotifyHttpError &&
           err1.code === err2.code;
}

export function isInstanceOfSpotifyError(error: unknown): error is SpotifyHttpError {
    return error instanceof SpotifyHttpError;
}