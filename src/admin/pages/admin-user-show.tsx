import { useCustom, useUpdate } from "@refinedev/core";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { ArrowLeft, Mail, Shield, ShieldOff, Pencil, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

type UserRecord = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function unwrapUser(raw: unknown): UserRecord | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    const inner = (raw as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner[0] ?? null;
  }
  return null;
}

function unwrapUsers(raw: unknown): UserRecord[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as UserRecord[];
  }
  return [];
}

export function AdminUserShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string } | undefined)?.from ?? "/admin/users";
  const { mutate: updateProfile } = useUpdate();

  const [editName, setEditName] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState(false);

  const { result, query } = useCustom<UserRecord[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "user_list" },
      },
    },
  });

  const allUsers = unwrapUsers(result.data);
  const user = allUsers.find((u) => u.id === id) ?? unwrapUser(result.data);

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("admin.labels.userNotFound", { id: id ?? "" })}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(backPath)}
          className="mt-4"
        >
          {t("admin.labels.userBackToUsers")}
        </Button>
      </div>
    );
  }

  const isEditing = editName !== null;

  const startEdit = () => {
    setEditName(user.full_name ?? "");
    setEditPhone(user.phone ?? "");
    setEditError(null);
    setEditSuccess(false);
  };

  const cancelEdit = () => {
    setEditName(null);
    setEditPhone(null);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "profiles",
          id: user.id,
          data: {
            full_name: editName!.trim() || null,
            phone: editPhone!.trim() || null,
          },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Update failed");
      }
      user.full_name = editName!.trim() || null;
      user.phone = editPhone!.trim() || null;
      setEditSuccess(true);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = () => {
    const confirmMsg = user.is_admin
      ? t("admin.labels.userConfirmRevokeAdmin", { email: user.email })
      : t("admin.labels.userConfirmGrantAdmin", { email: user.email });
    if (!confirm(confirmMsg)) return;
    setTogglingAdmin(true);
    updateProfile(
      {
        resource: "profiles",
        id: user.id,
        values: { is_admin: !user.is_admin },
      },
      {
        onSuccess: () => {
          user.is_admin = !user.is_admin;
          setTogglingAdmin(false);
        },
        onError: () => setTogglingAdmin(false),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.email}</h1>
          <p className="text-sm text-muted-foreground">
            <Badge variant={user.is_admin ? "default" : "secondary"}>
              {user.is_admin ? t("admin.labels.userAdmin") : t("admin.labels.userUser")}
            </Badge>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> {t("admin.labels.userAccountInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground">{t("admin.labels.email")}</span>
              <p className="font-medium">{user.email}</p>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                {editError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                    {t("admin.labels.userProfileUpdated")}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="editName">{t("admin.labels.userFullName")}</Label>
                  <Input
                    id="editName"
                    value={editName!}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("admin.labels.userFullNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">{t("admin.labels.userPhone")}</Label>
                  <Input
                    id="editPhone"
                    value={editPhone!}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? t("admin.labels.userSaving") : t("admin.labels.userSaveChanges")}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    {t("admin.labels.userCancel")}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1 text-sm">
                  <span className="text-muted-foreground">{t("admin.labels.customerName")}</span>
                  <p className="font-medium">
                    {user.full_name || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <span className="text-muted-foreground">{t("admin.labels.userPhone")}</span>
                  <p className="font-medium">
                    {user.phone || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-3 w-3 mr-1" />
                  {t("admin.labels.userEditUser")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> {t("admin.labels.userRoleAndActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground">{t("admin.labels.userRole")}</span>
              <div className="flex items-center gap-2">
                <Badge variant={user.is_admin ? "default" : "secondary"}>
                  {user.is_admin ? t("admin.labels.userAdmin") : t("admin.labels.userUser")}
                </Badge>
                <Button
                  size="sm"
                  variant={user.is_admin ? "destructive" : "outline"}
                  disabled={togglingAdmin}
                  onClick={handleToggleAdmin}
                >
                  {user.is_admin ? (
                    <>
                      <ShieldOff className="h-3 w-3 mr-1" />
                      {t("admin.labels.userRevoke")}
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      {t("admin.labels.userGrant")}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {t("admin.labels.userCreated")}
              </span>
              <p>{formatDateTime(user.created_at)}</p>
            </div>
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> {t("admin.labels.userLastSignIn")}
              </span>
              <p>
                {user.last_sign_in_at
                  ? formatDateTime(user.last_sign_in_at)
                  : t("admin.labels.userNever")}
              </p>
            </div>
            {user.updated_at && (
              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">{t("admin.labels.userLastUpdated")}</span>
                <p>{formatDateTime(user.updated_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
