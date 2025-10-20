/**
 * Performance Monitoring Utilities
 * 
 * Tracks API performance, database queries, and feature usage metrics
 * for optimization and monitoring purposes.
 * 
 * Features:
 * - API endpoint response time tracking
 * - Database query performance monitoring
 * - Cache hit/miss rates
 * - External API call tracking (OpenWeather, AI services)
 * - Memory and resource usage
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

/**
 * Performance metric types
 */
export enum MetricType {
  API_REQUEST = 'api_request',
  DATABASE_QUERY = 'database_query',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  EXTERNAL_API = 'external_api',
  AI_GENERATION = 'ai_generation',
  FILE_UPLOAD = 'file_upload',
  IMAGE_PROCESSING = 'image_processing',
}

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  [MetricType.API_REQUEST]: {
    good: 200,
    warning: 500,
    critical: 1000,
  },
  [MetricType.DATABASE_QUERY]: {
    good: 50,
    warning: 200,
    critical: 500,
  },
  [MetricType.CACHE_HIT]: {
    good: 10,
    warning: 50,
    critical: 100,
  },
  [MetricType.CACHE_MISS]: {
    good: 10,
    warning: 50,
    critical: 100,
  },
  [MetricType.EXTERNAL_API]: {
    good: 500,
    warning: 2000,
    critical: 5000,
  },
  [MetricType.AI_GENERATION]: {
    good: 1000,
    warning: 3000,
    critical: 10000,
  },
  [MetricType.FILE_UPLOAD]: {
    good: 1000,
    warning: 5000,
    critical: 10000,
  },
  [MetricType.IMAGE_PROCESSING]: {
    good: 500,
    warning: 2000,
    critical: 5000,
  },
};

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  /**
   * Track an API request performance
   */
  trackApiRequest(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      type: MetricType.API_REQUEST,
      name: `${method} ${endpoint}`,
      duration,
      timestamp: new Date(),
      metadata: { statusCode, ...metadata },
    };

    this.recordMetric(metric);
  }

  /**
   * Track a database query performance
   */
  trackDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    rowCount?: number,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      type: MetricType.DATABASE_QUERY,
      name: `${operation} ${table}`,
      duration,
      timestamp: new Date(),
      metadata: { rowCount, ...metadata },
    };

    this.recordMetric(metric);
  }

  /**
   * Track cache hit
   */
  trackCacheHit(key: string, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      type: MetricType.CACHE_HIT,
      name: `cache_hit:${key}`,
      duration: 0,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(key: string, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      type: MetricType.CACHE_MISS,
      name: `cache_miss:${key}`,
      duration: 0,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
  }

  /**
   * Track external API call
   */
  trackExternalApi(
    service: string,
    endpoint: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      type: MetricType.EXTERNAL_API,
      name: `${service}:${endpoint}`,
      duration,
      timestamp: new Date(),
      metadata: { success, ...metadata },
    };

    this.recordMetric(metric);
  }

  /**
   * Track AI generation performance
   */
  trackAiGeneration(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      type: MetricType.AI_GENERATION,
      name: operation,
      duration,
      timestamp: new Date(),
      metadata: { success, ...metadata },
    };

    this.recordMetric(metric);
  }

  /**
   * Track file upload performance
   */
  trackFileUpload(
    fileSize: number,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      type: MetricType.FILE_UPLOAD,
      name: 'file_upload',
      duration,
      timestamp: new Date(),
      metadata: { fileSize, success, ...metadata },
    };

    this.recordMetric(metric);
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    const threshold = PERFORMANCE_THRESHOLDS[metric.type];

    // Determine performance level
    let level: 'good' | 'warning' | 'critical' = 'good';
    if (metric.duration > threshold.critical) {
      level = 'critical';
    } else if (metric.duration > threshold.warning) {
      level = 'warning';
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = level === 'good' ? '✅' : level === 'warning' ? '⚠️' : '🔴';
      console.log(
        `${emoji} [PERF] ${metric.type}: ${metric.name} - ${metric.duration}ms`,
        metric.metadata
      );
    }

    // Send to Sentry as custom measurement
    Sentry.metrics.distribution(metric.type, metric.duration, {
      unit: 'millisecond',
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metric.type}: ${metric.name} (${metric.duration}ms) [${level}]`,
      level: level === 'critical' ? 'error' : level === 'warning' ? 'warning' : 'info',
      data: { ...metric.metadata, performanceLevel: level },
    });

    // Log warnings and critical issues
    if (level === 'warning') {
      logger.warn(
        `Slow performance detected: ${metric.name} took ${metric.duration}ms (threshold: ${threshold.warning}ms)`,
        undefined,
        metric.metadata
      );
    } else if (level === 'critical') {
      logger.error(
        `Critical performance issue: ${metric.name} took ${metric.duration}ms (threshold: ${threshold.critical}ms)`,
        undefined,
        undefined,
        metric.metadata
      );
    }
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string): () => number {
    const startTime = Date.now();

    return () => {
      return Date.now() - startTime;
    };
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    type: MetricType,
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const endMeasurement = this.startMeasurement(name);

    try {
      const result = await operation();
      const duration = endMeasurement();

      const metric: PerformanceMetric = {
        type,
        name,
        duration,
        timestamp: new Date(),
        metadata: { success: true, ...metadata },
      };

      this.recordMetric(metric);

      return result;
    } catch (error) {
      const duration = endMeasurement();

      const metric: PerformanceMetric = {
        type,
        name,
        duration,
        timestamp: new Date(),
        metadata: { success: false, error: String(error), ...metadata },
      };

      this.recordMetric(metric);

      throw error;
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(
    type: MetricType,
    name: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const endMeasurement = this.startMeasurement(name);

    try {
      const result = operation();
      const duration = endMeasurement();

      const metric: PerformanceMetric = {
        type,
        name,
        duration,
        timestamp: new Date(),
        metadata: { success: true, ...metadata },
      };

      this.recordMetric(metric);

      return result;
    } catch (error) {
      const duration = endMeasurement();

      const metric: PerformanceMetric = {
        type,
        name,
        duration,
        timestamp: new Date(),
        metadata: { success: false, error: String(error), ...metadata },
      };

      this.recordMetric(metric);

      throw error;
    }
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Helper functions for common operations
 */

/**
 * Measure API request performance
 */
export async function measureApiRequest<T>(
  endpoint: string,
  method: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(
    MetricType.API_REQUEST,
    `${method} ${endpoint}`,
    operation,
    metadata
  );
}

/**
 * Measure database query performance
 */
export async function measureDatabaseQuery<T>(
  operation: string,
  table: string,
  query: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(
    MetricType.DATABASE_QUERY,
    `${operation} ${table}`,
    query,
    metadata
  );
}

/**
 * Measure external API call performance
 */
export async function measureExternalApi<T>(
  service: string,
  endpoint: string,
  call: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(
    MetricType.EXTERNAL_API,
    `${service}:${endpoint}`,
    call,
    metadata
  );
}

/**
 * Measure AI generation performance
 */
export async function measureAiGeneration<T>(
  operation: string,
  generation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(
    MetricType.AI_GENERATION,
    operation,
    generation,
    metadata
  );
}
