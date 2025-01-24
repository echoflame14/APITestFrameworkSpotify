// src/core/http/errors.ts

export interface SpotifyErrorResponse {
    error?: {
        message: string;
        status: number;
        code?: string;
    };
    retryAfter?: number;
}

export interface BaseErrorContext {
    validationErrors?: {
        missingFields?: string[];
        invalidTypes?: string[];
        expectedType?: string;
        receivedType?: string;
    };
    // Keep other existing properties
    resourceType?: string;
    resourceId?: string;
    [key: string]: unknown;
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
    declare code: 'PLAYLIST_NOT_FOUND' | 'INVALID_ID_FORMAT' | 
                 'RATE_LIMIT_ERROR' | 'INVALID_MARKET' | 
                 'NETWORK_ERROR' | string;

    constructor(
        public message: string,
        public statusCode?: number,
        code?: string,
        public data?: SpotifyErrorData
    ) {
        super(message);
        this.code = code || this.deriveErrorCode(message);
        this.name = 'SpotifyHttpError';
        Object.setPrototypeOf(this, SpotifyHttpError.prototype);
    }

    private deriveErrorCode(message: string): string {
        const codeMap: Record<string, string> = {
            'not found': 'NOT_FOUND',
            'invalid id': 'INVALID_ID',
            'invalid playlist': 'INVALID_ID_FORMAT',
            'rate limit': 'RATE_LIMIT',
            'network error': 'NETWORK_ERROR',
            'invalid market': 'INVALID_MARKET'
        };

        const lowerMessage = message.toLowerCase();
        const matchedKey = Object.keys(codeMap).find(key => 
            lowerMessage.includes(key)
        );

        return matchedKey ? codeMap[matchedKey] : 'UNKNOWN_ERROR';
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
}

export class SpotifyRateLimitError extends SpotifyHttpError {
    constructor(message: string, retryAfter?: number, data?: SpotifyErrorData) {
        super(
            `Rate limited: ${message}`,
            429,
            'RATE_LIMIT_ERROR',
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

export function isSpotifyErrorResponse(data: unknown): data is SpotifyErrorResponse {
    if (typeof data !== 'object' || data === null) return false;
    
    const potentialError = data as SpotifyErrorResponse;
    return !!(
        potentialError.error?.message &&
        typeof potentialError.error.status === 'number' &&
        (!potentialError.error.code || typeof potentialError.error.code === 'string')
    );
}