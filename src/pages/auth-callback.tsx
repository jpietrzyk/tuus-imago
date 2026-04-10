import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { POST_AUTH_REDIRECT_KEY } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

function getPostAuthRedirectPath(): string {
  const checkoutRedirect = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (checkoutRedirect) {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return "/checkout";
  }
  return "/";
}

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
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
        navigate("/auth?error=callback_failed", { replace: true });
        return;
      }

      window.history.replaceState({}, document.title, "/auth/callback");

      navigate(getPostAuthRedirectPath(), { replace: true });
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
