/**
 * Simple validation helpers using Zod
 */
import { z } from 'zod';
import { NextRequest } from 'next/server';

// Weather request schema
export const weatherRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  provider: z.string().default('openWeather'),
});

// Recommendation request schema
export const recommendationRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  occasion: z.string().optional(),
});

// Helper to validate query params
export function validateQuery(request: NextRequest, schema: z.ZodSchema) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, unknown> = {};
  
  searchParams.forEach((value, key) => {
    // Try to parse numbers
    const numValue = Number(value);
    params[key] = isNaN(numValue) ? value : numValue;
  });
  
  return schema.parse(params);
}

// Helper to validate request body
export async function validateBody(request: NextRequest, schema: z.ZodSchema) {
  const body = await request.json();
  return schema.parse(body);
}
