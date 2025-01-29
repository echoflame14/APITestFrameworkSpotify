// src/core/http/errors/types.ts

/**
 * Constant error codes for consistent error identification
 */
export const ERROR_CODES = {
    // Authorization Errors
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    
    // Client Errors
    VALIDATION: 'VALIDATION_ERROR',
    INVALID_ID: 'INVALID_ID_FORMAT',
    INVALID_METHOD: 'INVALID_METHOD',
    INVALID_MARKET: 'INVALID_MARKET',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    NOT_FOUND: 'NOT_FOUND',
    
    // Rate Limiting
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Network/Server Errors
    NETWORK: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    
    // Generic
    UNKNOWN: 'UNKNOWN_ERROR'
} as const;

/**
 * Type for error code string literals
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high';

/**
 * Metadata for different types of errors
 */
export interface ErrorTypeMetadata {
    code: ErrorCode;
    isRetryable: boolean;
    defaultMessage: string;
    severity: ErrorSeverity;
    statusCode: number;
}

/**
 * Detailed validation error structure
 */
export interface ValidationErrors {
    missingFields?: string[];
    invalidTypes?: Record<string, { expected: string; received: string }>;
    customErrors?: Record<string, string>;
}

/**
 * HTTP request context information
 */
export interface RequestContext {
    endpoint: string;
    method: string;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    timestamp?: string;
}

/**
 * Base context for all errors
 */
export interface BaseErrorContext {
    resourceType?: string;
    resourceId?: string;
    validationErrors?: ValidationErrors;
    requestContext?: RequestContext;
    timestamp: string;
    correlationId?: string;
    additionalData?: Record<string, unknown>;
}

/**
 * Standardized error format
 */
export interface NormalizedError {
    code: ErrorCode;
    message: string;
    statusCode: number;
    context: BaseErrorContext;
    isRetryable: boolean;
    timestamp: string;
    metadata: ErrorTypeMetadata;
    originalError?: unknown;
}

/**
 * Spotify API error response structure
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
 * Spotify specific error data
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
}

/**
 * Registry of error metadata
 */
export const ERROR_REGISTRY: Record<ErrorCode, ErrorTypeMetadata> = {
    [ERROR_CODES.AUTHENTICATION]: {
        code: ERROR_CODES.AUTHENTICATION,
        isRetryable: false,
        defaultMessage: 'Authentication failed',
        severity: 'high',
        statusCode: 401
    },
    [ERROR_CODES.AUTH_ERROR]: {
        code: ERROR_CODES.AUTH_ERROR,
        isRetryable: false,
        defaultMessage: 'Authentication error occurred',
        severity: 'high',
        statusCode: 401
    },
    [ERROR_CODES.TOKEN_EXPIRED]: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        isRetryable: true,
        defaultMessage: 'Authentication token has expired',
        severity: 'medium',
        statusCode: 401
    },
    [ERROR_CODES.VALIDATION]: {
        code: ERROR_CODES.VALIDATION,
        isRetryable: false,
        defaultMessage: 'Invalid request data provided',
        severity: 'high',
        statusCode: 400
    },
    [ERROR_CODES.INVALID_ID]: {
        code: ERROR_CODES.INVALID_ID,
        isRetryable: false,
        defaultMessage: 'Invalid ID format provided',
        severity: 'high',
        statusCode: 400
    },
    [ERROR_CODES.INVALID_METHOD]: {
        code: ERROR_CODES.INVALID_METHOD,
        isRetryable: false,
        defaultMessage: 'Invalid HTTP method used',
        severity: 'high',
        statusCode: 405
    },
    [ERROR_CODES.INVALID_MARKET]: {
        code: ERROR_CODES.INVALID_MARKET,
        isRetryable: false,
        defaultMessage: 'Invalid market code provided',
        severity: 'medium',
        statusCode: 400
    },
    [ERROR_CODES.INVALID_RESPONSE]: {
        code: ERROR_CODES.INVALID_RESPONSE,
        isRetryable: false,
        defaultMessage: 'Invalid response received',
        severity: 'high',
        statusCode: 500
    },
    [ERROR_CODES.NOT_FOUND]: {
        code: ERROR_CODES.NOT_FOUND,
        isRetryable: false,
        defaultMessage: 'Resource not found',
        severity: 'medium',
        statusCode: 404
    },
    [ERROR_CODES.RATE_LIMIT]: {
        code: ERROR_CODES.RATE_LIMIT,
        isRetryable: true,
        defaultMessage: 'Rate limit exceeded',
        severity: 'medium',
        statusCode: 429
    },
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        isRetryable: true,
        defaultMessage: 'Rate limit exceeded',
        severity: 'medium',
        statusCode: 429
    },
    [ERROR_CODES.NETWORK]: {
        code: ERROR_CODES.NETWORK,
        isRetryable: true,
        defaultMessage: 'Network error occurred',
        severity: 'high',
        statusCode: 0
    },
    [ERROR_CODES.SERVER_ERROR]: {
        code: ERROR_CODES.SERVER_ERROR,
        isRetryable: true,
        defaultMessage: 'Server error occurred',
        severity: 'high',
        statusCode: 500
    },
    [ERROR_CODES.UNKNOWN]: {
        code: ERROR_CODES.UNKNOWN,
        isRetryable: false,
        defaultMessage: 'An unknown error occurred',
        severity: 'high',
        statusCode: 500
    }
};