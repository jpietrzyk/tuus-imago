import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useList, useUpdate } from "@refinedev/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { t } from "@/locales/i18n";
import { useFormState } from "@/admin/hooks/use-form-state";
import { DEFAULT_DPI_THRESHOLD } from "@/components/image-uploader/image-dpi-rules";

type AppSettingRow = {
  id: string;
  key: string;
  value: string;
  data_type: "boolean" | "integer" | "number" | "string";
  description: string | null;
};

export function SettingsPage() {
  const { result, query } = useList<AppSettingRow>({
    resource: "app_settings",
    pagination: { pageSize: 100 },
  });

  const { mutateAsync: updateSetting } = useUpdate();

  const rows = result?.data ?? [];
  const guardRow = rows.find((r) => r.key === "dpi_guard");
  const thresholdRow = rows.find((r) => r.key === "dpi_threshold");

  const form = useFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const guardEnabled =
    form.get(
      "dpi_guard",
      guardRow ? (guardRow.value === "true" ? "true" : "false") : "true",
    ) === "true";
  const threshold = form.get(
    "dpi_threshold",
    thresholdRow ? thresholdRow.value : String(DEFAULT_DPI_THRESHOLD),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const parsedThreshold = parseInt(threshold, 10);
    if (!Number.isFinite(parsedThreshold)) {
      setError(t("admin.labels.dpiThreshold") + ": invalid value");
      setSaving(false);
      return;
    }

    const updates: Promise<unknown>[] = [];
    if (guardRow) {
      updates.push(
        updateSetting({
          resource: "app_settings",
          id: guardRow.id,
          values: { value: guardEnabled ? "true" : "false" },
        }),
      );
    }
    if (thresholdRow) {
      updates.push(
        updateSetting({
          resource: "app_settings",
          id: thresholdRow.id,
          values: { value: String(parsedThreshold) },
        }),
      );
    }

    const results = await Promise.allSettled(updates);
    setSaving(false);

    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed.length > 0) {
      const reason = failed[0].reason;
      setError(reason instanceof Error ? reason.message : "Update failed");
      await query.refetch();
      return;
    }

    setSuccess(true);
  };

  if (query.isFetching) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">{t("admin.labels.settingsTitle")}</h1>

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
                {t("admin.labels.settingsSaved")}
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1 pr-4">
                <Label htmlFor="dpiGuard">{t("admin.labels.dpiGuard")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.dpiGuardHint")}
                </p>
              </div>
              <Switch
                id="dpiGuard"
                checked={guardEnabled}
                onCheckedChange={(checked) =>
                  form.set("dpi_guard", checked ? "true" : "false")
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dpiThreshold">{t("admin.labels.dpiThreshold")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("admin.labels.dpiThresholdHint")}
              </p>
              <Input
                id="dpiThreshold"
                type="number"
                step="1"
                min="0"
                max="600"
                value={threshold}
                onChange={(e) => form.set("dpi_threshold", e.target.value)}
                disabled={!guardEnabled}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.saving")
                  : t("admin.actions.saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
