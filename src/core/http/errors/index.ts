// src/core/http/errors/index.ts

// Export base types
export type {
    ErrorCode,
    BaseErrorContext,
    ErrorTypeMetadata,
    NormalizedError,
    RequestContext,
    SpotifyErrorData,
    SpotifyErrorResponse,
    StructuredErrorLog
} from './types';

// Export constants - single source from constants.ts
export {
    ERROR_CODES,
    ERROR_REGISTRY
} from './constants';

// Export Spotify error classes
export {
    SpotifyHttpError,
    SpotifyRateLimitError,
    SpotifyValidationError
} from './spotify-errors';

// Export the logger
export { ErrorLogger } from '../Logger';