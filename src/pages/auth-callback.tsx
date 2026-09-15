import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { consumePostAuthRedirect } from "@/lib/post-auth-redirect";
import { Loader2 } from "lucide-react";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Consume up-front so a failed callback cannot leave a stale redirect
      // path behind for a later sign-in.
      const redirectPath = consumePostAuthRedirect();

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
        navigate("/auth?error=callback_failed", { replace: true });
        return;
      }

      window.history.replaceState({}, document.title, "/auth/callback");

      navigate(redirectPath ?? "/", { replace: true });
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
