import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Edge Configuration
 * 
 * Configures error tracking for edge runtime (middleware, edge API routes).
 * Edge runtime has limited capabilities compared to Node.js runtime.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  sampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.8 : 1.0,
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  enabled: Boolean(SENTRY_DSN),

  // Edge runtime has limited integrations
  beforeSend(event) {
    if (!SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },

  release: process.env.VERCEL_GIT_COMMIT_SHA
    ? `what2wear@${process.env.VERCEL_GIT_COMMIT_SHA}`
    : undefined,
});

export { Sentry };
