// src/core/http/errors/constants.ts
import { ErrorTypeMetadata } from './types';

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

export const ERROR_REGISTRY: Record<string, ErrorTypeMetadata> = {
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
  }
};