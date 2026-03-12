'use client';

import React from 'react';

export interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-level error boundary that wraps the root layout.
 * Catches any unhandled error that escapes all lower-level boundaries and
 * renders a full-page recovery UI so the user can reload without manual
 * browser refresh hunting.
 *
 * Must be a class component — React error boundaries cannot be function
 * components (React 19 still requires getDerivedStateFromError /
 * componentDidCatch on a class).
 */
export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DashboardErrorBoundary] Unhandled error:', error, info);
    } else {
      // Production: delegate to the stub error reporter.
      errorReporter.report(error, { componentStack: info.componentStack ?? '' });
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center bg-gray-50 p-8"
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
            {/* Icon */}
            <div
              className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100"
              aria-hidden="true"
            >
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                An unexpected error occurred. Your data is safe. Reload the page
                to continue.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 bg-red-50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

/**
 * Stub error reporter — replace the body with a real integration
 * (e.g. Sentry, Datadog) without changing call sites.
 */
const errorReporter = {
  report(error: Error, context: Record<string, string>): void {
    // TODO: wire up to your production error tracking service.
    // eslint-disable-next-line no-console
    console.error('[errorReporter]', error.message, context);
  },
};

export default DashboardErrorBoundary;
