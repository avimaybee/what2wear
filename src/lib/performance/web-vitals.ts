/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals and sends them to analytics/monitoring services.
 * Integrates with Sentry for performance monitoring.
 * 
 * @module lib/performance/web-vitals
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';
import { logger } from '../monitoring/logger';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// ============================================================================
// Thresholds (based on Google's Core Web Vitals)
// ============================================================================

const THRESHOLDS = {
  // Largest Contentful Paint (LCP) - Loading performance
  LCP: {
    good: 2500, // < 2.5s
    poor: 4000, // > 4s
  },
  // Interaction to Next Paint (INP) - Interactivity (replaces FID)
  INP: {
    good: 200, // < 200ms
    poor: 500, // > 500ms
  },
  // Cumulative Layout Shift (CLS) - Visual stability
  CLS: {
    good: 0.1, // < 0.1
    poor: 0.25, // > 0.25
  },
  // First Contentful Paint (FCP) - Initial load
  FCP: {
    good: 1800, // < 1.8s
    poor: 3000, // > 3s
  },
  // Time to First Byte (TTFB) - Server response
  TTFB: {
    good: 800, // < 800ms
    poor: 1800, // > 1.8s
  },
};

// ============================================================================
// Rating Calculation
// ============================================================================

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  
  if (!thresholds) {
    return 'good';
  }

  if (metric.value <= thresholds.good) {
    return 'good';
  }
  
  if (metric.value <= thresholds.poor) {
    return 'needs-improvement';
  }
  
  return 'poor';
}

// ============================================================================
// Metric Reporting
// ============================================================================

function reportWebVital(metric: Metric) {
  const rating = getRating(metric);
  
  const webVitalMetric: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating,
    });
  }

  // Send to Sentry
  try {
    Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond');
    
    // Add as breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value}`,
      level: rating === 'poor' ? 'warning' : 'info',
      data: webVitalMetric,
    });

    // If performance is poor, log as warning
    if (rating === 'poor') {
      logger.warn('Poor web vital performance', {
        metric: metric.name,
        value: metric.value,
        rating,
      });
    }
  } catch (error) {
    logger.error('Failed to report web vital', error, {
      metric: metric.name,
    });
  }

  // Send to custom analytics endpoint (optional)
  if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
    const body = JSON.stringify(webVitalMetric);
    window.navigator.sendBeacon('/api/analytics/web-vitals', body);
  }
}

// ============================================================================
// Initialize Web Vitals Tracking
// ============================================================================

export function initWebVitals() {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Track Core Web Vitals
  onCLS(reportWebVital);
  onINP(reportWebVital); // Replaces FID
  onFCP(reportWebVital);
  onLCP(reportWebVital);
  onTTFB(reportWebVital);

  logger.debug('Web Vitals tracking initialized');
}

// ============================================================================
// Performance Marks and Measures
// ============================================================================

/**
 * Mark a performance timestamp
 */
export function mark(name: string) {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
}

/**
 * Measure time between two marks
 */
export function measure(name: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
    try {
      const measure = window.performance.measure(name, startMark, endMark);
      
      logger.debug('Performance measure', {
        name,
        duration: measure.duration,
      });

      // Send to Sentry
      Sentry.setMeasurement(name, measure.duration, 'millisecond');
      
      return measure.duration;
    } catch (error) {
      logger.error('Failed to measure performance', error, { name, startMark, endMark });
    }
  }
  
  return 0;
}

/**
 * Clear performance marks
 */
export function clearMarks(name?: string) {
  if (typeof window !== 'undefined' && window.performance && window.performance.clearMarks) {
    window.performance.clearMarks(name);
  }
}

// ============================================================================
// Resource Timing
// ============================================================================

/**
 * Get resource timing data
 */
export function getResourceTiming() {
  if (typeof window === 'undefined' || !window.performance || !window.performance.getEntriesByType) {
    return [];
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize,
    type: resource.initiatorType,
  }));
}

/**
 * Get largest resources by size
 */
export function getLargestResources(limit = 10) {
  const resources = getResourceTiming();
  return resources
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}

// ============================================================================
// Page Load Performance
// ============================================================================

/**
 * Get page load performance metrics
 */
export function getPageLoadMetrics() {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  
  return {
    // Total page load time
    loadTime: timing.loadEventEnd - timing.navigationStart,
    
    // DOM content loaded
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    
    // DNS lookup time
    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
    
    // TCP connection time
    tcpTime: timing.connectEnd - timing.connectStart,
    
    // Server response time
    serverTime: timing.responseEnd - timing.requestStart,
    
    // DOM processing time
    domProcessing: timing.domComplete - timing.domLoading,
  };
}

// ============================================================================
// Exports
// ============================================================================

export const webVitals = {
  init: initWebVitals,
  mark,
  measure,
  clearMarks,
  getResourceTiming,
  getLargestResources,
  getPageLoadMetrics,
};

export default webVitals;
