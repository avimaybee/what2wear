/**
 * Cache Utility with Redis
 * 
 * Provides serverless-compatible caching using Upstash Redis.
 * 
 * Features:
 * - Get/Set/Delete operations
 * - TTL (time-to-live) support
 * - JSON serialization
 * - Cache key namespacing
 * - Stale-while-revalidate pattern
 * - Request deduplication
 * - Cache metrics tracking
 * 
 * @module lib/cache
 */

import { Redis } from '@upstash/redis';
import { logger } from './monitoring';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Redis client configuration
 * Uses Upstash Redis for serverless compatibility
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Cache is enabled only if Redis credentials are configured
 */
const isCacheEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Default TTL values (in seconds)
 */
export const DEFAULT_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAY: 86400,          // 24 hours
} as const;

/**
 * Cache key prefixes for namespacing
 */
export const CACHE_PREFIX = {
  WEATHER: 'weather',
  RECOMMENDATION: 'recommendation',
  USER_PROFILE: 'user_profile',
  WARDROBE: 'wardrobe',
  CALENDAR: 'calendar',
  AQI: 'aqi',
  GENERAL: 'general',
} as const;

// ============================================================================
// Types
// ============================================================================

export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Cache key prefix/namespace */
  prefix?: string;
  /** Skip cache and fetch fresh data */
  skipCache?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

// ============================================================================
// Metrics Tracking
// ============================================================================

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * Get current cache metrics
 */
export function getCacheMetrics(): CacheMetrics {
  return { ...metrics };
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics(): void {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.sets = 0;
  metrics.deletes = 0;
  metrics.errors = 0;
}

// ============================================================================
// Cache Key Utilities
// ============================================================================

/**
 * Generate cache key with optional prefix
 */
function buildCacheKey(key: string, prefix?: string): string {
  if (prefix) {
    return `${prefix}:${key}`;
  }
  return key;
}

// ============================================================================
// Core Cache Operations
// ============================================================================

/**
 * Get value from cache
 * Returns null if not found or cache disabled
 */
export async function get<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  if (!isCacheEnabled || options.skipCache) {
    return null;
  }

  try {
    const cacheKey = buildCacheKey(key, options.prefix);
    const value = await redis.get<string>(cacheKey);

    if (value === null) {
      metrics.misses++;
      logger.debug('Cache miss', { key: cacheKey });
      return null;
    }

    metrics.hits++;
    logger.debug('Cache hit', { key: cacheKey });

    // Parse JSON if it's a string
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        // If parsing fails, return as-is
        return value as T;
      }
    }

    return value as T;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache get error', error, { key });
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function set<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!isCacheEnabled) {
    return false;
  }

  try {
    const cacheKey = buildCacheKey(key, options.prefix);
    const serialized = JSON.stringify(value);
    const ttl = options.ttl || DEFAULT_TTL.MEDIUM;

    await redis.setex(cacheKey, ttl, serialized);

    metrics.sets++;
    logger.debug('Cache set', { key: cacheKey, ttl });

    return true;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache set error', error, { key });
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function del(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!isCacheEnabled) {
    return false;
  }

  try {
    const cacheKey = buildCacheKey(key, options.prefix);
    await redis.del(cacheKey);

    metrics.deletes++;
    logger.debug('Cache delete', { key: cacheKey });

    return true;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache delete error', error, { key });
    return false;
  }
}

/**
 * Check if key exists in cache
 */
export async function exists(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!isCacheEnabled) {
    return false;
  }

  try {
    const cacheKey = buildCacheKey(key, options.prefix);
    const result = await redis.exists(cacheKey);
    return result === 1;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache exists error', error, { key });
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * Note: Use sparingly as it can be expensive
 */
export async function deletePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  if (!isCacheEnabled) {
    return 0;
  }

  try {
    const prefix = options.prefix || '';
    const fullPattern = prefix ? `${prefix}:${pattern}` : pattern;

    // Upstash doesn't support SCAN, so we'll just document this limitation
    logger.warn('Pattern deletion not fully supported with Upstash Redis', {
      pattern: fullPattern,
    });

    return 0;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache pattern delete error', error, { pattern });
    return 0;
  }
}

// ============================================================================
// Advanced Caching Patterns
// ============================================================================

/**
 * Get or compute value with caching
 * Implements cache-aside pattern
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await get<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  logger.debug('Cache miss, fetching fresh data', { key });
  const value = await fetchFn();

  // Store in cache for next time (don't await)
  set(key, value, options).catch((error) => {
    logger.error('Failed to cache value', error, { key });
  });

  return value;
}

/**
 * Stale-while-revalidate pattern
 * Returns stale data immediately while refreshing in background
 */
export async function getStaleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await get<T>(key, options);

  if (cached !== null) {
    // Return stale cache immediately
    logger.debug('Serving stale cache, revalidating in background', { key });

    // Revalidate in background (don't await)
    fetchFn()
      .then((fresh) => set(key, fresh, options))
      .catch((error) => {
        logger.error('Background revalidation failed', error, { key });
      });

    return cached;
  }

  // No cache - fetch and cache
  const value = await fetchFn();
  await set(key, value, options);
  return value;
}

// ============================================================================
// Request Deduplication
// ============================================================================

/**
 * In-flight request tracking
 */
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate identical in-flight requests
 * Multiple simultaneous requests for the same key will share the same promise
 */
export async function deduplicate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cacheKey = buildCacheKey(key, options.prefix);

  // Check if request is already in-flight
  const existing = inflightRequests.get(cacheKey);
  if (existing) {
    logger.debug('Request deduplication - using existing promise', { key: cacheKey });
    return existing as Promise<T>;
  }

  // Create new promise and track it
  const promise = fetchFn().finally(() => {
    // Remove from in-flight when done
    inflightRequests.delete(cacheKey);
  });

  inflightRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Combined caching with request deduplication
 * Best practice for most use cases
 */
export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try cache first
  if (!options.skipCache) {
    const cached = await get<T>(key, options);
    if (cached !== null) {
      return cached;
    }
  }

  // Cache miss - fetch with deduplication
  return deduplicate(
    key,
    async () => {
      const value = await fetchFn();
      await set(key, value, options);
      return value;
    },
    options
  );
}

// ============================================================================
// Cache Invalidation
// ============================================================================

/**
 * Invalidate cache by prefix
 * Useful for clearing all related cache entries
 */
export async function invalidateByPrefix(prefix: string): Promise<void> {
  logger.info('Invalidating cache by prefix', { prefix });
  // Note: Full implementation would require scanning keys
  // For now, we'll just log the intent
}

/**
 * Invalidate user-specific cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  logger.info('Invalidating user cache', { userId });

  // Delete user-specific cache keys
  const keysToDelete = [
    buildCacheKey(userId, CACHE_PREFIX.USER_PROFILE),
    buildCacheKey(userId, CACHE_PREFIX.WARDROBE),
    buildCacheKey(userId, CACHE_PREFIX.RECOMMENDATION),
  ];

  await Promise.all(keysToDelete.map((key) => del(key)));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if cache is enabled and healthy
 */
export async function healthCheck(): Promise<boolean> {
  if (!isCacheEnabled) {
    return false;
  }

  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Cache health check failed', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const hitRate = metrics.hits + metrics.misses > 0
    ? (metrics.hits / (metrics.hits + metrics.misses)) * 100
    : 0;

  return {
    enabled: isCacheEnabled,
    metrics,
    hitRate: hitRate.toFixed(2) + '%',
  };
}

// ============================================================================
// Exports
// ============================================================================

export const cache = {
  // Core operations
  get,
  set,
  del,
  exists,
  
  // Advanced patterns
  getOrSet,
  getOrFetch,
  getStaleWhileRevalidate,
  deduplicate,
  
  // Invalidation
  invalidateByPrefix,
  invalidateUserCache,
  deletePattern,
  
  // Utilities
  healthCheck,
  getCacheStats,
  getCacheMetrics,
  resetCacheMetrics,
};

export default cache;
