/**
 * Browser-side Sentry wiring.
 *
 * Reporting is opt-in: it only activates when `VITE_SENTRY_DSN` is set, so
 * local dev builds, tests and any deployment without the variable are inert.
 *
 * Privacy: `sendDefaultPii` is off and both breadcrumbs and events are scrubbed
 * (URL query credentials, cookies, auth headers) before they leave the browser.
 * The persistent diagnostics journal is attached as event context so a Sentry
 * issue can be correlated with the `?diag` overlay.
 */

import * as Sentry from "@sentry/react";

import { APP_VERSION } from "./app-version";
import {
  getDiagnosticsLoadId,
  getDiagnosticsSessionId,
  readDiagnostics,
} from "./diagnostics-log";

const DSN = (import.meta.env.VITE_SENTRY_DSN ?? "").trim();

/** Query params that can carry credentials or session material. */
const SENSITIVE_QUERY_KEYS = new Set([
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "id_token",
  "session",
  "state",
  "error_description",
]);

const MAX_DIAGNOSTIC_LINES = 50;

const IGNORED_ERRORS: Array<string | RegExp> = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Non-Error promise rejection captured",
  /Loading chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /AbortError/,
];

/** Browser-extension noise that is never actionable for this app. */
const DENY_URLS: Array<string | RegExp> = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  /^safari-web-extension:\/\//i,
];

export function isSentryEnabled(): boolean {
  return DSN.length > 0 && import.meta.env.MODE !== "test";
}

function scrubUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    let redacted = false;

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "redacted");
        redacted = true;
      }
    }

    if (!redacted) {
      return url;
    }

    return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function scrubQueryString(query: string): string {
  try {
    const params = new URLSearchParams(query);
    let redacted = false;

    for (const key of Array.from(params.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, "redacted");
        redacted = true;
      }
    }

    return redacted ? params.toString() : query;
  } catch {
    return query;
  }
}

function diagnosticsLines(): string[] {
  return readDiagnostics()
    .slice(-MAX_DIAGNOSTIC_LINES)
    .map((entry) => {
      const base = `${entry.kind}:${entry.event}`;
      return entry.detail ? `${base} — ${entry.detail}` : base;
    });
}

/**
 * Initializes the SDK. Safe to call once at boot; later calls are ignored by
 * the SDK. Never throws — monitoring must not block the app from starting.
 */
export function initSentry(): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      release: APP_VERSION,
      sendDefaultPii: false,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
      ignoreErrors: IGNORED_ERRORS,
      denyUrls: DENY_URLS,
      initialScope: {
        tags: { surface: "storefront" },
      },
      beforeSend(event) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.data;
          if (event.request.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.authorization;
            delete event.request.headers.Cookie;
            delete event.request.headers.cookie;
          }
          if (event.request.url) {
            event.request.url = scrubUrl(event.request.url);
          }
          if (event.request.query_string) {
            const query =
              typeof event.request.query_string === "string"
                ? event.request.query_string
                : "";
            event.request.query_string = scrubQueryString(query);
          }
        }

        event.tags = {
          ...event.tags,
          diagnostics_session: getDiagnosticsSessionId(),
          diagnostics_load: getDiagnosticsLoadId(),
        };
        event.extra = {
          ...event.extra,
          diagnostics: diagnosticsLines(),
        };

        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        const url = breadcrumb.data?.url;
        if (typeof url === "string") {
          breadcrumb.data = { ...breadcrumb.data, url: scrubUrl(url) };
        }
        return breadcrumb;
      },
    });
  } catch {
    // Swallow: a broken DSN must never prevent the storefront from rendering.
  }
}

/** Reports an error/exception with optional structured context. */
export function reportError(
  error: unknown,
  context: Record<string, string | number | boolean | null | undefined> = {},
): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        if (value !== undefined && value !== null) {
          scope.setExtra(key, value);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // Best effort only.
  }
}
