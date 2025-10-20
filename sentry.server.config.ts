import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server Configuration
 * 
 * Configures error tracking and performance monitoring for server-side code (API routes, SSR).
 * 
 * To use Sentry:
 * 1. Sign up at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Add SENTRY_DSN to your .env.local file
 * 
 * Example .env.local:
 * SENTRY_DSN=https://your-key@sentry.io/your-project-id
 * SENTRY_ENVIRONMENT=development
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry Data Source Name (DSN)
  dsn: SENTRY_DSN,

  // Environment
  environment: SENTRY_ENVIRONMENT,

  // Sample rates
  sampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.8 : 1.0,
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Enable only if DSN is configured
  enabled: Boolean(SENTRY_DSN),

  // Filter sensitive data
  beforeSend(event, hint) {
    // Don't send if not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data from request
    if (event.request) {
      // Remove sensitive query parameters
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        const cleanedQuery = event.request.query_string
          .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
        event.request.query_string = cleanedQuery;
      }

      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive data from body
      if (event.request.data) {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.api_key;
        delete data.apiKey;
        delete data.secret;
        delete data.client_secret;
      }
    }

    // Remove sensitive environment variables
    if (event.contexts?.runtime?.name === 'node' && event.extra) {
      delete event.extra.NODE_ENV;
      delete event.extra.SUPABASE_SERVICE_ROLE_KEY;
      delete event.extra.OPENWEATHER_API_KEY;
      delete event.extra.GOOGLE_CLIENT_SECRET;
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Database connection errors (handled by application)
    'ECONNREFUSED',
    'ETIMEDOUT',
    
    // Expected HTTP errors
    'Not Found',
    '404',
    
    // User abort/cancel
    'AbortError',
    'User aborted',
  ],

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA
    ? `what2wear@${process.env.VERCEL_GIT_COMMIT_SHA}`
    : undefined,
});

export { Sentry };
