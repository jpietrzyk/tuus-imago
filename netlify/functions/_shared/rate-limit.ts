import type { SupabaseClient } from "@supabase/supabase-js";

type NetlifyEvent = {
  headers?: Record<string, string | undefined>;
};

/**
 * Best-effort client identity for throttling. Netlify sets
 * `x-nf-client-connection-ip`; behind that, fall back to the first forwarded
 * hop. Shared by every DB-throttled public endpoint.
 */
export function getClientKey(event: NetlifyEvent): string {
  const forwarded = event.headers?.["x-forwarded-for"];
  const ip =
    event.headers?.["x-nf-client-connection-ip"] ??
    (forwarded ? forwarded.split(",")[0].trim() : undefined) ??
    "unknown";

  return ip.slice(0, 100);
}

export type RateLimitOptions = {
  scope: string;
  limit: number;
  windowSeconds: number;
};

/**
 * Returns true when the caller already exceeded the allowance. Fails open on a
 * limiter/DB error so an outage never blocks payment or order status.
 */
export async function isRateLimitExceeded(
  supabase: SupabaseClient,
  event: NetlifyEvent,
  options: RateLimitOptions,
): Promise<boolean> {
  const key = `${options.scope}:${getClientKey(event)}`;

  // Some test doubles / alternate clients may not expose rpc; never block on that.
  if (typeof supabase.rpc !== "function") {
    return false;
  }

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit] ${options.scope} check failed:`, error.message);
    return false;
  }

  return data === false;
}

export function rateLimitResponse(windowSeconds = 60) {
  return {
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(windowSeconds),
    },
    body: JSON.stringify({
      error: "Too many requests. Please try again shortly.",
    }),
  };
}
