import { useCustom, useUpdate } from "@refinedev/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import {
  Search,
  Shield,
  ShieldOff,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
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

const PAGE_SIZE = 25;

function unwrapData<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

export function AdminUsersPage() {
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const { mutate: updateProfile } = useUpdate();

  const { result: usersResult, query: usersQuery } = useCustom<UserRecord[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "user_list" },
      },
    },
  });

  const allUsers = useMemo(
    () => unwrapData<UserRecord>(usersResult.data),
    [usersResult.data],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)),
    );
  }, [allUsers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleToggleAdmin = (user: UserRecord) => {
    if (toggling) return;
    const confirmMsg = user.is_admin
      ? t("admin.labels.confirmRevokeAdmin", { email: user.email })
      : t("admin.labels.confirmGrantAdmin", { email: user.email });
    if (!confirm(confirmMsg)) return;
    setToggling(user.id);
    updateProfile(
      {
        resource: "profiles",
        id: user.id,
        values: { is_admin: !user.is_admin },
      },
      {
        onSuccess: () => {
          setToggling(null);
          user.is_admin = !user.is_admin;
        },
        onError: () => setToggling(null),
      },
    );
  };

  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setEditName(user.full_name ?? "");
    setEditPhone(user.phone ?? "");
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
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
          id: editUser.id,
          data: {
            full_name: editName.trim() || null,
            phone: editPhone.trim() || null,
          },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Update failed");
      }
      editUser.full_name = editName.trim() || null;
      editUser.phone = editPhone.trim() || null;
      setEditSuccess(true);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (usersQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.labels.userAccounts")}
        </h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {t("admin.labels.users")}
        </span>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.labels.searchByEmailOrName")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.labels.email")}</TableHead>
              <TableHead>{t("admin.labels.name")}</TableHead>
              <TableHead>{t("admin.labels.phone")}</TableHead>
              <TableHead>{t("admin.labels.role")}</TableHead>
              <TableHead>{t("admin.labels.lastSignIn")}</TableHead>
              <TableHead>{t("admin.labels.created")}</TableHead>
              <TableHead className="text-right">{t("admin.labels.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("admin.labels.noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.full_name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.phone || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_admin ? "default" : "secondary"}>
                      {user.is_admin ? t("admin.labels.admin") : t("admin.labels.user")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_sign_in_at
                      ? formatDateTime(user.last_sign_in_at)
                      : t("admin.labels.never")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.is_admin ? "destructive" : "outline"}
                        disabled={toggling === user.id}
                        onClick={() => handleToggleAdmin(user)}
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            {t("admin.labels.revoke")}
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            {t("admin.labels.grant")}
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.pageOf", { page: safePage, total: totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("admin.labels.previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("admin.labels.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.labels.editUser")}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                  {t("admin.labels.profileUpdated")}
                </div>
              )}

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{editUser.email}</p>
                <Badge variant={editUser.is_admin ? "default" : "secondary"}>
                  {editUser.is_admin ? t("admin.labels.admin") : t("admin.labels.user")}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editName">{t("admin.labels.fullName")}</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("admin.labels.fullNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhone">{t("admin.labels.phone")}</Label>
                <Input
                  id="editPhone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.labels.saving") : t("admin.labels.saveChanges")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
                >
                  {t("admin.labels.cancel")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
