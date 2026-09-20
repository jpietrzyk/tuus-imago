/**
 * Server-side Sentry wiring for the Netlify Functions.
 *
 * Every function is wrapped with `withSentry` / `withSentryV2` so that both
 * thrown errors and returned 5xx responses are reported, without changing the
 * response contract callers (and tests) rely on. Monitoring is best-effort:
 * when `SENTRY_DSN` is unset (local dev, tests) or init fails, the wrappers are
 * transparent pass-throughs. A capture failure must never take a function down.
 */

import * as Sentry from "@sentry/node";

type LambdaResultLike = {
  statusCode: number;
  body?: string | null;
};

type ServerContextValue = string | number | boolean | null | undefined;

let initialized = false;
let enabled = false;

function readTraceSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  const parsed = raw ? Number(raw) : Number.NaN;

  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }

  return process.env.CONTEXT === "production" ? 0.1 : 1;
}

function readRelease(): string | undefined {
  const sha = (process.env.COMMIT_REF ?? process.env.GITHUB_SHA)?.slice(0, 7);
  if (!sha) {
    return undefined;
  }

  const version = process.env.npm_package_version;
  return version ? `${version}+${sha}` : sha;
}

/**
 * Initializes the SDK once per function instance. Returns whether reporting is
 * active. Safe to call from every request; later calls are no-ops.
 */
export function initSentry(): boolean {
  if (initialized) {
    return enabled;
  }
  initialized = true;

  // Never report from unit tests, even if a DSN happens to be present in the
  // environment (e.g. a developer's `.env`).
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return false;
  }

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.CONTEXT ?? process.env.NODE_ENV ?? "development",
      release: readRelease(),
      tracesSampleRate: readTraceSampleRate(),
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request) {
          // Requests here carry auth tokens, order access tokens and customer
          // data; the response context is enough to debug a failure.
          delete event.request.cookies;
          delete event.request.data;
          delete event.request.query_string;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
    });
    enabled = true;
  } catch {
    // A broken monitoring setup must not break checkout or payments.
    enabled = false;
  }

  return enabled;
}

export function isSentryEnabled(): boolean {
  return enabled;
}

function describeReturnedFailure(name: string, result: LambdaResultLike): Error {
  let message = `Function ${name} returned HTTP ${result.statusCode}`;

  if (typeof result.body === "string" && result.body) {
    try {
      const parsed = JSON.parse(result.body) as { error?: unknown };
      if (typeof parsed.error === "string" && parsed.error) {
        message = parsed.error;
      }
    } catch {
      // Non-JSON body; keep the generic message.
    }
  }

  return new Error(message);
}

/** Reports an error with function context and flushes before the instance freezes. */
export async function captureServerError(
  error: unknown,
  context: Record<string, ServerContextValue> = {},
): Promise<void> {
  if (!initSentry()) {
    return;
  }

  try {
    Sentry.withScope((scope) => {
      scope.setTag("runtime", "netlify-function");
      for (const [key, value] of Object.entries(context)) {
        if (value !== undefined && value !== null) {
          scope.setExtra(key, value);
        }
      }
      Sentry.captureException(error);
    });

    await Sentry.flush(2000);
  } catch {
    // Never let reporting failure surface to the caller.
  }
}

/**
 * Wraps a classic Lambda-style handler. Returned 5xx results are captured using
 * the response body's `error` message; thrown errors are captured and converted
 * to a generic 500 so Netlify never returns a raw error page.
 */
export function withSentry<E, R extends LambdaResultLike>(
  name: string,
  handler: (event: E) => Promise<R>,
): (event: E) => Promise<R> {
  return async (event: E): Promise<R> => {
    initSentry();

    try {
      const result = await handler(event);

      if (result.statusCode >= 500) {
        await captureServerError(describeReturnedFailure(name, result), {
          function: name,
          statusCode: result.statusCode,
        });
      }

      return result;
    } catch (error) {
      await captureServerError(error, { function: name });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error." }),
      } as unknown as R;
    }
  };
}

/** Wraps a Netlify v2 `Request -> Response` function. */
export function withSentryV2(
  name: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    initSentry();

    try {
      const response = await handler(request);

      if (response.status >= 500) {
        await captureServerError(
          new Error(`Function ${name} returned HTTP ${response.status}`),
          { function: name, statusCode: response.status, method: request.method },
        );
      }

      return response;
    } catch (error) {
      await captureServerError(error, {
        function: name,
        method: request.method,
      });
      return new Response(JSON.stringify({ error: "Internal server error." }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  };
}
