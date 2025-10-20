/**
 * Validation Middleware
 * RECOMMENDATION #4: Data Validation & Input Sanitization Layer
 * 
 * Provides middleware utilities for validating requests using Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '@/lib/types';

/**
 * Validation error response type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Validate request body against a Zod schema
 * 
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data or throws an error
 * 
 * @example
 * ```typescript
 * const data = await validateBody(request, createClothingItemSchema);
 * ```
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      throw new ValidationRequestError('Validation failed', errors);
    }
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data or throws an error
 * 
 * @example
 * ```typescript
 * const params = validateQuery(request, paginationSchema);
 * ```
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      throw new ValidationRequestError('Invalid query parameters', errors);
    }
    throw error;
  }
}

/**
 * Validate route parameters against a Zod schema
 * 
 * @param params - Route parameters object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data or throws an error
 * 
 * @example
 * ```typescript
 * const { id } = validateParams(params, clothingItemIdSchema);
 * ```
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T {
  try {
    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      throw new ValidationRequestError('Invalid route parameters', errors);
    }
    throw error;
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationRequestError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[]
  ) {
    super(message);
    this.name = 'ValidationRequestError';
  }
}

/**
 * Higher-order function to wrap API handlers with validation
 * Automatically catches validation errors and returns proper responses
 * 
 * @param handler - The API route handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * ```typescript
 * export const POST = withValidation(async (request) => {
 *   const data = await validateBody(request, mySchema);
 *   // ... handler logic
 * });
 * ```
 */
export function withValidation<T>(
  handler: (
    request: NextRequest, 
    context?: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Handle validation errors
      if (error instanceof ValidationRequestError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            validation_errors: error.errors,
          } as ApiResponse<T>,
          { status: 400 }
        );
      }

      // Handle other errors
      if (error instanceof Error) {
        console.error('API Error:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          } as ApiResponse<T>,
          { status: 500 }
        );
      }

      // Handle unknown errors
      console.error('Unknown Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        } as ApiResponse<T>,
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Deep sanitize an object by sanitizing all string values
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function deepSanitize<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized as T;
  }

  return obj;
}
