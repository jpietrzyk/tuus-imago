import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import {
  AUTH_CALLBACK_PATH,
  consumePostAuthRedirect,
  hasAuthResponseInUrl,
} from "@/lib/post-auth-redirect";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: "google" | "facebook") => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Captured synchronously on the first render, before the Supabase client
  // consumes the tokens from the URL. Records that this page load is an OAuth
  // provider return, which is what scopes the global redirect below.
  const isOAuthReturnRef = useRef(
    typeof window !== "undefined" && hasAuthResponseInUrl(window.location.href),
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Single owner of the post-auth redirect. Runs whenever this page load is an
  // OAuth return, regardless of the landing route (the provider/Supabase can
  // send the user to the site root instead of `/auth/callback`). Scoped to
  // successful OAuth returns so email/password sign-ins and password recovery
  // are never redirected by a stale path.
  useEffect(() => {
    if (!session || !isOAuthReturnRef.current) {
      return;
    }
    isOAuthReturnRef.current = false;

    const pathname = window.location.pathname;
    const stored = consumePostAuthRedirect();

    // The callback route always moves the user off itself.
    if (pathname === AUTH_CALLBACK_PATH) {
      window.location.assign(stored ?? "/");
      return;
    }

    // Elsewhere, only redirect when the user explicitly asked to return there.
    if (stored && stored !== pathname) {
      window.location.assign(stored);
    }
  }, [session]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: "google" | "facebook") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
        },
      });
      if (error) throw error;
    },
    [],
  );

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
      },
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithOAuth,
        signInWithOtp,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
