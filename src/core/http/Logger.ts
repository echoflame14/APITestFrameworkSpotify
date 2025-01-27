// src/core/http/errors/logger.ts
import { Logger } from '../logging/types';
import { SpotifyHttpError } from './errors/index';
import { RequestContext, StructuredErrorLog } from './errors/types';

export class ErrorLogger {
  constructor(private readonly logger: Logger) {}

  /**
   * Logs an error with full context and metadata
   */
  logError(error: SpotifyHttpError, requestContext?: RequestContext): void {
    const logEntry = this.createErrorLog(error, requestContext);
    
    // Log at appropriate level based on severity
    const metadata = error.getMetadata();
    switch (metadata.severity) {
      case 'high':
        this.logger.error('API request failed', { error: logEntry, request: requestContext });
        break;
      case 'medium':
        this.logger.warn('API request failed', { error: logEntry, request: requestContext });
        break;
      default:
        this.logger.info('API request failed', { error: logEntry, request: requestContext });
    }
  }

  private createErrorLog(error: SpotifyHttpError, requestContext?: RequestContext): StructuredErrorLog {
    const metadata = error.getMetadata();
    
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode || metadata.statusCode,
      context: {
        ...error.getContextData(),
        request: this.sanitizeRequestContext(requestContext)
      },
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: metadata.severity
    };
  }

  private sanitizeRequestContext(context?: RequestContext): Partial<RequestContext> | undefined {
    if (!context) return undefined;

    return {
      ...context,
      headers: this.sanitizeHeaders(context.headers)
    };
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (header.toLowerCase() in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}