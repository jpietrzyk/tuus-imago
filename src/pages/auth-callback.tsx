import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { Loader2 } from "lucide-react";

const CHECKOUT_OAUTH_REDIRECT_FLAG = "checkout-oauth-redirect";

function getPostAuthRedirectPath(): string {
  const checkoutRedirect = sessionStorage.getItem(CHECKOUT_OAUTH_REDIRECT_FLAG);
  if (checkoutRedirect) {
    sessionStorage.removeItem(CHECKOUT_OAUTH_REDIRECT_FLAG);
    return "/checkout";
  }
  return "/";
}

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (error) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate(getPostAuthRedirectPath(), { replace: true });
          return;
        }
        console.error("Auth callback error:", error.message);
        navigate("/auth?error=callback_failed", { replace: true });
        return;
      }

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
