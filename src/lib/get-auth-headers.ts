import { supabase } from "@/lib/supabase-client";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  let token = data.session?.access_token;
  const expiresAt = data.session?.expires_at;

  if (token && expiresAt && expiresAt * 1000 < Date.now() + 60_000) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    token = refreshData.session?.access_token;
  }

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
