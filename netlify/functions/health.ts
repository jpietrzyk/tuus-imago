import { createServiceClient } from "./_shared/supabase-auth";
import { getRelease, withSentry } from "./_shared/sentry";

// Uptime probe for external availability monitoring (see README §Uptime
// Monitoring). It is deliberately unauthenticated: monitors cannot hold
// credentials, so the response must stay PII-free and reveal only coarse
// dependency state. A DB failure returns 503 so the monitor alerts; the Sentry
// wrapper groups repeated failures into a single issue.
const DB_PROBE_TIMEOUT_MS = 5000;

// Monitors only need minute-level resolution. Briefly memoizing the probe (also
// on failure) collapses request bursts into a single Supabase read, so a public
// endpoint cannot be turned into DB load. The response itself stays `no-store`.
const DB_PROBE_CACHE_MS = 10000;

type NetlifyEvent = {
  httpMethod?: string;
};

type CheckResult = {
  status: "ok" | "error";
  latencyMs: number;
};

let cachedProbe: { result: CheckResult; checkedAt: number } | null = null;

/** Test-only: clears the in-memory probe cache between cases. */
export function resetHealthProbeCache(): void {
  cachedProbe = null;
}

/**
 * Cheap readiness probe: one bounded read against a service-role-only table.
 * This proves the function can reach Supabase/Auth end to end, which is the
 * dependency most likely to take the storefront down.
 */
async function runDatabaseProbe(): Promise<CheckResult> {
  const startedAt = Date.now();

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const supabase = createServiceClient();
    const query = supabase.from("app_settings").select("key").limit(1);

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Database health check timed out")),
        DB_PROBE_TIMEOUT_MS,
      );
    });

    const result = (await Promise.race([Promise.resolve(query), timeout])) as {
      error: { message?: string } | null;
    };

    if (result.error) {
      console.error("[health] database probe failed:", result.error.message);
      return { status: "error", latencyMs: Date.now() - startedAt };
    }

    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    console.error(
      "[health] database probe error:",
      error instanceof Error ? error.message : error,
    );
    return { status: "error", latencyMs: Date.now() - startedAt };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDatabase(): Promise<CheckResult> {
  const now = Date.now();

  if (cachedProbe && now - cachedProbe.checkedAt < DB_PROBE_CACHE_MS) {
    return cachedProbe.result;
  }

  const result = await runDatabaseProbe();
  cachedProbe = { result, checkedAt: Date.now() };
  return result;
}

const handlerImpl = async (event: NetlifyEvent) => {
  const method = event.httpMethod ?? "GET";

  if (method !== "GET" && method !== "HEAD") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const database = await checkDatabase();
  const healthy = database.status === "ok";

  const body = {
    status: healthy ? "ok" : "degraded",
    version: getRelease() ?? "unknown",
    checks: { database },
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: healthy ? 200 : 503,
    body: method === "HEAD" ? "" : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  };
};

export const handler = withSentry("health", handlerImpl);
