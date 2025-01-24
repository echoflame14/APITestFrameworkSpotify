// src/core/http/errors.ts

// Define the shape of error responses from Spotify's API
export interface SpotifyErrorResponse {
    error?: {
        message: string;
        status: number;
        code?: string;
    };
}

// Our main error class for handling Spotify HTTP errors
export class SpotifyHttpError extends Error {
    constructor(
      public message: string,
      public statusCode?: number,
      public code?: string,
      public data?: unknown
    ) {
      super(message);
      Object.setPrototypeOf(this, SpotifyHttpError.prototype);
    }
  }

// Type guard to safely check if a response matches Spotify's error format
export function isSpotifyErrorResponse(data: unknown): data is SpotifyErrorResponse {
    return typeof data === 'object' && 
           data !== null && 
           ('error' in data || Object.keys(data).length === 0);
}

// Specialized error classes for specific scenarios
export class SpotifyAuthError extends SpotifyHttpError {
    constructor(message: string) {
        super(message, 401, 'AUTH_ERROR');
        this.name = 'SpotifyAuthError';
    }
}

export class SpotifyRateLimitError extends SpotifyHttpError {
    constructor(message: string, retryAfter?: number) {
        super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
        this.name = 'SpotifyRateLimitError';
    }
}