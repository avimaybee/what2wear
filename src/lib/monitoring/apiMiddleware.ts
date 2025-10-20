/**
 * API Monitoring Middleware with Distributed Tracing
 * 
 * Wraps API route handlers with automatic logging, performance tracking,
 * error handling, and distributed tracing.
 * 
 * Features:
 * - Automatic request/response logging
 * - Distributed tracing with correlation IDs
 * - Performance timing with span tracking
 * - Error tracking with Sentry
 * - Request context extraction
 * - User identification
 * - Trace context propagation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext, createLogContextFromTrace } from './logger';
import { performanceMonitor, MetricType } from './performance';
import { metricsCollector } from './metrics';
import { 
  tracing, 
  createTraceContext, 
  getTraceHeaders,
  type TraceContext 
} from './tracing';

/**
 * API route handler type
 */
type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Extract request context for logging with trace context
 */
function extractRequestContext(request: NextRequest, traceContext: TraceContext): LogContext {
  const url = new URL(request.url);
  
  return {
    endpoint: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestId: traceContext.requestId,
    traceId: traceContext.traceId,
    spanId: traceContext.spanId,
    userId: traceContext.userId,
    sessionId: traceContext.sessionId,
  };
}

/**
 * Extract user ID from request (if authenticated)
 */
async function extractUserId(request: NextRequest): Promise<string | undefined> {
  try {
    // Try to get user ID from Supabase session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In a real implementation, you'd decode the JWT to get user ID
      // For now, we'll just return undefined if not available
      return undefined;
    }
    
    // Could also check cookies for session
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Wrap an API route handler with monitoring and distributed tracing
 */
export function withMonitoring(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const startTime = Date.now();
    const userId = await extractUserId(request);

    // Create trace context for this request
    const traceContext = createTraceContext(request, userId);

    // Extract request context with trace info
    const requestContext = extractRequestContext(request, traceContext);

    // Start a span for this API request
    const spanId = tracing.startSpan(
      `API ${requestContext.method} ${requestContext.endpoint}`,
      'api',
      traceContext,
      {
        method: requestContext.method,
        endpoint: requestContext.endpoint,
        userAgent: requestContext.userAgent,
      }
    );

    // Update trace context with the span ID
    const spanTraceContext = {
      ...traceContext,
      spanId,
    };

    // Log incoming request with trace context
    logger.info(`Incoming ${requestContext.method} request`, requestContext);

    // Start performance measurement
    const endMeasurement = performanceMonitor.startMeasurement(
      `${requestContext.method} ${requestContext.endpoint}`
    );

    try {
      // Execute the actual handler
      const response = await handler(request, context);

      // Calculate duration
      const duration = endMeasurement();

      // Extract status code
      const statusCode = response.status;

      // End the span successfully
      tracing.endSpan(spanId, 'success', undefined, {
        statusCode,
        duration,
      });

      // Log response
      logger.info(
        `${requestContext.method} ${requestContext.endpoint} - ${statusCode} (${duration}ms)`,
        requestContext,
        { statusCode, duration }
      );

      // Track performance
      performanceMonitor.trackApiRequest(
        requestContext.endpoint || '',
        requestContext.method || 'UNKNOWN',
        duration,
        statusCode,
        { requestId: traceContext.requestId, userId }
      );

      // Track metrics for successful requests
      if (statusCode >= 200 && statusCode < 300) {
        // Track feature usage based on endpoint
        if (userId) {
          const feature = requestContext.endpoint?.split('/').filter(Boolean)[1] || 'unknown';
          metricsCollector.trackFeatureUsage(userId, feature);
        }
      }

      // Track errors
      if (statusCode >= 400) {
        const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
        metricsCollector.trackError(
          userId,
          errorType,
          requestContext.endpoint || 'unknown',
          { statusCode, requestId: traceContext.requestId }
        );
      }

      // Add trace headers to response
      const headers = new Headers(response.headers);
      const traceHeaders = getTraceHeaders(spanTraceContext);
      Object.entries(traceHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      // Return response with trace headers
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // Calculate duration even for errors
      const duration = endMeasurement();

      // End the span with error
      tracing.endSpan(spanId, 'error', error as Error, {
        duration,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      // Log error
      logger.error(
        `${requestContext.method} ${requestContext.endpoint} - Error (${duration}ms)`,
        error,
        requestContext,
        { duration }
      );

      // Track error metrics
      metricsCollector.trackError(
        userId,
        'unhandled_exception',
        requestContext.endpoint || 'unknown',
        {
          requestId: traceContext.requestId,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      // Track performance for failed requests
      performanceMonitor.trackApiRequest(
        requestContext.endpoint || '',
        requestContext.method || 'UNKNOWN',
        duration,
        500,
        { requestId: traceContext.requestId, userId, error: true }
      );

      // Add trace headers to error response
      const traceHeaders = getTraceHeaders(spanTraceContext);

      // Return error response with trace context
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          requestId: traceContext.requestId, // Include request ID for debugging
          traceId: traceContext.traceId,
        },
        { 
          status: 500,
          headers: traceHeaders,
        }
      );
    } finally {
      // Clean up trace context
      tracing.clearTraceContext(traceContext.requestId);
    }
  };
}

/**
 * Simplified monitoring wrapper for handlers without context
 */
export function withSimpleMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
): ApiHandler {
  return withMonitoring(async (request) => {
    return handler(request);
  });
}

/**
 * Helper to extract and validate request body with monitoring
 */
export async function getRequestBody<T>(
  request: NextRequest,
  validator?: (data: unknown) => T
): Promise<T> {
  const timing = performanceMonitor.startMeasurement('parse_request_body');

  try {
    const body = await request.json();
    const duration = timing();

    logger.debug('Request body parsed', undefined, { duration });

    if (validator) {
      const validationTiming = performanceMonitor.startMeasurement('validate_request_body');
      const validated = validator(body);
      const validationDuration = validationTiming();

      logger.debug('Request body validated', undefined, { duration: validationDuration });

      return validated;
    }

    return body as T;
  } catch (error) {
    const duration = timing();

    logger.error('Failed to parse request body', error, undefined, { duration });

    throw error;
  }
}

/**
 * Helper to track database operations within API handlers
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const timing = logger.logDatabaseOperation(operation, table);

  try {
    const result = await fn();
    const duration = logger.endTiming(timing);

    performanceMonitor.trackDatabaseQuery(operation, table, duration);

    return result;
  } catch (error) {
    const duration = logger.endTiming(timing);

    logger.error(
      `Database operation failed: ${operation} ${table}`,
      error,
      undefined,
      { duration, operation, table }
    );

    performanceMonitor.trackDatabaseQuery(operation, table, duration, undefined, {
      error: true,
    });

    throw error;
  }
}

/**
 * Helper to track external API calls within API handlers
 */
export async function trackExternalApiCall<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const timing = logger.startTiming(`External API: ${service} ${endpoint}`);

  try {
    const result = await fn();
    const duration = logger.endTiming(timing);

    performanceMonitor.trackExternalApi(service, endpoint, duration, true);

    return result;
  } catch (error) {
    const duration = logger.endTiming(timing);

    logger.error(
      `External API call failed: ${service} ${endpoint}`,
      error,
      undefined,
      { duration, service, endpoint }
    );

    performanceMonitor.trackExternalApi(service, endpoint, duration, false, {
      error: String(error),
    });

    throw error;
  }
}

/**
 * Helper to track database operations with trace context
 * Use this version when you have access to trace context
 */
export async function trackDatabaseOperationWithTrace<T>(
  operation: string,
  table: string,
  traceContext: TraceContext,
  fn: () => Promise<T>
): Promise<T> {
  // Create a span for the database operation
  const spanId = tracing.startSpan(
    `DB ${operation} ${table}`,
    'database',
    traceContext,
    { operation, table }
  );

  const timing = logger.logDatabaseOperation(operation, table);

  try {
    const result = await fn();
    const duration = logger.endTiming(timing);

    // End span successfully
    tracing.endSpan(spanId, 'success', undefined, { duration, rowCount: Array.isArray(result) ? result.length : 1 });

    performanceMonitor.trackDatabaseQuery(operation, table, duration);

    return result;
  } catch (error) {
    const duration = logger.endTiming(timing);

    // End span with error
    tracing.endSpan(spanId, 'error', error as Error, { duration });

    const logContext = createLogContextFromTrace(traceContext);
    logger.error(
      `Database operation failed: ${operation} ${table}`,
      error,
      logContext,
      { duration, operation, table }
    );

    performanceMonitor.trackDatabaseQuery(operation, table, duration, undefined, {
      error: true,
    });

    throw error;
  }
}

/**
 * Helper to track external API calls with trace context
 * Use this version when you have access to trace context
 * Automatically propagates trace headers to downstream services
 */
export async function trackExternalApiCallWithTrace<T>(
  service: string,
  endpoint: string,
  traceContext: TraceContext,
  fn: (traceHeaders: Record<string, string>) => Promise<T>
): Promise<T> {
  // Create a span for the external API call
  const spanId = tracing.startSpan(
    `External ${service} ${endpoint}`,
    'external',
    traceContext,
    { service, endpoint }
  );

  // Update trace context with new span
  const spanTraceContext = { ...traceContext, spanId };

  // Get trace headers to propagate
  const traceHeaders = getTraceHeaders(spanTraceContext);

  const timing = logger.startTiming(`External API: ${service} ${endpoint}`);

  try {
    // Pass trace headers to the function so it can add them to the request
    const result = await fn(traceHeaders);
    const duration = logger.endTiming(timing);

    // End span successfully
    tracing.endSpan(spanId, 'success', undefined, { duration });

    performanceMonitor.trackExternalApi(service, endpoint, duration, true);

    return result;
  } catch (error) {
    const duration = logger.endTiming(timing);

    // End span with error
    tracing.endSpan(spanId, 'error', error as Error, { duration });

    const logContext = createLogContextFromTrace(traceContext);
    logger.error(
      `External API call failed: ${service} ${endpoint}`,
      error,
      logContext,
      { duration, service, endpoint }
    );

    performanceMonitor.trackExternalApi(service, endpoint, duration, false, {
      error: String(error),
    });

    throw error;
  }
}

/**
 * Export trace utilities for use in API handlers
 */
export { createTraceContext, getTraceHeaders, type TraceContext } from './tracing';
