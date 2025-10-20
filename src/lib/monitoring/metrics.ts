/**
 * Metrics Collection System
 * 
 * Tracks business and application metrics for analytics, monitoring,
 * and data-driven decision making.
 * 
 * Features:
 * - Recommendation generation metrics
 * - User engagement tracking
 * - Feature usage analytics
 * - Conversion and success rates
 * - Custom business metrics
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

/**
 * Metric event types
 */
export enum MetricEvent {
  // Recommendation events
  RECOMMENDATION_REQUESTED = 'recommendation_requested',
  RECOMMENDATION_GENERATED = 'recommendation_generated',
  RECOMMENDATION_FAILED = 'recommendation_failed',
  RECOMMENDATION_ACCEPTED = 'recommendation_accepted',
  RECOMMENDATION_REJECTED = 'recommendation_rejected',
  RECOMMENDATION_FEEDBACK = 'recommendation_feedback',

  // Wardrobe events
  WARDROBE_ITEM_ADDED = 'wardrobe_item_added',
  WARDROBE_ITEM_UPDATED = 'wardrobe_item_updated',
  WARDROBE_ITEM_DELETED = 'wardrobe_item_deleted',
  WARDROBE_VIEWED = 'wardrobe_viewed',

  // User events
  USER_SIGNED_UP = 'user_signed_up',
  USER_SIGNED_IN = 'user_signed_in',
  USER_SIGNED_OUT = 'user_signed_out',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  USER_PREFERENCES_UPDATED = 'user_preferences_updated',

  // Outfit events
  OUTFIT_LOGGED = 'outfit_logged',
  OUTFIT_SHARED = 'outfit_shared',
  OUTFIT_FAVORITED = 'outfit_favorited',

  // Weather events
  WEATHER_FETCHED = 'weather_fetched',
  WEATHER_CACHE_HIT = 'weather_cache_hit',

  // Calendar events
  CALENDAR_SYNCED = 'calendar_synced',
  EVENT_CLASSIFIED = 'event_classified',

  // Feature usage
  FEATURE_USED = 'feature_used',
  ERROR_ENCOUNTERED = 'error_encountered',
}

/**
 * Metrics collector class
 */
class MetricsCollector {
  private counters: Map<string, number> = new Map();

  /**
   * Increment a counter
   */
  private incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Get all counters
   */
  getAllCounters(): Record<string, number> {
    const result: Record<string, number> = {};
    this.counters.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Reset counters
   */
  resetCounters(): void {
    this.counters.clear();
  }

  /**
   * Track a recommendation request
   */
  trackRecommendationRequest(
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.RECOMMENDATION_REQUESTED, userId, metadata);
    this.incrementCounter('recommendations.requested');
  }

  /**
   * Track successful recommendation generation
   */
  trackRecommendationGenerated(
    userId: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.RECOMMENDATION_GENERATED, userId, {
      duration,
      ...metadata,
    });

    this.incrementCounter('recommendations.generated');
    globalMetricsAggregator.add('recommendations.generation_time', duration);
  }

  /**
   * Track failed recommendation generation
   */
  trackRecommendationFailed(
    userId: string,
    error: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.RECOMMENDATION_FAILED, userId, {
      error,
      ...metadata,
    });

    this.incrementCounter('recommendations.failed');
  }

  /**
   * Track recommendation feedback
   */
  trackRecommendationFeedback(
    userId: string,
    recommendationId: string,
    rating: number,
    accepted: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const event = accepted
      ? MetricEvent.RECOMMENDATION_ACCEPTED
      : MetricEvent.RECOMMENDATION_REJECTED;

    this.trackEvent(event, userId, {
      recommendationId,
      rating,
      ...metadata,
    });

    this.incrementCounter(`recommendations.${accepted ? 'accepted' : 'rejected'}`);
    globalMetricsAggregator.add('recommendations.rating', rating);
  }

  /**
   * Track wardrobe item addition
   */
  trackWardrobeItemAdded(
    userId: string,
    itemType: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.WARDROBE_ITEM_ADDED, userId, {
      itemType,
      ...metadata,
    });

    this.incrementCounter('wardrobe.items_added');
  }

  /**
   * Track wardrobe item update
   */
  trackWardrobeItemUpdated(
    userId: string,
    itemId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.WARDROBE_ITEM_UPDATED, userId, {
      itemId,
      ...metadata,
    });

    this.incrementCounter('wardrobe.items_updated');
  }

  /**
   * Track wardrobe item deletion
   */
  trackWardrobeItemDeleted(
    userId: string,
    itemId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.WARDROBE_ITEM_DELETED, userId, {
      itemId,
      ...metadata,
    });

    this.incrementCounter('wardrobe.items_deleted');
  }

  /**
   * Track wardrobe view
   */
  trackWardrobeViewed(userId: string, itemCount: number): void {
    this.trackEvent(MetricEvent.WARDROBE_VIEWED, userId, { itemCount });
    this.incrementCounter('wardrobe.views');
    globalMetricsAggregator.add('wardrobe.item_count', itemCount);
  }

  /**
   * Track user sign up
   */
  trackUserSignUp(userId: string, method: string): void {
    this.trackEvent(MetricEvent.USER_SIGNED_UP, userId, { method });
    this.incrementCounter('users.signups');
    logger.info(`New user signed up: ${userId}`, { userId, method });
  }

  /**
   * Track user sign in
   */
  trackUserSignIn(userId: string, method: string): void {
    this.trackEvent(MetricEvent.USER_SIGNED_IN, userId, { method });
    this.incrementCounter('users.signins');
  }

  /**
   * Track user sign out
   */
  trackUserSignOut(userId: string): void {
    this.trackEvent(MetricEvent.USER_SIGNED_OUT, userId);
    this.incrementCounter('users.signouts');
  }

  /**
   * Track outfit logging
   */
  trackOutfitLogged(
    userId: string,
    outfitId: string,
    itemCount: number,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.OUTFIT_LOGGED, userId, {
      outfitId,
      itemCount,
      ...metadata,
    });

    this.incrementCounter('outfits.logged');
  }

  /**
   * Track weather data fetch
   */
  trackWeatherFetched(
    userId: string,
    location: string,
    cached: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const event = cached ? MetricEvent.WEATHER_CACHE_HIT : MetricEvent.WEATHER_FETCHED;

    this.trackEvent(event, userId, { location, ...metadata });
    this.incrementCounter(`weather.${cached ? 'cache_hit' : 'api_call'}`);
  }

  /**
   * Track calendar sync
   */
  trackCalendarSynced(
    userId: string,
    eventCount: number,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.CALENDAR_SYNCED, userId, {
      eventCount,
      ...metadata,
    });

    this.incrementCounter('calendar.syncs');
    globalMetricsAggregator.add('calendar.events', eventCount);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    userId: string,
    featureName: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.FEATURE_USED, userId, {
      feature: featureName,
      ...metadata,
    });

    this.incrementCounter(`features.${featureName}.used`);
  }

  /**
   * Track error occurrence
   */
  trackError(
    userId: string | undefined,
    errorType: string,
    endpoint: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent(MetricEvent.ERROR_ENCOUNTERED, userId || 'anonymous', {
      errorType,
      endpoint,
      ...metadata,
    });

    this.incrementCounter('errors.total');
  }

  /**
   * Track custom metric
   */
  trackCustomMetric(
    name: string,
    value: number,
    unit: 'millisecond' | 'second' | 'byte' | 'none' = 'none',
    metadata?: Record<string, unknown>
  ): void {
    globalMetricsAggregator.add(name, value);
    logger.debug(`Custom metric: ${name} = ${value} ${unit}`, undefined, metadata);
  }

  /**
   * Calculate and track success rate
   */
  trackSuccessRate(
    operation: string,
    successful: number,
    failed: number
  ): void {
    const total = successful + failed;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    globalMetricsAggregator.add(`${operation}.success_rate`, successRate);

    logger.info(`Success rate for ${operation}: ${successRate.toFixed(2)}%`, undefined, {
      successful,
      failed,
      total,
    });
  }

  /**
   * Track event with Sentry and logging
   */
  private trackEvent(
    event: MetricEvent,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'metric',
      message: event,
      level: 'info',
      data: { userId, ...metadata },
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric: ${event}`, { userId }, metadata);
    }
  }
}

/**
 * Singleton metrics collector instance
 */
export const metricsCollector = new MetricsCollector();

/**
 * Helper class for aggregating metrics over time windows
 */
export class MetricsAggregator {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Add a value to a metric
   */
  add(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(value);
  }

  /**
   * Get average value for a metric
   */
  getAverage(metricName: string): number {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Get median value for a metric
   */
  getMedian(metricName: string): number {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Get 95th percentile value for a metric
   */
  getPercentile95(metricName: string): number {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Get total count for a metric
   */
  getCount(metricName: string): number {
    return (this.metrics.get(metricName) || []).length;
  }

  /**
   * Reset metrics
   */
  reset(metricName?: string): void {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get all metrics summary
   */
  getSummary(): Record<string, { count: number; avg: number; median: number; p95: number }> {
    const summary: Record<string, { count: number; avg: number; median: number; p95: number }> = {};

    for (const [name] of this.metrics) {
      summary[name] = {
        count: this.getCount(name),
        avg: this.getAverage(name),
        median: this.getMedian(name),
        p95: this.getPercentile95(name),
      };
    }

    return summary;
  }
}

/**
 * Global metrics aggregator for session-level metrics
 */
export const globalMetricsAggregator = new MetricsAggregator();
