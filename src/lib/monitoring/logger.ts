/**
 * Centralized Logging Utility with Distributed Tracing
 * 
 * Provides structured logging with Sentry integration for error tracking,
 * performance monitoring, and audit trails.
 * 
 * Features:
 * - Multi-level logging (error, warn, info, debug)
 * - Automatic Sentry error reporting
 * - Distributed tracing with correlation IDs
 * - Structured metadata for searchability
 * - Environment-aware (dev vs production)
 * - Request context tracking with trace context
 * - Performance timing with span correlation
 * - JSON log formatting for log aggregation
 */

import * as Sentry from '@sentry/nextjs';
import type { TraceContext } from './tracing';

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
 * Contextual information for log entries with distributed tracing
 */
export interface LogContext {
  /** User ID if available */
  userId?: string;
  /** Request ID for tracing (correlation ID) */
  requestId?: string;
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for current operation */
  spanId?: string;
  /** Parent span ID for nested operations */
  parentSpanId?: string;
  /** Session ID from authentication */
  sessionId?: string;
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
 * Structured log entry for JSON formatting
 */
export interface StructuredLogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Trace context */
  trace?: {
    requestId?: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
  /** User context */
  user?: {
    userId?: string;
    sessionId?: string;
  };
  /** Request context */
  request?: {
    endpoint?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
  };
  /** Error details if present */
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Environment */
  environment: string;
}

/**
 * Main logger class with distributed tracing support
 */
class Logger {
  private isDevelopment: boolean;
  private useJsonFormat: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // Use JSON format in production for log aggregation tools
    this.useJsonFormat = process.env.LOG_FORMAT === 'json' || !this.isDevelopment;
  }

  /**
   * Create trace context from LogContext
   */
  private extractTraceContext(context?: LogContext): StructuredLogEntry['trace'] | undefined {
    if (!context) return undefined;

    const { requestId, traceId, spanId, parentSpanId } = context;
    if (!requestId && !traceId && !spanId && !parentSpanId) return undefined;

    return {
      requestId,
      traceId,
      spanId,
      parentSpanId,
    };
  }

  /**
   * Create user context from LogContext
   */
  private extractUserContext(context?: LogContext): StructuredLogEntry['user'] | undefined {
    if (!context) return undefined;

    const { userId, sessionId } = context;
    if (!userId && !sessionId) return undefined;

    return {
      userId,
      sessionId,
    };
  }

  /**
   * Create request context from LogContext
   */
  private extractRequestContext(context?: LogContext): StructuredLogEntry['request'] | undefined {
    if (!context) return undefined;

    const { endpoint, method, ip, userAgent } = context;
    if (!endpoint && !method && !ip && !userAgent) return undefined;

    return {
      endpoint,
      method,
      ip,
      userAgent,
    };
  }

  /**
   * Format log as JSON structure for log aggregation
   */
  private formatAsJson(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown,
    metadata?: Record<string, unknown>
  ): string {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      trace: this.extractTraceContext(context),
      user: this.extractUserContext(context),
      request: this.extractRequestContext(context),
      metadata,
    };

    // Add error details if present
    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return JSON.stringify(entry);
  }

  /**
   * Format log message with timestamp and context (human-readable)
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    
    // Build trace info string
    let traceInfo = '';
    if (context?.requestId) traceInfo += `reqId=${context.requestId}`;
    if (context?.traceId) traceInfo += traceInfo ? ` traceId=${context.traceId}` : `traceId=${context.traceId}`;
    if (context?.spanId) traceInfo += traceInfo ? ` spanId=${context.spanId}` : `spanId=${context.spanId}`;
    
    const traceStr = traceInfo ? ` [${traceInfo}]` : '';
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}]${traceStr} ${message}${contextStr}`;
  }

  /**
   * Output log based on format preference
   */
  private outputLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown,
    metadata?: Record<string, unknown>
  ): void {
    if (this.useJsonFormat) {
      // JSON format for production/log aggregation
      const jsonLog = this.formatAsJson(level, message, context, error, metadata);
      console.log(jsonLog);
    } else {
      // Human-readable format for development
      const formattedMessage = this.formatMessage(level, message, context);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          if (error) console.error('Error details:', error);
          break;
      }
      
      if (metadata && Object.keys(metadata).length > 0) {
        console.log('Metadata:', metadata);
      }
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    if (!this.isDevelopment) return;

    this.outputLog(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.outputLog(LogLevel.INFO, message, context, undefined, metadata);

    // Add breadcrumb to Sentry for context
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      level: 'info',
      data: { 
        ...context, 
        ...metadata,
        traceId: context?.traceId,
        spanId: context?.spanId,
      },
    });
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.outputLog(LogLevel.WARN, message, context, undefined, metadata);

    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: { 
        ...context, 
        ...metadata,
        traceId: context?.traceId,
        spanId: context?.spanId,
      },
    });

    // Capture warning in Sentry for tracking
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        custom: context,
        ...(context?.traceId && context?.spanId && {
          trace: {
            trace_id: context.traceId,
            span_id: context.spanId,
            ...(context.parentSpanId && { parent_span_id: context.parentSpanId }),
          },
        }),
      },
      extra: metadata,
      tags: {
        ...(context?.requestId && { request_id: context.requestId }),
        ...(context?.traceId && { trace_id: context.traceId }),
        ...(context?.userId && { user_id: context.userId }),
      },
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
    this.outputLog(LogLevel.ERROR, message, context, error, metadata);

    // Set Sentry user context
    if (context?.userId) {
      Sentry.setUser({ id: context.userId });
    }

    // Set Sentry tags for filtering
    if (context?.requestId) {
      Sentry.setTag('request_id', context.requestId);
    }

    if (context?.traceId) {
      Sentry.setTag('trace_id', context.traceId);
    }

    if (context?.spanId) {
      Sentry.setTag('span_id', context.spanId);
    }

    if (context?.endpoint) {
      Sentry.setTag('endpoint', context.endpoint);
    }

    // Capture error in Sentry with trace context
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
          ...(context?.traceId && context?.spanId && {
            trace: {
              trace_id: context.traceId,
              span_id: context.spanId,
              ...(context.parentSpanId && { parent_span_id: context.parentSpanId }),
            },
          }),
        },
        extra: metadata,
        tags: {
          ...(context?.requestId && { request_id: context.requestId }),
          ...(context?.traceId && { trace_id: context.traceId }),
          ...(context?.userId && { user_id: context.userId }),
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        contexts: {
          custom: context,
          ...(context?.traceId && context?.spanId && {
            trace: {
              trace_id: context.traceId,
              span_id: context.spanId,
              ...(context.parentSpanId && { parent_span_id: context.parentSpanId }),
            },
          }),
        },
        extra: { ...metadata, originalError: error },
        tags: {
          ...(context?.requestId && { request_id: context.requestId }),
          ...(context?.traceId && { trace_id: context.traceId }),
          ...(context?.userId && { user_id: context.userId }),
        },
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

/**
 * Create LogContext from TraceContext
 * Useful for converting tracing context to logger context
 */
export function createLogContextFromTrace(traceContext: TraceContext): LogContext {
  return {
    requestId: traceContext.requestId,
    traceId: traceContext.traceId,
    spanId: traceContext.spanId,
    userId: traceContext.userId,
    sessionId: traceContext.sessionId,
    ...traceContext.metadata,
  };
}

/**
 * Merge trace context into existing log context
 */
export function mergeTraceContext(
  logContext: LogContext,
  traceContext: TraceContext
): LogContext {
  return {
    ...logContext,
    requestId: traceContext.requestId || logContext.requestId,
    traceId: traceContext.traceId || logContext.traceId,
    spanId: traceContext.spanId || logContext.spanId,
    userId: traceContext.userId || logContext.userId,
    sessionId: traceContext.sessionId || logContext.sessionId,
  };
}
