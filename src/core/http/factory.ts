// src/core/http/errors/factory.ts
import { AxiosError } from 'axios';
import { Logger } from '../logging/types';
import { 
    NormalizedError, 
    BaseErrorContext,
    SpotifyHttpError,
    SpotifyRateLimitError,
    SpotifyValidationError,
    ERROR_CODES,
    ERROR_REGISTRY,
    ErrorTypeMetadata
} from './errors';  // Import from parent errors directory

export class ErrorFactory {
  constructor(private readonly logger: Logger) {}

  /**
   * Normalizes any error into our standard error format
   */
  normalizeError(error: unknown, context?: BaseErrorContext): NormalizedError {
    if (error instanceof SpotifyHttpError) {
      return this.normalizeSpotifyError(error);
    }

    if (error instanceof AxiosError) {
      return this.normalizeAxiosError(error, context);
    }

    return this.normalizeUnknownError(error, context);
  }

  private normalizeSpotifyError(error: SpotifyHttpError): NormalizedError {
    const metadata = error.getMetadata();
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode || metadata.statusCode,
      context: error.getContextData() || {},
      isRetryable: metadata.isRetryable,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeAxiosError(error: AxiosError, context?: BaseErrorContext): NormalizedError {
    const status = error.response?.status || 0;
    const code = this.determineErrorCode(error);
    const metadata = ERROR_REGISTRY[code];

    return {
      code,
      message: this.extractErrorMessage(error),
      statusCode: status,
      context: {
        ...context,
        requestContext: {
          endpoint: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        },
      },
      isRetryable: metadata.isRetryable,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeUnknownError(error: unknown, context?: BaseErrorContext): NormalizedError {
    const metadata = ERROR_REGISTRY[ERROR_CODES.UNKNOWN];
    
    return {
      code: ERROR_CODES.UNKNOWN,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      statusCode: metadata.statusCode,
      context: {
        ...context,
        additionalData: { originalError: error }
      },
      isRetryable: metadata.isRetryable,
      timestamp: new Date().toISOString()
    };
  }

  private determineErrorCode(error: AxiosError): string {
    if (!error.response) return ERROR_CODES.NETWORK;
    
    const status = error.response.status;
    switch (status) {
      case 429: return ERROR_CODES.RATE_LIMIT;
      case 400: return ERROR_CODES.VALIDATION;
      case 401: return ERROR_CODES.AUTHENTICATION;
      case 404: return ERROR_CODES.NOT_FOUND;
      default: return status >= 500 ? ERROR_CODES.SERVER_ERROR : ERROR_CODES.UNKNOWN;
    }
  }

  private extractErrorMessage(error: AxiosError): string {
    const responseData = error.response?.data as Record<string, any>;
    if (responseData?.error?.message) {
      return responseData.error.message;
    }
    return error.message;
  }
}
