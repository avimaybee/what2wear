/**
 * Next.js Instrumentation
 * 
 * This file is automatically loaded by Next.js to initialize monitoring and tracing.
 * It runs before any other code, making it perfect for Sentry initialization.
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // Only run on edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
