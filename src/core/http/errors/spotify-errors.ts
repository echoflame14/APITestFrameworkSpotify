// src/core/http/errors/spotify-errors.ts
import { BaseErrorContext } from './types';
import { ERROR_REGISTRY } from './constants';

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
}

export class SpotifyHttpError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public readonly code: string = 'UNKNOWN_ERROR',
    public data?: SpotifyErrorData
  ) {
    super(message);
    this.name = 'SpotifyHttpError';
    Object.setPrototypeOf(this, SpotifyHttpError.prototype);
  }

  getContextData(): BaseErrorContext | undefined {
    return this.data?.contextData;
  }

  getMetadata() {
    return ERROR_REGISTRY[this.code] || ERROR_REGISTRY['UNKNOWN_ERROR'];
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

export class SpotifyValidationError extends SpotifyHttpError {
  constructor(
    message: string,
    public validationDetails: BaseErrorContext['validationErrors']
  ) {
    super(message, 400, 'VALIDATION_ERROR', {
      contextData: { validationErrors: validationDetails }
    });
    this.name = 'SpotifyValidationError';
  }
}