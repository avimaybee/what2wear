/**
 * Minimal rate limiting helpers.
 *
 * For the simplified hobby deployment we no longer depend on external
 * services. These utilities preserve the existing surface area so the API
 * routes keep compiling, but every request is allowed through.
 */

import { NextRequest, NextResponse } from 'next/server';

export const RATE_LIMITS = {
  WEATHER: { requests: 100, window: '1 h' },
  RECOMMENDATION: { requests: 50, window: '1 h' },
  WARDROBE: { requests: 200, window: '1 h' },
  GENERAL: { requests: 1000, window: '1 h' },
  AUTH: { requests: 10, window: '15 m' },
} as const;

export type RateLimitPolicy =
  | 'weather'
  | 'recommendation'
  | 'wardrobe'
  | 'general'
  | 'auth';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<void>;
}

export interface RateLimitOptions {
  policy?: RateLimitPolicy;
  identifier?: string;
  bypass?: boolean;
}

function infiniteResult(): RateLimitResult {
  return {
    success: true,
    limit: Number.POSITIVE_INFINITY,
    remaining: Number.POSITIVE_INFINITY,
    reset: Date.now(),
    pending: Promise.resolve(),
  };
}

export async function checkRateLimit(
  _request: NextRequest,
  _options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  return infiniteResult();
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  if (Number.isFinite(result.limit)) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());
  }
  return response;
}

export function createRateLimitResponse(_result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limiting disabled',
      message: 'Rate limiting is not enforced in this deployment.',
    },
    { status: 200 }
  );
}

export function withRateLimit<T extends NextResponse>(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<T>,
  _options: RateLimitOptions = {}
): (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: unknown[]) => {
    const result = await checkRateLimit(request);
    const response = await handler(request, ...args);
    return addRateLimitHeaders(response, result);
  };
}

export async function resetRateLimit(
  _identifier: string,
  _policy: RateLimitPolicy = 'general'
): Promise<void> {
  return Promise.resolve();
}

export async function getRateLimitStats(
  _identifier: string,
  _policy: RateLimitPolicy = 'general'
): Promise<null> {
  return null;
}

export function isEnabled(): boolean {
  return false;
}

export function getRateLimitConfig(policy: RateLimitPolicy) {
  return RATE_LIMITS[policy.toUpperCase() as keyof typeof RATE_LIMITS];
}

export function shouldBypassRateLimit(_request: NextRequest): boolean {
  return true;
}

export const rateLimit = {
  check: checkRateLimit,
  reset: resetRateLimit,
  stats: getRateLimitStats,
  isEnabled,
  getConfig: getRateLimitConfig,
  shouldBypass: shouldBypassRateLimit,
};

export default withRateLimit;
