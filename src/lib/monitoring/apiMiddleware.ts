/**
 * API Monitoring Middleware
 * 
 * Wraps API route handlers with automatic logging, performance tracking,
 * and error handling.
 * 
 * Features:
 * - Automatic request/response logging
 * - Performance timing
 * - Error tracking with Sentry
 * - Request context extraction
 * - User identification
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './logger';
import { performanceMonitor, MetricType } from './performance';
import { metricsCollector } from './metrics';

/**
 * API route handler type
 */
type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Extract request context for logging
 */
function extractRequestContext(request: NextRequest): LogContext {
  const url = new URL(request.url);
  
  return {
    endpoint: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
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
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Wrap an API route handler with monitoring
 */
export function withMonitoring(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const requestContext = extractRequestContext(request);
    const userId = await extractUserId(request);

    // Add request ID to context
    const fullContext: LogContext = {
      ...requestContext,
      requestId,
      userId,
    };

    // Log incoming request
    logger.info(`Incoming ${requestContext.method} request`, fullContext);

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

      // Log response
      logger.info(
        `${requestContext.method} ${requestContext.endpoint} - ${statusCode} (${duration}ms)`,
        fullContext,
        { statusCode, duration }
      );

      // Track performance
      performanceMonitor.trackApiRequest(
        requestContext.endpoint || '',
        requestContext.method || 'UNKNOWN',
        duration,
        statusCode,
        { requestId, userId }
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
          { statusCode, requestId }
        );
      }

      return response;
    } catch (error) {
      // Calculate duration even for errors
      const duration = endMeasurement();

      // Log error
      logger.error(
        `${requestContext.method} ${requestContext.endpoint} - Error (${duration}ms)`,
        error,
        fullContext,
        { duration }
      );

      // Track error metrics
      metricsCollector.trackError(
        userId,
        'unhandled_exception',
        requestContext.endpoint || 'unknown',
        {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      // Track performance for failed requests
      performanceMonitor.trackApiRequest(
        requestContext.endpoint || '',
        requestContext.method || 'UNKNOWN',
        duration,
        500,
        { requestId, userId, error: true }
      );

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          requestId, // Include request ID for debugging
        },
        { status: 500 }
      );
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
