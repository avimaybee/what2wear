/**
 * Simple logger for development and basic error tracking
 */

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);
  },
};
