/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI while
 * automatically reporting errors to Sentry.
 * 
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */

'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, errorInfo, onReset }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription>
            We&apos;re sorry for the inconvenience. The error has been reported and we&apos;ll fix it soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="space-y-2">
              <div className="rounded-md bg-destructive/10 p-4">
                <h3 className="font-semibold text-destructive">Error Details (Development Only)</h3>
                <p className="mt-2 font-mono text-sm">{error.message}</p>
              </div>

              {errorInfo?.componentStack && (
                <details className="rounded-md bg-muted p-4">
                  <summary className="cursor-pointer font-semibold">Component Stack</summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {error.stack && (
                <details className="rounded-md bg-muted p-4">
                  <summary className="cursor-pointer font-semibold">Error Stack</summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onReset}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal Error Fallback (for inline errors)
 */
export function MinimalErrorFallback({ error, onReset }: { error?: Error; onReset?: () => void }) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-destructive"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">An error occurred</h3>
          {error && (
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          )}
          {onReset && (
            <Button size="sm" variant="outline" onClick={onReset} className="mt-2">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for manual error reporting
 */
export function useErrorHandler() {
  return (error: Error, context?: Record<string, unknown>) => {
    Sentry.captureException(error, {
      extra: context,
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('Manually reported error:', error, context);
    }
  };
}
