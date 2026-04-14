import { useOne, useUpdate, useList } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";

type RefRecord = {
  id: string;
  partner_id: string | null;
  ref_code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

function useRefFormState() {
  const [dirty, setDirty] = useState<Record<string, string>>({});

  const get = (field: string, fallback: string): string => {
    if (field in dirty) return dirty[field];
    return fallback;
  };

  const set = (field: string, value: string) => {
    setDirty((prev) => ({ ...prev, [field]: value }));
  };

  return { get, set };
}

export function RefEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateRef } = useUpdate();

  const { query: refQuery, result: refRecord } = useOne<RefRecord>({
    resource: "partner_refs",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 500 },
    sorters: [{ field: "company_name", order: "asc" }],
  });

  const partners = partnersResult?.data ?? [];

  const form = useRefFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const label = form.get("label", refRecord?.label ?? "");
  const isActive =
    form.get(
      "is_active",
      refRecord?.is_active != null ? String(refRecord.is_active) : "true",
    ) === "true";
  const partnerId = form.get("partner_id", refRecord?.partner_id ?? "__none__");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updateRef(
      {
        resource: "partner_refs",
        id,
        values: {
          label: label.trim() || null,
          is_active: isActive,
          partner_id: partnerId === "__none__" ? null : partnerId,
        },
      },
      {
        onSuccess: () => {
          setSaving(false);
          setSuccess(true);
        },
        onError: (err) => {
          setError(err?.message ?? "Update failed");
          setSaving(false);
        },
      },
    );
  };

  if (refQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!refRecord) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("admin.labels.refNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/refs/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.editRef")}</h1>
        <Badge
          variant={refRecord.is_active ? "default" : "secondary"}
          className="ml-2"
        >
          {refRecord.is_active
            ? t("admin.labels.active")
            : t("admin.labels.inactive")}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {t("admin.labels.refUpdated")}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="refCode">{t("admin.labels.partnerRefCode")}</Label>
              <Input
                id="refCode"
                value={refRecord.ref_code}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">{t("admin.labels.partnerRefLabel")}</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => form.set("label", e.target.value)}
                placeholder={t("admin.labels.partnerRefLabelPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.labels.refPartner")}</Label>
              <Select value={partnerId} onValueChange={(v) => form.set("partner_id", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t("admin.labels.noPartner")}
                  </SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) =>
                  form.set("is_active", String(e.target.checked))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">{t("admin.labels.active")}</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.saving")
                  : t("admin.actions.saveChanges")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/refs/${id}`)}
              >
                {t("admin.actions.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
