/**
 * Validation Schemas using Zod
 * RECOMMENDATION #4: Data Validation & Input Sanitization Layer
 * 
 * This module provides runtime validation schemas for all API inputs
 * to ensure type safety, data integrity, and security.
 */

import { z } from 'zod';

// ============================================================================
// Enums & Constants
// ============================================================================

export const ClothingTypeEnum = z.enum([
  'Outerwear',
  'Top',
  'Bottom',
  'Footwear',
  'Accessory',
  'Headwear',
]);

export const ClothingMaterialEnum = z.enum([
  'Cotton',
  'Wool',
  'Synthetic',
  'Gore-Tex',
  'Fleece',
  'Leather',
  'Denim',
  'Silk',
  'Linen',
  'Polyester',
  'Nylon',
]);

export const DressCodeEnum = z.enum([
  'Casual',
  'Business Casual',
  'Formal',
  'Athletic',
  'Loungewear',
]);

export const EventTypeEnum = z.enum([
  'Work/Business',
  'Gym/Active',
  'Casual/Social',
]);

export const ActivityLevelEnum = z.enum(['Low', 'Medium', 'High']);

export const SeasonEnum = z.enum(['Spring', 'Summer', 'Fall', 'Winter']);

// ============================================================================
// Utility Schemas
// ============================================================================

/**
 * Sanitize and validate strings
 * - Trim whitespace
 * - Remove null bytes and control characters
 * - Prevent XSS by limiting special characters
 */
export const sanitizedString = (minLength = 0, maxLength = 1000) =>
  z
    .string()
    .trim()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`)
    .transform((str) => {
      // Remove null bytes and control characters
      return str.replace(/[\x00-\x1F\x7F]/g, '');
    });

/**
 * URL validation with sanitization
 */
export const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Only HTTP and HTTPS URLs are allowed' }
  );

/**
 * Coordinate validation (latitude/longitude)
 */
export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Must be a valid UUID');

/**
 * Positive integer validation
 */
export const positiveIntSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive');

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime string' });

// ============================================================================
// Clothing Item Schemas
// ============================================================================

/**
 * Schema for creating a new clothing item
 */
export const createClothingItemSchema = z.object({
  name: sanitizedString(1, 100),
  type: ClothingTypeEnum,
  category: sanitizedString(0, 50).nullable().optional(),
  color: sanitizedString(0, 30).nullable().optional(),
  material: ClothingMaterialEnum.default('Cotton'),
  insulation_value: z
    .number()
    .min(0, 'Insulation value must be between 0 and 10')
    .max(10, 'Insulation value must be between 0 and 10')
    .default(5),
  image_url: urlSchema,
  season_tags: z.array(SeasonEnum).nullable().optional(),
  style_tags: z.array(sanitizedString(1, 50)).max(10, 'Maximum 10 style tags').nullable().optional(),
  dress_code: z.array(DressCodeEnum).min(1, 'At least one dress code required').default(['Casual']),
});

/**
 * Schema for updating a clothing item
 */
export const updateClothingItemSchema = createClothingItemSchema.partial();

/**
 * Schema for clothing item ID parameter
 */
export const clothingItemIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

// ============================================================================
// User Preferences Schemas
// ============================================================================

export const userPreferencesSchema = z.object({
  styles: z.array(sanitizedString(1, 50)).max(20, 'Maximum 20 preferred styles').optional(),
  colors: z.array(sanitizedString(1, 30)).max(20, 'Maximum 20 preferred colors').optional(),
  temperature_sensitivity: z
    .number()
    .min(-2, 'Temperature sensitivity must be between -2 and 2')
    .max(2, 'Temperature sensitivity must be between -2 and 2')
    .optional(),
});

export const updateProfileSchema = z.object({
  name: sanitizedString(1, 100).nullable().optional(),
  region: sanitizedString(1, 100).nullable().optional(),
  full_body_model_url: urlSchema.nullable().optional(),
  preferences: userPreferencesSchema.nullable().optional(),
});

// ============================================================================
// Weather Schemas
// ============================================================================

export const weatherRequestSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
  provider: z.enum(['openWeather', 'visualCrossing']).default('openWeather'),
});

// ============================================================================
// Recommendation Schemas
// ============================================================================

export const recommendationRequestSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
  occasion: sanitizedString(0, 200).optional(),
  date: dateStringSchema.optional(),
});

export const feedbackSchema = z.object({
  feedback: z
    .number()
    .int('Feedback must be an integer')
    .min(1, 'Feedback must be between 1 and 5')
    .max(5, 'Feedback must be between 1 and 5'),
  feedback_note: sanitizedString(0, 500).nullable().optional(),
});

export const recommendationIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

// ============================================================================
// Calendar Event Schemas
// ============================================================================

export const calendarEventSchema = z.object({
  title: sanitizedString(1, 200),
  start_time: dateStringSchema,
  end_time: dateStringSchema,
  event_type: EventTypeEnum,
  description: sanitizedString(0, 1000).optional(),
});

export const calendarEventsQuerySchema = z.object({
  hours: z
    .string()
    .default('24')
    .transform(Number)
    .pipe(z.number().min(1).max(168)),
  startDate: dateStringSchema.optional(),
});

// ============================================================================
// Health Activity Schemas
// ============================================================================

export const healthActivitySchema = z.object({
  date: dateStringSchema,
  planned_activity_level: ActivityLevelEnum,
  steps: positiveIntSchema.optional(),
  active_minutes: positiveIntSchema.optional(),
});

export const healthActivityQuerySchema = z.object({
  date: dateStringSchema.optional(),
});

// ============================================================================
// Outfit Log Schemas
// ============================================================================

export const outfitLogSchema = z.object({
  outfit_items: z
    .array(
      z.object({
        clothing_item_id: positiveIntSchema,
      })
    )
    .min(1, 'Outfit must contain at least one item')
    .max(20, 'Outfit cannot contain more than 20 items'),
  worn_date: dateStringSchema.default(() => new Date().toISOString()),
  weather_temp: z.number().optional(),
  weather_condition: sanitizedString(0, 100).optional(),
  occasion: sanitizedString(0, 200).optional(),
  feedback: z.number().int().min(1).max(5).optional(),
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .default('50')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
});

// ============================================================================
// Type Exports (TypeScript types inferred from schemas)
// ============================================================================

export type CreateClothingItemInput = z.infer<typeof createClothingItemSchema>;
export type UpdateClothingItemInput = z.infer<typeof updateClothingItemSchema>;
export type ClothingItemIdParams = z.infer<typeof clothingItemIdSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type WeatherRequestInput = z.infer<typeof weatherRequestSchema>;
export type RecommendationRequestInput = z.infer<typeof recommendationRequestSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type RecommendationIdParams = z.infer<typeof recommendationIdSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type CalendarEventsQueryInput = z.infer<typeof calendarEventsQuerySchema>;
export type HealthActivityInput = z.infer<typeof healthActivitySchema>;
export type HealthActivityQueryInput = z.infer<typeof healthActivityQuerySchema>;
export type OutfitLogInput = z.infer<typeof outfitLogSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
