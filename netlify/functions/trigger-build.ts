import { createClient, type User } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

/**
 * Triggers a Netlify site rebuild (build hook) on behalf of an authenticated
 * admin. Used by the admin "Content" section so edited content is re-baked into
 * a fresh deploy. Holds the build hook URL server-side so it never reaches the
 * browser.
 */
export const handler = async (event: NetlifyEvent) => {
  if ((event.httpMethod ?? "GET").toUpperCase() !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  const authHeader = event.headers?.["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return jsonResponse(401, { error: "Missing authorization token." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !apiKey) {
    return jsonResponse(500, { error: "Missing Supabase configuration." });
  }

  let user: User | null = null;
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: apiKey,
      },
    });

    if (!authResponse.ok) {
      return jsonResponse(401, { error: "Invalid or expired token." });
    }

    user = (await authResponse.json()) as User;
  } catch (err) {
    console.error("[trigger-build] auth failed:", err);
    return jsonResponse(500, { error: "Auth request failed." });
  }

  const adminClient = createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return jsonResponse(403, { error: "Forbidden: not an admin user." });
  }

  const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!buildHookUrl) {
    return jsonResponse(500, { error: "Build trigger is not configured." });
  }

  try {
    const response = await fetch(buildHookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "admin-content" }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return jsonResponse(502, {
        error: `Build hook responded ${response.status}. ${detail.slice(0, 200)}`,
      });
    }
  } catch (err) {
    console.error("[trigger-build] build hook failed:", err);
    return jsonResponse(502, { error: "Build hook request failed." });
  }

  return jsonResponse(200, { ok: true });
};
