/**
 * Production-ready logger with environment-aware output
 * Guards console statements in production to prevent log spam
 * while maintaining error tracking capability
 */

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Info logging - development only
   */
  info(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Warning logging - always output (important for production monitoring)
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Error logging - always output (critical for production monitoring)
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);
  },

  /**
   * Log user actions for analytics (development only for privacy)
   */
  action(actionName: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ACTION] ${actionName}`, metadata);
    }
    // TODO: In production, send to analytics service
  },

  /**
   * Performance logging for debugging (development only)
   */
  perf(label: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};
