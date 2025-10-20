/**
 * CORS Security Middleware
 * RECOMMENDATION #13: Security Hardening & Compliance Framework
 * 
 * Provides secure CORS configuration with:
 * - Whitelist of allowed origins
 * - Proper preflight handling
 * - Security headers for cross-origin requests
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins for CORS
 * Add production domains here
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://setmyfit.com',
  'https://www.setmyfit.com',
  'https://setmyfit.vercel.app',
  // Add more production domains as needed
];

/**
 * Allowed HTTP methods
 */
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

/**
 * Allowed headers
 */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
];

/**
 * Max age for preflight cache (24 hours)
 */
const MAX_AGE = 86400;

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:')) {
      return true;
    }
  }
  
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = ALLOWED_METHODS.join(', ');
    headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
    headers['Access-Control-Max-Age'] = MAX_AGE.toString();
  }
  
  return headers;
}

/**
 * Higher-order function to wrap API handlers with CORS
 * 
 * @param handler - The API route handler function
 * @returns Wrapped handler with CORS support
 * 
 * @example
 * ```typescript
 * export const GET = withCORS(async (request) => {
 *   // Your handler logic
 * });
 * ```
 */
export function withCORS<T>(
  handler: (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<T>>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<T>> => {
    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const corsHeaders = getCorsHeaders(origin);
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      }) as NextResponse<T>;
    }
    
    // Execute handler
    const response = await handler(request, context);
    
    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Middleware to validate origin and block unauthorized requests
 * Use this for sensitive endpoints
 * 
 * @example
 * ```typescript
 * export const POST = validateOrigin(withValidation(async (request) => {
 *   // Your sensitive handler logic
 * }));
 * ```
 */
export function validateOrigin<T>(
  handler: (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<T>>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<T>> => {
    const origin = request.headers.get('origin');
    
    // In production, enforce origin validation
    if (process.env.NODE_ENV === 'production') {
      if (origin && !isOriginAllowed(origin)) {
        return NextResponse.json(
          { success: false, error: 'Origin not allowed' },
          { status: 403 }
        ) as NextResponse<T>;
      }
    }
    
    return handler(request, context);
  };
}

/**
 * Security utilities for headers
 */
export const SecurityHeaders = {
  /**
   * Add security headers to any response
   */
  addToResponse(response: NextResponse, origin?: string | null): NextResponse {
    const corsHeaders = getCorsHeaders(origin || null);
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add additional security headers (defense in depth)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  },
  
  /**
   * Check if request has valid authorization
   */
  hasValidAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    return !!authHeader && authHeader.startsWith('Bearer ');
  },
  
  /**
   * Get client IP address
   */
  getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  },
  
  /**
   * Check if request is from a suspicious source
   */
  isSuspicious(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    
    // Block known bad user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
    ];
    
    // Allow legitimate bots (Google, Bing, etc.)
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slackbot/i,
      /twitterbot/i,
      /facebookexternalhit/i,
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));
    
    return isSuspicious && !isLegitimate;
  },
};
