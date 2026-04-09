import type { AuthProvider } from "@refinedev/core";
import { supabase } from "@/lib/supabase-client";

export const adminAuthProvider: AuthProvider = {
  login: async ({ email, password }) => {
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[auth] signInWithPassword failed:", error.message);
        return {
          success: false,
          error: { message: error.message, name: "LoginError" },
        };
      }

      if (!data.user) {
        console.error("[auth] signInWithPassword returned no user");
        return {
          success: false,
          error: { message: "No user returned.", name: "LoginError" },
        };
      }

      console.log("[auth] signInWithPassword OK — user:", data.user.id, "session expires_at:", data.session?.expires_at);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        console.error("[auth] Admin check failed — profileError:", profileError?.message, "is_admin:", profile?.is_admin);
        await supabase.auth.signOut();
        return {
          success: false,
          error: {
            message: "Not an admin user.",
            name: "ForbiddenError",
          },
        };
      }

      // Verify session was persisted
      const { data: verifySession } = await supabase.auth.getSession();
      console.log("[auth] Post-login session check — has session:", !!verifySession.session, "token present:", !!verifySession.session?.access_token);

      return {
        success: true,
        redirectTo: "/admin",
      };
    }

    return {
      success: false,
      error: { message: "Missing email or password.", name: "LoginError" },
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return {
      success: true,
      redirectTo: "/admin/login",
    };
  },

  check: async () => {
    const { data: existingSession } = await supabase.auth.getSession();
    console.log("[auth] check — has session:", !!existingSession.session, "user:", existingSession.session?.user?.id ?? "none");

    if (existingSession.session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", existingSession.session.user.id)
        .single();

      if (profile?.is_admin) {
        return { authenticated: true };
      }
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const accessToken = hashParams.get("access_token");

    if (code || accessToken) {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (error) {
          return {
            authenticated: false,
            redirectTo: "/admin/login",
          };
        }
      }

      window.history.replaceState(null, "", "/admin");
    }

    const { data } = await supabase.auth.getSession();

    if (!data.session?.user) {
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.session.user.id)
      .single();

    if (!profile?.is_admin) {
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }

    return { authenticated: true };
  },

  getIdentity: async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session?.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", data.session.user.id)
      .single();

    return {
      id: data.session.user.id,
      email: data.session.user.email,
      name: profile?.full_name ?? data.session.user.email,
      isAdmin: profile?.is_admin ?? false,
    };
  },

  onError: async (error) => {
    console.log("[auth] onError — statusCode:", error?.statusCode);

    if (error?.statusCode === 401) {
      // Try to recover the session before forcing logout.
      // A 401 may happen because the access token expired but the refresh
      // token is still valid. Attempting a refresh avoids a login death-spiral.
      const { data } = await supabase.auth.refreshSession();
      console.log("[auth] onError refreshSession — recovered:", !!data.session);
      if (data.session) {
        // Session recovered — tell Refine to retry the request.
        return { error };
      }
      // No recoverable session — must re-login.
      return {
        logout: true,
        error,
        redirectTo: "/admin/login",
      };
    }
    if (error?.statusCode === 403) {
      return {
        logout: true,
        error,
        redirectTo: "/admin/login",
      };
    }
    return { error };
  },
};
