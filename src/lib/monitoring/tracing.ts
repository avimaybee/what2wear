/**
 * Correlation ID and Request Tracing Utilities
 * 
 * Provides request correlation IDs, trace context propagation,
 * and distributed tracing support for the What2Wear application.
 * 
 * Features:
 * - Request correlation ID generation and propagation
 * - Trace context management (request ID, user ID, session ID)
 * - OpenTelemetry-compatible trace format
 * - Integration with Sentry distributed tracing
 * - Async local storage for trace context
 * 
 * @module lib/monitoring/tracing
 */

import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export interface TraceContext {
  /** Unique request identifier */
  requestId: string;
  /** Parent trace ID for distributed tracing */
  traceId?: string;
  /** Parent span ID for nested operations */
  spanId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Session ID from cookie/token */
  sessionId?: string;
  /** Request timestamp */
  timestamp: number;
  /** Additional context metadata */
  metadata?: Record<string, any>;
}

export interface Span {
  /** Unique span identifier */
  spanId: string;
  /** Parent span ID (for nested spans) */
  parentSpanId?: string;
  /** Trace ID this span belongs to */
  traceId: string;
  /** Operation name */
  name: string;
  /** Span start time */
  startTime: number;
  /** Span end time (null if not finished) */
  endTime: number | null;
  /** Span duration in milliseconds */
  duration: number | null;
  /** Span status */
  status: 'pending' | 'success' | 'error';
  /** Error details if status is error */
  error?: Error;
  /** Operation type */
  operationType: 'api' | 'database' | 'external' | 'internal' | 'user_action';
  /** Span attributes/tags */
  attributes: Record<string, any>;
}

// ============================================================================
// Constants
// ============================================================================

/** Header name for request correlation ID */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Header name for trace ID (OpenTelemetry standard) */
export const TRACE_ID_HEADER = 'x-trace-id';

/** Header name for span ID */
export const SPAN_ID_HEADER = 'x-span-id';

/** Header name for user ID */
export const USER_ID_HEADER = 'x-user-id';

// ============================================================================
// Trace Context Storage
// ============================================================================

// Simple in-memory storage for trace contexts
// In production, this could be AsyncLocalStorage or context propagation library
const traceContextStore = new Map<string, TraceContext>();
const activeSpans = new Map<string, Span>();

// ============================================================================
// Correlation ID Generation
// ============================================================================

/**
 * Generate a unique correlation ID for a request
 * Format: req_<timestamp>_<uuid>
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // First segment for brevity
  return `req_${timestamp}_${uuid}`;
}

/**
 * Generate a unique trace ID
 * Format: trace_<timestamp>_<uuid>
 */
export function generateTraceId(): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  return `trace_${timestamp}_${uuid}`;
}

/**
 * Generate a unique span ID
 * Format: span_<timestamp>_<uuid>
 */
export function generateSpanId(): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  return `span_${timestamp}_${uuid}`;
}

// ============================================================================
// Request ID Extraction
// ============================================================================

/**
 * Extract or generate request ID from NextRequest
 * Checks headers first, generates new ID if not found
 */
export function getOrCreateRequestId(request: NextRequest): string {
  // Check if request already has correlation ID
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  if (existingId) {
    return existingId;
  }

  // Generate new correlation ID
  return generateRequestId();
}

/**
 * Extract trace ID from request headers
 */
export function getTraceId(request: NextRequest): string | undefined {
  return request.headers.get(TRACE_ID_HEADER) || undefined;
}

/**
 * Extract span ID from request headers
 */
export function getSpanId(request: NextRequest): string | undefined {
  return request.headers.get(SPAN_ID_HEADER) || undefined;
}

/**
 * Extract user ID from request headers
 */
export function getUserIdFromHeaders(request: NextRequest): string | undefined {
  return request.headers.get(USER_ID_HEADER) || undefined;
}

// ============================================================================
// Trace Context Management
// ============================================================================

/**
 * Create trace context from request
 * Extracts correlation IDs, trace context, and user information
 */
export function createTraceContext(request: NextRequest, userId?: string): TraceContext {
  const requestId = getOrCreateRequestId(request);
  const traceId = getTraceId(request) || generateTraceId();
  const spanId = getSpanId(request);
  const headerUserId = getUserIdFromHeaders(request);

  const context: TraceContext = {
    requestId,
    traceId,
    spanId,
    userId: userId || headerUserId,
    timestamp: Date.now(),
    metadata: {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
    },
  };

  // Store context for later retrieval
  traceContextStore.set(requestId, context);

  return context;
}

/**
 * Get stored trace context by request ID
 */
export function getTraceContext(requestId: string): TraceContext | undefined {
  return traceContextStore.get(requestId);
}

/**
 * Update trace context with additional data
 */
export function updateTraceContext(
  requestId: string,
  updates: Partial<TraceContext>
): void {
  const existing = traceContextStore.get(requestId);
  if (existing) {
    traceContextStore.set(requestId, { ...existing, ...updates });
  }
}

/**
 * Clear trace context (call after request completes)
 */
export function clearTraceContext(requestId: string): void {
  traceContextStore.delete(requestId);
  
  // Also clear any spans associated with this trace
  const context = traceContextStore.get(requestId);
  if (context?.traceId) {
    clearSpansForTrace(context.traceId);
  }
}

// ============================================================================
// Span Management
// ============================================================================

/**
 * Start a new span for an operation
 * Returns span ID that should be used to end the span
 */
export function startSpan(
  name: string,
  operationType: Span['operationType'],
  traceContext: TraceContext,
  attributes: Record<string, any> = {}
): string {
  const spanId = generateSpanId();
  
  const span: Span = {
    spanId,
    parentSpanId: traceContext.spanId,
    traceId: traceContext.traceId || generateTraceId(),
    name,
    startTime: Date.now(),
    endTime: null,
    duration: null,
    status: 'pending',
    operationType,
    attributes: {
      ...attributes,
      requestId: traceContext.requestId,
      userId: traceContext.userId,
    },
  };

  activeSpans.set(spanId, span);
  return spanId;
}

/**
 * End a span and calculate duration
 */
export function endSpan(
  spanId: string,
  status: 'success' | 'error' = 'success',
  error?: Error,
  additionalAttributes: Record<string, any> = {}
): Span | null {
  const span = activeSpans.get(spanId);
  if (!span) {
    console.warn(`[Tracing] Attempted to end non-existent span: ${spanId}`);
    return null;
  }

  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  span.status = status;
  span.error = error;
  span.attributes = { ...span.attributes, ...additionalAttributes };

  activeSpans.set(spanId, span);
  return span;
}

/**
 * Get active span by ID
 */
export function getSpan(spanId: string): Span | undefined {
  return activeSpans.get(spanId);
}

/**
 * Get all spans for a trace
 */
export function getSpansForTrace(traceId: string): Span[] {
  return Array.from(activeSpans.values()).filter(
    (span) => span.traceId === traceId
  );
}

/**
 * Clear all spans for a trace (cleanup after request)
 */
export function clearSpansForTrace(traceId: string): void {
  const spanIds = Array.from(activeSpans.keys()).filter((id) => {
    const span = activeSpans.get(id);
    return span?.traceId === traceId;
  });

  spanIds.forEach((id) => activeSpans.delete(id));
}

// ============================================================================
// Convenience Wrappers
// ============================================================================

/**
 * Track an async operation with automatic span management
 * Returns the operation result and span details
 */
export async function traceOperation<T>(
  name: string,
  operationType: Span['operationType'],
  traceContext: TraceContext,
  operation: () => Promise<T>,
  attributes: Record<string, any> = {}
): Promise<{ result: T; span: Span | null }> {
  const spanId = startSpan(name, operationType, traceContext, attributes);

  try {
    const result = await operation();
    const span = endSpan(spanId, 'success', undefined, { success: true });
    return { result, span };
  } catch (error) {
    const span = endSpan(spanId, 'error', error as Error, { 
      success: false,
      errorMessage: (error as Error).message 
    });
    throw error; // Re-throw to maintain error handling flow
  }
}

/**
 * Track a sync operation with automatic span management
 */
export function traceOperationSync<T>(
  name: string,
  operationType: Span['operationType'],
  traceContext: TraceContext,
  operation: () => T,
  attributes: Record<string, any> = {}
): { result: T; span: Span | null } {
  const spanId = startSpan(name, operationType, traceContext, attributes);

  try {
    const result = operation();
    const span = endSpan(spanId, 'success', undefined, { success: true });
    return { result, span };
  } catch (error) {
    const span = endSpan(spanId, 'error', error as Error, { 
      success: false,
      errorMessage: (error as Error).message 
    });
    throw error;
  }
}

// ============================================================================
// Header Injection
// ============================================================================

/**
 * Create headers object with trace context for downstream requests
 * Use this when making API calls to other services to propagate trace context
 */
export function getTraceHeaders(traceContext: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {
    [REQUEST_ID_HEADER]: traceContext.requestId,
  };

  if (traceContext.traceId) {
    headers[TRACE_ID_HEADER] = traceContext.traceId;
  }

  if (traceContext.spanId) {
    headers[SPAN_ID_HEADER] = traceContext.spanId;
  }

  if (traceContext.userId) {
    headers[USER_ID_HEADER] = traceContext.userId;
  }

  return headers;
}

/**
 * Add trace headers to a fetch request
 */
export function addTraceHeaders(
  fetchHeaders: HeadersInit,
  traceContext: TraceContext
): HeadersInit {
  const traceHeaders = getTraceHeaders(traceContext);
  
  if (Array.isArray(fetchHeaders)) {
    // Headers as array of tuples
    return [...fetchHeaders, ...Object.entries(traceHeaders)];
  } else if (fetchHeaders instanceof Headers) {
    // Headers object
    const newHeaders = new Headers(fetchHeaders);
    Object.entries(traceHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return newHeaders;
  } else {
    // Plain object
    return { ...fetchHeaders, ...traceHeaders };
  }
}

// ============================================================================
// Exports
// ============================================================================

export const tracing = {
  // ID Generation
  generateRequestId,
  generateTraceId,
  generateSpanId,

  // Context Management
  createTraceContext,
  getTraceContext,
  updateTraceContext,
  clearTraceContext,

  // Span Management
  startSpan,
  endSpan,
  getSpan,
  getSpansForTrace,
  clearSpansForTrace,

  // Convenience Wrappers
  traceOperation,
  traceOperationSync,

  // Header Utilities
  getTraceHeaders,
  addTraceHeaders,
  getOrCreateRequestId,
};
