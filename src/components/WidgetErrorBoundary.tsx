'use client';

import React from 'react';

export interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  /** Human-readable name shown in the error fallback UI and logged with the error. */
  widgetName: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  /**
   * Incremented by the Retry button — changing this key causes React to
   * remount the children from scratch, which clears any internal error state
   * in the child tree.
   */
  retryCount: number;
}

/**
 * Widget-level error boundary.
 *
 * Wrap each dashboard widget individually so that a single widget throwing
 * an error does not unmount the rest of the dashboard. Exposes a "Retry"
 * button that resets the error state and forces a remount of the child.
 *
 * Must be a class component — React error boundaries cannot be function
 * components (React 19 still requires getDerivedStateFromError /
 * componentDidCatch on a class).
 */
export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { widgetName } = this.props;
    if (process.env.NODE_ENV === 'development') {
      console.error(`[WidgetErrorBoundary: ${widgetName}] Error:`, error, info);
    } else {
      errorReporter.report(error, {
        widget: widgetName,
        componentStack: info.componentStack ?? '',
      });
    }
  }

  handleRetry = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { widgetName, children } = this.props;

    if (hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          aria-label={`${widgetName} widget encountered an error`}
          className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-3"
        >
          {/* Header row */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-red-100"
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l6.354 12.748zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800 leading-snug">
                {widgetName} failed to load
              </p>
              <p className="text-xs text-red-600 mt-0.5 leading-snug">
                This widget encountered an error. Other widgets are unaffected.
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-2">
                  <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">
                    Error details (development only)
                  </summary>
                  <pre className="mt-1 text-xs text-red-700 bg-red-100 rounded p-2 overflow-auto whitespace-pre-wrap break-all">
                    {error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* Retry button */}
          <button
            onClick={this.handleRetry}
            aria-label={`Retry loading ${widgetName}`}
            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-700 text-xs font-medium rounded-md border border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
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
            Retry
          </button>

          {/* Hidden counter — ensures React re-keying works on retry without
              leaking the value into the visible DOM */}
          <span className="sr-only" aria-hidden="true">
            Retry attempt {retryCount}
          </span>
        </div>
      );
    }

    /*
     * Wrap children in a keyed fragment so that incrementing retryCount
     * forces React to fully remount the child tree, clearing any cached
     * state that caused the error.
     */
    return (
      <React.Fragment key={retryCount}>
        {children}
      </React.Fragment>
    );
  }
}

/**
 * Stub error reporter — same contract as the one in DashboardErrorBoundary.
 * In a real app both would import from a shared `src/lib/errorReporter.ts`.
 */
const errorReporter = {
  report(error: Error, context: Record<string, string>): void {
    // TODO: wire up to your production error tracking service.
    // eslint-disable-next-line no-console
    console.error('[errorReporter]', error.message, context);
  },
};

export default WidgetErrorBoundary;
