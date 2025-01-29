// src/core/http/errors/spotify-errors.ts

import { 
  BaseErrorContext, 
  ErrorCode, 
  ErrorTypeMetadata,
  NormalizedError,
  SpotifyErrorData,
  SpotifyErrorResponse,
  ERROR_CODES,
  ERROR_REGISTRY
} from './types';

/**
* Base error class for all Spotify API related errors
*/
export class SpotifyHttpError extends Error {
  constructor(
      public message: string,
      public statusCode?: number,
      public readonly code: ErrorCode = ERROR_CODES.UNKNOWN,
      public data?: SpotifyErrorData
  ) {
      super(message);
      this.name = 'SpotifyHttpError';
      Object.setPrototypeOf(this, SpotifyHttpError.prototype);
  }

  /**
   * Creates a SpotifyHttpError from any error type
   */
  static createFromError(error: unknown, context?: BaseErrorContext): SpotifyHttpError {
      if (error instanceof SpotifyHttpError) {
          if (context) {
              error.data = {
                  ...error.data,
                  contextData: {
                      ...error.data?.contextData,
                      ...context
                  }
              };
          }
          return error;
      }
      
      if (isSpotifyErrorResponse(error)) {
          return new SpotifyHttpError(
              error.error?.message || 'Unknown Spotify error',
              error.error?.status,
              deriveErrorCode(error.error?.message || ''),
              {
                  originalError: error,
                  contextData: context,
                  error: error.error
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

  getContextData(): BaseErrorContext | undefined {
      return this.data?.contextData;
  }

  getMetadata(): ErrorTypeMetadata {
      return ERROR_REGISTRY[this.code] || ERROR_REGISTRY[ERROR_CODES.UNKNOWN];
  }

  isClientError(): boolean {
      return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false;
  }

  isServerError(): boolean {
      return this.statusCode ? this.statusCode >= 500 : false;
  }

  toNormalizedError(): NormalizedError {
      const metadata = this.getMetadata();
      return {
          code: this.code,
          message: this.message,
          statusCode: this.statusCode || metadata.statusCode,
          context: this.getContextData() || {
              timestamp: new Date().toISOString()
          },
          isRetryable: metadata.isRetryable,
          timestamp: new Date().toISOString(),
          metadata,
          originalError: this.data?.originalError
      };
  }
}

/**
* Error class for rate limiting errors
*/
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

/**
* Error class for authentication errors
*/
export class SpotifyAuthenticationError extends SpotifyHttpError {
  constructor(message: string, public authType: 'token' | 'client') {
      super(
          message, 
          401,
          ERROR_CODES.AUTHENTICATION,
          {
              contextData: {
                  timestamp: new Date().toISOString(),
                  additionalData: { authType }
              }
          }
      );
      this.name = 'SpotifyAuthenticationError';
  }
}

/**
* Error class for validation errors
*/
export class SpotifyValidationError extends SpotifyHttpError {
  constructor(
      message: string,
      public validationDetails: BaseErrorContext['validationErrors']
  ) {
      super(
          message,
          400,
          ERROR_CODES.VALIDATION,
          {
              contextData: {
                  timestamp: new Date().toISOString(),
                  validationErrors: validationDetails
              }
          }
      );
      this.name = 'SpotifyValidationError';
  }
}

// Utility functions

/**
* Type guard for Spotify error responses
*/
export function isSpotifyErrorResponse(data: unknown): data is SpotifyErrorResponse {
  if (typeof data !== 'object' || data === null) return false;
  
  const potentialError = data as SpotifyErrorResponse;
  return !!(
      potentialError.error?.message &&
      typeof potentialError.error.status === 'number'
  );
}

/**
* Derive error code from error message
*/
function deriveErrorCode(message: string): ErrorCode {
  const lowerMessage = message.toLowerCase();
  const codeMap: Record<string, ErrorCode> = {
      'not found': ERROR_CODES.NOT_FOUND,
      'invalid id': ERROR_CODES.INVALID_ID,
      'rate limit': ERROR_CODES.RATE_LIMIT,
      'network error': ERROR_CODES.NETWORK,
      'invalid market': ERROR_CODES.INVALID_MARKET,
      'unauthorized': ERROR_CODES.AUTHENTICATION,
      'forbidden': ERROR_CODES.AUTHENTICATION,
  };

  const matchedKey = Object.keys(codeMap).find(key => 
      lowerMessage.includes(key)
  );

  return matchedKey ? codeMap[matchedKey] : ERROR_CODES.UNKNOWN;
}

/**
* Check if an error is retryable
*/
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof SpotifyHttpError)) return false;
  
  const metadata = error.getMetadata();
  return metadata.isRetryable;
}

/**
* Enhance an error with additional context
*/
export function enhanceErrorWithContext(
  error: unknown,
  context: BaseErrorContext
): SpotifyHttpError {
  return SpotifyHttpError.createFromError(error, {
      ...context,
      timestamp: context.timestamp || new Date().toISOString()
  });
}

/**
* Check if two errors are of the same type
*/
export function areSameErrorType(err1: unknown, err2: unknown): boolean {
  return err1 instanceof SpotifyHttpError && 
         err2 instanceof SpotifyHttpError &&
         err1.code === err2.code;
}

/**
* Type guard for SpotifyHttpError
*/
export function isSpotifyHttpError(error: unknown): error is SpotifyHttpError {
  return error instanceof SpotifyHttpError;
}