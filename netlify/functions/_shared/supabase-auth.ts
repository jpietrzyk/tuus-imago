import { createClient, type User } from "@supabase/supabase-js";

type NetlifyEvent = {
  headers?: Record<string, string | undefined>;
  httpMethod?: string;
  body?: string | null;
};

function getAuthorizationHeader(event: NetlifyEvent): string | null {
  const authHeader = event.headers?.["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function getAuthenticatedUser(
  event: NetlifyEvent,
): Promise<{ user: User } | { error: { statusCode: number; body: string } }> {
  const token = getAuthorizationHeader(event);
  if (!token) {
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing authorization token." }),
      },
    };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase configuration." }),
      },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token." }),
      },
    };
  }

  return { user: data.user };
}

export function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
