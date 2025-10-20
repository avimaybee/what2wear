/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with Sentry integration for error tracking,
 * performance monitoring, and audit trails.
 * 
 * Features:
 * - Multi-level logging (error, warn, info, debug)
 * - Automatic Sentry error reporting
 * - Structured metadata for searchability
 * - Environment-aware (dev vs production)
 * - Request context tracking
 * - Performance timing
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Contextual information for log entries
 */
export interface LogContext {
  /** User ID if available */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** API endpoint or route */
  endpoint?: string;
  /** HTTP method */
  method?: string;
  /** IP address */
  ip?: string;
  /** User agent */
  userAgent?: string;
  /** Any additional metadata */
  [key: string]: unknown;
}

/**
 * Performance timing information
 */
export interface PerformanceTiming {
  /** Operation name */
  operation: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Main logger class
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    if (!this.isDevelopment) return;

    console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    
    if (metadata) {
      console.debug('Metadata:', metadata);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    console.info(this.formatMessage(LogLevel.INFO, message, context));

    // Add breadcrumb to Sentry for context
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      level: 'info',
      data: { ...context, ...metadata },
    });
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));

    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: { ...context, ...metadata },
    });

    // Capture warning in Sentry for tracking
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        custom: context,
      },
      extra: metadata,
    });
  }

  /**
   * Log error messages and report to Sentry
   */
  error(
    message: string,
    error?: Error | unknown,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));

    if (error) {
      console.error('Error details:', error);
    }

    // Set Sentry context
    if (context?.userId) {
      Sentry.setUser({ id: context.userId });
    }

    if (context?.requestId) {
      Sentry.setTag('request_id', context.requestId);
    }

    if (context?.endpoint) {
      Sentry.setTag('endpoint', context.endpoint);
    }

    // Capture error in Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        extra: metadata,
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        contexts: {
          custom: context,
        },
        extra: { ...metadata, originalError: error },
      });
    }
  }

  /**
   * Start performance timing
   */
  startTiming(operation: string, metadata?: Record<string, unknown>): PerformanceTiming {
    const timing: PerformanceTiming = {
      operation,
      startTime: Date.now(),
      metadata,
    };

    this.debug(`Performance timing started: ${operation}`, undefined, metadata);

    return timing;
  }

  /**
   * End performance timing and log result
   */
  endTiming(timing: PerformanceTiming): number {
    timing.endTime = Date.now();
    timing.duration = timing.endTime - timing.startTime;

    this.info(
      `Performance: ${timing.operation} completed in ${timing.duration}ms`,
      undefined,
      timing.metadata
    );

    // Add performance breadcrumb
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${timing.operation}: ${timing.duration}ms`,
      level: 'info',
      data: timing.metadata,
    });

    // Report slow operations (>2s) as warnings
    if (timing.duration > 2000) {
      this.warn(
        `Slow operation detected: ${timing.operation} took ${timing.duration}ms`,
        undefined,
        timing.metadata
      );
    }

    return timing.duration;
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    endpoint: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): PerformanceTiming {
    const timing = this.startTiming(`${method} ${endpoint}`, metadata);

    this.info(`API Request: ${method} ${endpoint}`, context, metadata);

    return timing;
  }

  /**
   * Log API response
   */
  logResponse(
    timing: PerformanceTiming,
    statusCode: number,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const duration = this.endTiming(timing);

    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    const message = `API Response: ${timing.operation} - ${statusCode} (${duration}ms)`;

    if (level === LogLevel.ERROR) {
      this.error(message, undefined, context, { ...metadata, statusCode, duration });
    } else if (level === LogLevel.WARN) {
      this.warn(message, context, { ...metadata, statusCode, duration });
    } else {
      this.info(message, context, { ...metadata, statusCode, duration });
    }
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): PerformanceTiming {
    const timing = this.startTiming(`DB: ${operation} ${table}`, metadata);

    this.debug(`Database operation: ${operation} on ${table}`, context, metadata);

    return timing;
  }

  /**
   * Log successful authentication
   */
  logAuth(userId: string, method: string, metadata?: Record<string, unknown>): void {
    Sentry.setUser({ id: userId });

    this.info(`Authentication successful: ${method}`, { userId }, metadata);
  }

  /**
   * Log failed authentication
   */
  logAuthFailure(email: string, reason: string, context?: LogContext): void {
    this.warn(`Authentication failed: ${reason}`, { ...context, email }, { reason });
  }

  /**
   * Log user action for audit trail
   */
  logUserAction(
    action: string,
    userId: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    this.info(`User action: ${action}`, { userId, ...context }, metadata);

    Sentry.addBreadcrumb({
      category: 'user-action',
      message: action,
      level: 'info',
      data: { userId, ...metadata },
    });
  }

  /**
   * Clear Sentry user context (e.g., on logout)
   */
  clearUserContext(): void {
    Sentry.setUser(null);
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Helper function for tracking async operations
 */
export async function trackOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext,
  metadata?: Record<string, unknown>
): Promise<T> {
  const timing = logger.startTiming(operation, metadata);

  try {
    const result = await fn();
    logger.endTiming(timing);
    return result;
  } catch (error) {
    logger.error(`Operation failed: ${operation}`, error, context, metadata);
    throw error;
  }
}

/**
 * Helper function for tracking sync operations
 */
export function trackSyncOperation<T>(
  operation: string,
  fn: () => T,
  context?: LogContext,
  metadata?: Record<string, unknown>
): T {
  const timing = logger.startTiming(operation, metadata);

  try {
    const result = fn();
    logger.endTiming(timing);
    return result;
  } catch (error) {
    logger.error(`Operation failed: ${operation}`, error, context, metadata);
    throw error;
  }
}
