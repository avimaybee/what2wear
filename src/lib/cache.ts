/**
 * Minimal cache helpers.
 *
 * For the simplified hobby deployment we do not persist or reuse data between requests.
 * These no-op helpers keep the rest of the codebase compiling without involving
 * external services or complex invalidation logic.
 */

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  skipCache?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export const DEFAULT_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  VERY_LONG: 3600,
  DAY: 86400,
} as const;

export const CACHE_PREFIX = {
  WEATHER: 'weather',
  RECOMMENDATION: 'recommendation',
  USER_PROFILE: 'user_profile',
  WARDROBE: 'wardrobe',
  AQI: 'aqi',
  GENERAL: 'general',
} as const;

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

function cloneMetrics(): CacheMetrics {
  return { ...metrics };
}

async function passthrough<T>(fetchFn: () => Promise<T>): Promise<T> {
  return fetchFn();
}

export const cache = {
  async get<T>(_key: string, _options: CacheOptions = {}): Promise<T | null> {
    return null;
  },
  async set<T>(_key: string, _value: T, _options: CacheOptions = {}): Promise<boolean> {
    return false;
  },
  async del(_key: string, _options: CacheOptions = {}): Promise<boolean> {
    return false;
  },
  async exists(_key: string, _options: CacheOptions = {}): Promise<boolean> {
    return false;
  },
  async getOrSet<T>(
    _key: string,
    fetchFn: () => Promise<T>,
    _options: CacheOptions = {}
  ): Promise<T> {
    return passthrough(fetchFn);
  },
  async getOrFetch<T>(
    _key: string,
    fetchFn: () => Promise<T>,
    _options: CacheOptions = {}
  ): Promise<T> {
    return passthrough(fetchFn);
  },
  async getStaleWhileRevalidate<T>(
    _key: string,
    fetchFn: () => Promise<T>,
    _options: CacheOptions = {}
  ): Promise<T> {
    return passthrough(fetchFn);
  },
  async deduplicate<T>(
    _key: string,
    fetchFn: () => Promise<T>,
    _options: CacheOptions = {}
  ): Promise<T> {
    return passthrough(fetchFn);
  },
  async healthCheck(): Promise<boolean> {
    return false;
  },
  getCacheStats() {
    return {
      enabled: false,
      metrics: cloneMetrics(),
      hitRate: '0%',
    };
  },
  getCacheMetrics(): CacheMetrics {
    return cloneMetrics();
  },
  resetCacheMetrics(): void {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.sets = 0;
    metrics.deletes = 0;
    metrics.errors = 0;
  },
};

export default cache;
