import { supabase } from "@/lib/supabase-client";

/**
 * Returns authorization headers for admin API requests.
 *
 * Handles three scenarios:
 * 1. Valid token present → use it
 * 2. Token expiring within 60s → refresh first, then use new token
 * 3. No token at all → attempt session refresh (e.g. after tab sleep or page reload)
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  let token = data.session?.access_token;
  const expiresAt = data.session?.expires_at;

  // Proactively refresh if the token will expire within 60 seconds
  if (token && expiresAt && expiresAt * 1000 < Date.now() + 60_000) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    token = refreshData.session?.access_token;
  }

  // If no token from getSession, try a full session refresh.
  // This handles stale/missing local sessions where a refresh token is still valid.
  if (!token) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    token = refreshData.session?.access_token;
  }

  if (!token) {
    console.error("[getAuthHeaders] No auth token available after session check + refresh attempt");
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
