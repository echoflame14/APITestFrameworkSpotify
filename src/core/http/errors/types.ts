// src/core/http/errors/types.ts

/**
 * Represents the base context for error handling with optional validation and request details
 */
export interface BaseErrorContext {
    resourceType?: string;
    resourceId?: string;
    validationErrors?: ValidationErrors;
    requestContext?: RequestContext;
    additionalData?: Record<string, unknown>;
    [key: string]: unknown; // Allow for extensibility
}

/**
 * Detailed validation error structure
 */
export interface ValidationErrors {
    missingFields?: string[];
    invalidTypes?: string[];
    expectedType?: string;
    receivedType?: string;
}

/**
 * HTTP request context information
 */
export interface RequestContext {
    endpoint: string;
    method: string;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
}

/**
 * Metadata for different types of errors
 */
export interface ErrorTypeMetadata {
    code: string;
    isRetryable: boolean;
    defaultMessage: string;
    severity: 'low' | 'medium' | 'high';
    statusCode: number;
}

/**
 * Standardized error format for consistent error handling
 */
export interface NormalizedError {
    code: string;
    message: string;
    statusCode: number;
    context: BaseErrorContext;
    isRetryable: boolean;
    timestamp: string;
}

/**
 * Structure for logging errors
 */
export interface StructuredErrorLog {
    code: string;
    message: string;
    statusCode: number;
    context: BaseErrorContext;
    stack?: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
}

/**
 * Spotify API specific error response structure
 */
export interface SpotifyErrorResponse {
    error?: {
        message: string;
        status: number;
        code?: string;
    };
    retryAfter?: number;
}

/**
 * Extended error data specific to Spotify API errors
 */
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

/**
 * Union type for supported error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high';

/**
 * Constant error codes for consistent error identification
 */
export const ERROR_CODES = {
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    NETWORK: 'NETWORK_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    INVALID_ID: 'INVALID_ID_FORMAT',
    INVALID_MARKET: 'INVALID_MARKET',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
} as const;

/**
 * Type for error code string literals
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Registry of error metadata for each error type
 */
export const ERROR_REGISTRY: Record<ErrorCode, ErrorTypeMetadata> = {
    [ERROR_CODES.RATE_LIMIT]: {
        code: ERROR_CODES.RATE_LIMIT,
        isRetryable: true,
        defaultMessage: 'Rate limit exceeded. Please try again later.',
        severity: 'medium',
        statusCode: 429
    },
    [ERROR_CODES.VALIDATION]: {
        code: ERROR_CODES.VALIDATION,
        isRetryable: false,
        defaultMessage: 'Invalid request data provided.',
        severity: 'high',
        statusCode: 400
    },
    [ERROR_CODES.NETWORK]: {
        code: ERROR_CODES.NETWORK,
        isRetryable: true,
        defaultMessage: 'Network connection failed.',
        severity: 'high',
        statusCode: 0
    },
    [ERROR_CODES.AUTHENTICATION]: {
        code: ERROR_CODES.AUTHENTICATION,
        isRetryable: false,
        defaultMessage: 'Authentication failed.',
        severity: 'high',
        statusCode: 401
    },
    [ERROR_CODES.NOT_FOUND]: {
        code: ERROR_CODES.NOT_FOUND,
        isRetryable: false,
        defaultMessage: 'Resource not found.',
        severity: 'medium',
        statusCode: 404
    },
    [ERROR_CODES.INVALID_ID]: {
        code: ERROR_CODES.INVALID_ID,
        isRetryable: false,
        defaultMessage: 'Invalid ID format provided.',
        severity: 'high',
        statusCode: 400
    },
    [ERROR_CODES.INVALID_MARKET]: {
        code: ERROR_CODES.INVALID_MARKET,
        isRetryable: false,
        defaultMessage: 'Invalid market code provided.',
        severity: 'medium',
        statusCode: 400
    },
    [ERROR_CODES.SERVER_ERROR]: {
        code: ERROR_CODES.SERVER_ERROR,
        isRetryable: true,
        defaultMessage: 'Internal server error occurred.',
        severity: 'high',
        statusCode: 500
    },
    [ERROR_CODES.UNKNOWN]: {
        code: ERROR_CODES.UNKNOWN,
        isRetryable: false,
        defaultMessage: 'An unknown error occurred.',
        severity: 'high',
        statusCode: 500
    }
};