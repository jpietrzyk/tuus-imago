import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { t } from "@/locales/i18n";
import { useAuth } from "@/lib/auth-context";

export function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("auth.backToSignIn")}
        </button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {t("auth.resetPassword")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm"
              >
                {error}
              </div>
            )}
            {sent ? (
              <div className="text-center space-y-4">
                <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                  {t("auth.resetPasswordSent")}
                </div>
                <Link
                  to="/auth"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t("auth.backToSignIn")}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t("auth.resetPasswordDescription")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : null}
                  {t("auth.sendResetLink")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
