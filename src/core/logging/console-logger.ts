// src/core/logging/console-logger.ts
import { Logger } from './types';

export class ConsoleLogger implements Logger {
    private static readonly IS_TEST_ENV = process.env.NODE_ENV === 'test';
    
    static testMode = {
        silent: ConsoleLogger.IS_TEST_ENV,
        capture: false,
        logs: [] as Array<{
            type: 'log' | 'error' | 'warn';
            message: string;
            meta: any[];
            timestamp: number;
        }>
    };

    info(message: string, ...meta: any[]): void {
        this.log('log', message, meta);
    }

    error(message: string, ...meta: any[]): void {
        this.log('error', message, meta);
    }

    warn(message: string, ...meta: any[]): void {
        this.log('warn', message, meta);
    }

    private log(type: 'log' | 'error' | 'warn', message: string, meta: any[]) {
        const entry = {
            type,
            message,
            meta: this.sanitizeMeta(meta),
            timestamp: Date.now()
        };

        if (ConsoleLogger.testMode.capture) {
            ConsoleLogger.testMode.logs.push(entry);
        }

        if (!ConsoleLogger.testMode.silent) {
            const consoleMethod = console[type] || console.log;
            consoleMethod(`[${type.toUpperCase()}] ${message}`, ...entry.meta);
        }
    }

    private sanitizeMeta(meta: any[]): any[] {
        return meta.map(item => {
            if (item instanceof Error) {
                return this.sanitizeError(item);
            }
            if (typeof item === 'object' && item !== null) {
                return this.sanitizeObject(item);
            }
            return item;
        });
    }

    private sanitizeError(error: Error): Record<string, unknown> {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error as any).metadata && { metadata: (error as any).metadata }
        };
    }

    private sanitizeObject(obj: Record<string, any>): Record<string, unknown> {
        const sensitiveKeys = ['authorization', 'cookie', 'access_token'];
        const redactedValue = '[REDACTED]';

        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (key === 'headers') {
                acc[key] = this.sanitizeHeaders(value);
                return acc;
            }

            if (sensitiveKeys.includes(key.toLowerCase())) {
                acc[key] = redactedValue;
                return acc;
            }

            acc[key] = typeof value === 'object' && value !== null 
                ? this.sanitizeObject(value) 
                : value;

            return acc;
        }, {} as Record<string, unknown>);
    }

    private sanitizeHeaders(headers: Record<string, any>): Record<string, unknown> {
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'set-cookie',
            'client-token',
            'content-access-token'
        ];

        return Object.entries(headers).reduce((acc, [key, value]) => {
            acc[key] = sensitiveHeaders.includes(key.toLowerCase())
                ? '[REDACTED]'
                : value;
            return acc;
        }, {} as Record<string, unknown>);
    }

    // Test utilities
    static clearLogs(): void {
        this.testMode.logs = [];
    }

    static getCapturedLogs(): Array<{ type: string; message: string }> {
        return this.testMode.logs.map(({ type, message }) => ({ type, message }));
    }

    static enableTestCapture(): void {
        this.testMode.capture = true;
        this.testMode.silent = true;
    }

    static disableTestCapture(): void {
        this.testMode.capture = false;
        this.testMode.silent = ConsoleLogger.IS_TEST_ENV;
    }
}