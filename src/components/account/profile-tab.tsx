import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { t } from "@/locales/i18n";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export function ProfileTab() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setFullName((data as ProfileRow).full_name ?? "");
      setPhone((data as ProfileRow).phone ?? "");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", user.id);

    if (error) {
      setMessage("Failed to save profile.");
    } else {
      setMessage("Profile saved.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          {t("account.profile")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>{t("auth.email")}</Label>
            <Input value={user?.email ?? ""} disabled className="bg-gray-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-name">{t("auth.fullName")}</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">{t("account.phone")}</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </div>
          {message && (
            <p
              className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}
            >
              {message}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {t("account.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
