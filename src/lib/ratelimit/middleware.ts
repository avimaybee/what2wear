/**
 * Rate Limiting Middleware
 * 
 * Provides serverless-compatible rate limiting using Upstash Rate Limit.
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-IP rate limiting (for anonymous users)
 * - Configurable rate limit policies
 * - Standard rate limit headers
 * - Bypass for development/testing
 * - Integration with monitoring and logging
 * 
 * @module lib/ratelimit
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../monitoring/logger';
import { metricsCollector } from '../monitoring/metrics';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Redis client for rate limiting
 * Reuses the same Upstash Redis instance as caching
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limiting is enabled only if Redis credentials are configured
 * and not in development bypass mode
 */
const isRateLimitEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.DISABLE_RATE_LIMIT !== 'true'
);

/**
 * Rate limit policies for different endpoints
 */
export const RATE_LIMITS = {
  // Weather API - external API calls are expensive
  WEATHER: {
    requests: 100,
    window: '1 h',
  },
  
  // Recommendations - computationally expensive
  RECOMMENDATION: {
    requests: 50,
    window: '1 h',
  },
  
  // Wardrobe operations - moderate usage
  WARDROBE: {
    requests: 200,
    window: '1 h',
  },
  
  // Calendar/Health - frequent reads
  CALENDAR: {
    requests: 300,
    window: '1 h',
  },
  
  // General API - catch-all
  GENERAL: {
    requests: 1000,
    window: '1 h',
  },
  
  // Authentication - strict to prevent brute force
  AUTH: {
    requests: 10,
    window: '15 m',
  },
} as const;

/**
 * Rate limiter instances for different policies
 */
const rateLimiters = {
  weather: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.WEATHER.requests,
      RATE_LIMITS.WEATHER.window
    ),
    analytics: true,
    prefix: 'ratelimit:weather',
  }),
  
  recommendation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.RECOMMENDATION.requests,
      RATE_LIMITS.RECOMMENDATION.window
    ),
    analytics: true,
    prefix: 'ratelimit:recommendation',
  }),
  
  wardrobe: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.WARDROBE.requests,
      RATE_LIMITS.WARDROBE.window
    ),
    analytics: true,
    prefix: 'ratelimit:wardrobe',
  }),
  
  calendar: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.CALENDAR.requests,
      RATE_LIMITS.CALENDAR.window
    ),
    analytics: true,
    prefix: 'ratelimit:calendar',
  }),
  
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.GENERAL.requests,
      RATE_LIMITS.GENERAL.window
    ),
    analytics: true,
    prefix: 'ratelimit:general',
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.AUTH.requests,
      RATE_LIMITS.AUTH.window
    ),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
};

// ============================================================================
// Types
// ============================================================================

export type RateLimitPolicy = keyof typeof rateLimiters;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

export interface RateLimitOptions {
  /** Rate limit policy to use */
  policy?: RateLimitPolicy;
  /** Custom identifier (defaults to user ID or IP) */
  identifier?: string;
  /** Skip rate limiting (for admin users) */
  bypass?: boolean;
}

// ============================================================================
// Core Rate Limiting Functions
// ============================================================================

/**
 * Get client identifier from request
 * Prefers user ID, falls back to IP address
 */
function getIdentifier(request: NextRequest, customId?: string): string {
  if (customId) {
    return customId;
  }

  // Try to get user ID from auth header or cookie
  // This would need to be extracted from your auth token
  // For now, we'll use IP address as fallback
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  return `ip:${ip}`;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  // Bypass rate limiting if disabled
  if (!isRateLimitEnabled || options.bypass) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now(),
      pending: Promise.resolve(),
    };
  }

  const policy = options.policy || 'general';
  const identifier = getIdentifier(request, options.identifier);
  const limiter = rateLimiters[policy];

  try {
    const result = await limiter.limit(identifier);

    // Log rate limit check
    logger.debug('Rate limit check', {
      policy,
      identifier,
      success: result.success,
      remaining: result.remaining,
    });

    // Track metrics
    if (!result.success) {
      // Track rate limit exceeded event
      logger.warn('Rate limit exceeded', {
        policy,
        identifier,
        limit: result.limit,
      });
    }

    return result;
  } catch (error) {
    logger.error('Rate limit check failed', error, {
      policy,
      identifier,
    });

    // On error, allow the request (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve(),
    };
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  if (result.limit !== Infinity) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());
  }
  
  return response;
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  
  const response = NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', retryAfter.toString());
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

// ============================================================================
// Middleware Wrapper
// ============================================================================

/**
 * Rate limiting middleware wrapper
 * Wraps an API handler with automatic rate limiting
 * 
 * @example
 * export const GET = withRateLimit(
 *   async (request) => {
 *     // Your handler code
 *   },
 *   { policy: 'weather' }
 * );
 */
export function withRateLimit<T extends NextResponse>(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<T>,
  options: RateLimitOptions = {}
): (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: unknown[]) => {
    // Check rate limit
    const result = await checkRateLimit(request, options);

    // If rate limit exceeded, return error response
    if (!result.success) {
      return createRateLimitResponse(result);
    }

    // Execute handler
    const response = await handler(request, ...args);

    // Add rate limit headers to response
    return addRateLimitHeaders(response, result);
  };
}

// ============================================================================
// Rate Limit Reset (for testing/admin)
// ============================================================================

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or resetting user limits
 */
export async function resetRateLimit(
  identifier: string,
  policy: RateLimitPolicy = 'general'
): Promise<void> {
  if (!isRateLimitEnabled) {
    return;
  }

  try {
    const limiter = rateLimiters[policy];
    // Upstash Rate Limit doesn't have a built-in reset, so we'd need to delete the key
    // This is a placeholder for the functionality
    logger.info('Rate limit reset requested', { identifier, policy });
  } catch (error) {
    logger.error('Failed to reset rate limit', error, { identifier, policy });
  }
}

// ============================================================================
// Rate Limit Statistics
// ============================================================================

/**
 * Get rate limit statistics for an identifier
 */
export async function getRateLimitStats(
  identifier: string,
  policy: RateLimitPolicy = 'general'
): Promise<{ limit: number; remaining: number; reset: number } | null> {
  if (!isRateLimitEnabled) {
    return null;
  }

  try {
    const limiter = rateLimiters[policy];
    // This would require querying Redis directly for the current state
    // Upstash Rate Limit analytics provides this data
    logger.debug('Rate limit stats requested', { identifier, policy });
    return null; // Placeholder
  } catch (error) {
    logger.error('Failed to get rate limit stats', error, { identifier, policy });
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if rate limiting is enabled
 */
export function isEnabled(): boolean {
  return isRateLimitEnabled;
}

/**
 * Get rate limit configuration for a policy
 */
export function getRateLimitConfig(policy: RateLimitPolicy) {
  const policyMap: Record<RateLimitPolicy, typeof RATE_LIMITS[keyof typeof RATE_LIMITS]> = {
    weather: RATE_LIMITS.WEATHER,
    recommendation: RATE_LIMITS.RECOMMENDATION,
    wardrobe: RATE_LIMITS.WARDROBE,
    calendar: RATE_LIMITS.CALENDAR,
    general: RATE_LIMITS.GENERAL,
    auth: RATE_LIMITS.AUTH,
  };
  return policyMap[policy];
}

/**
 * Check if user should bypass rate limits (admin, development, etc.)
 */
export function shouldBypassRateLimit(request: NextRequest): boolean {
  // Bypass in development if DISABLE_RATE_LIMIT is set
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return true;
  }

  // Check for admin bypass header (would need proper authentication)
  const bypassHeader = request.headers.get('x-bypass-ratelimit');
  const bypassSecret = process.env.RATE_LIMIT_BYPASS_SECRET;
  
  if (bypassHeader && bypassSecret && bypassHeader === bypassSecret) {
    return true;
  }

  return false;
}

// ============================================================================
// Exports
// ============================================================================

export const rateLimit = {
  check: checkRateLimit,
  reset: resetRateLimit,
  stats: getRateLimitStats,
  isEnabled,
  getConfig: getRateLimitConfig,
  shouldBypass: shouldBypassRateLimit,
};

export default withRateLimit;
