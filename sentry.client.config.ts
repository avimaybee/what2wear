import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client Configuration
 * 
 * Configures error tracking and performance monitoring for browser/client-side code.
 * 
 * To use Sentry:
 * 1. Sign up at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to your .env.local file
 * 
 * Example .env.local:
 * NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
 * NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry Data Source Name (DSN) - unique identifier for your project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Percentage of error events to send (0.0 to 1.0)
  // In production, you might want to sample errors to reduce costs
  sampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.8 : 1.0,

  // Percentage of transactions to send for performance monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Capture 100% of errors in development, 10% in production
  enabled: Boolean(SENTRY_DSN),

  // Distributed tracing - propagate trace context to backend
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/.*\.vercel\.app/,
    /^https:\/\/setmyfit\.com/,
    /^\/api\//,  // Internal API routes
  ],

  // Integrations
  integrations: [
    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration({
      // Track navigation timing
      traceFetch: true,
      traceXHR: true,
      
      // Enable distributed tracing for API calls
      enableLongTask: true,
      enableInp: true,
    }),

    // Replay integration for session replay (useful for debugging)
    Sentry.replayIntegration({
      // Mask all text and user input for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if Sentry is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out development console errors in production
    if (SENTRY_ENVIRONMENT === 'production' && event.level === 'log') {
      return null;
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        // Remove passwords, tokens, etc.
        if (breadcrumb.data) {
          delete breadcrumb.data.password;
          delete breadcrumb.data.token;
          delete breadcrumb.data.api_key;
          delete breadcrumb.data.apiKey;
          delete breadcrumb.data.secret;
        }
        return breadcrumb;
      });
    }

    // Remove sensitive data from request data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      delete data.password;
      delete data.token;
      delete data.api_key;
      delete data.apiKey;
      delete data.secret;
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extension errors
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    
    // Random network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    
    // ResizeObserver errors (harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Release tracking (optional - useful for correlating errors with deployments)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? `what2wear@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}`
    : undefined,
});

export { Sentry };
