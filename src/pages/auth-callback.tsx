import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import {
  AUTH_CALLBACK_PATH,
  clearPostAuthRedirect,
} from "@/lib/post-auth-redirect";
import { Loader2 } from "lucide-react";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  // One-shot guard so the effect body runs once even when React StrictMode
  // double-invokes effects in development.
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (error) {
          console.error("Auth callback exchange error:", error.message);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // A failed callback must not leave a stale return path behind.
        clearPostAuthRedirect();
        navigate("/auth?error=callback_failed", { replace: true });
        return;
      }

      // On success the post-auth redirect is owned by AuthProvider, which
      // handles it for every landing route (including this one).
      window.history.replaceState({}, document.title, AUTH_CALLBACK_PATH);
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-gray-600 text-sm">Signing you in...</p>
    </div>
  );
}
