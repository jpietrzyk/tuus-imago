import { Component, type ErrorInfo, type ReactNode } from "react";

import { forceRefreshApp } from "@/lib/app-version";
import { recordDiagnostic } from "@/lib/diagnostics-log";
import { reportError } from "@/lib/sentry";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort UI for a render error in the storefront. The error is journaled
 * and reported to Sentry, and the customer is offered a hard refresh (which
 * also clears the service worker cache, recovering from a bad deploy).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    recordDiagnostic("react-error-boundary", {
      kind: "error",
      detail: error.message,
      data: { name: error.name },
    });
    reportError(error, { componentStack: errorInfo.componentStack ?? null });
  }

  private handleReload = (): void => {
    void forceRefreshApp("error-boundary");
  };

  render(): ReactNode {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-xl font-semibold">Coś poszło nie tak</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę — jeśli problem
          się powtarza, skontaktuj się z nami.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }
}
