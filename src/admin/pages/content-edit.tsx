import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useOne, useUpdate } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";
import { useFormState } from "@/admin/hooks/use-form-state";
import { MarkdownEditor } from "@/components/markdown-editor";
import { triggerBuild } from "@/admin/lib/trigger-build";

type ContentPage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  menu_section: "legal" | "payments" | "company";
  menu_order: number;
  last_updated: string | null;
  body: string;
  lang: string;
  is_published: boolean;
};

export function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateContent } = useUpdate();

  const { query: contentQuery, result: content } = useOne<ContentPage>({
    resource: "content_pages",
    id: id ?? "",
  });

  const form = useFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rebuildPromptOpen, setRebuildPromptOpen] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [rebuildError, setRebuildError] = useState(false);

  const title = form.get("title", content?.title ?? "");
  const subtitle = form.get("subtitle", content?.subtitle ?? "");
  const icon = form.get("icon", content?.icon ?? "FileText");
  const menuSection = form.get(
    "menu_section",
    content?.menu_section ?? "legal",
  ) as ContentPage["menu_section"];
  const menuOrder = form.get(
    "menu_order",
    content?.menu_order != null ? String(content.menu_order) : "99",
  );
  const lastUpdated = form.get(
    "last_updated",
    content?.last_updated ?? "",
  );
  const lang = form.get("lang", content?.lang ?? "pl");
  const isPublished =
    form.get(
      "is_published",
      content?.is_published != null ? String(content.is_published) : "true",
    ) === "true";
  const body = form.get("body", content?.body ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updateContent(
      {
        resource: "content_pages",
        id,
        values: {
          title: title.trim(),
          subtitle: subtitle.trim(),
          icon: icon.trim() || "FileText",
          menu_section: menuSection,
          menu_order: parseInt(menuOrder, 10) || 99,
          last_updated: lastUpdated || null,
          lang,
          is_published: isPublished,
          body,
        },
      },
      {
        onSuccess: () => {
          setSaving(false);
          setSuccess(true);
          setRebuildPromptOpen(true);
        },
        onError: (err) => {
          setError(err?.message ?? "Update failed");
          setSaving(false);
        },
      },
    );
  };

  const handleConfirmRebuild = async () => {
    setRebuilding(true);
    setRebuildError(false);
    const result = await triggerBuild();
    setRebuilding(false);
    setRebuildPromptOpen(false);
    if (result.ok) {
      setRebuildMessage(t("admin.labels.rebuildTriggered"));
      setRebuildError(false);
    } else {
      setRebuildMessage(
        result.statusCode === 500
          ? t("admin.labels.rebuildNotConfigured")
          : t("admin.labels.rebuildFailed"),
      );
      setRebuildError(true);
    }
  };

  if (contentQuery.isFetching) {
    return <LoadingSpinner fullPage />;
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("admin.labels.contentNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/content")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.editContent")}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && !rebuildMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {t("admin.labels.settingsSaved")}
              </div>
            )}
            {rebuildMessage && (
              <div
                className={`rounded-md p-3 text-sm ${
                  rebuildError
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {rebuildMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t("admin.labels.contentTitle")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => form.set("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">{t("admin.labels.description")}</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => form.set("subtitle", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">{t("admin.labels.contentSlug")}</Label>
                <Input
                  id="slug"
                  value={content.slug}
                  readOnly
                  aria-readonly
                  className="bg-muted font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.contentSlugHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => form.set("icon", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.labels.contentMenuSection")}</Label>
                <Select
                  value={menuSection}
                  onValueChange={(v) => form.set("menu_section", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">
                      {t("admin.labels.contentSectionLegal")}
                    </SelectItem>
                    <SelectItem value="payments">
                      {t("admin.labels.contentSectionPayments")}
                    </SelectItem>
                    <SelectItem value="company">
                      {t("admin.labels.contentSectionCompany")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menuOrder">
                  {t("admin.labels.contentMenuOrder")}
                </Label>
                <Input
                  id="menuOrder"
                  type="number"
                  step="1"
                  min="0"
                  value={menuOrder}
                  onChange={(e) => form.set("menu_order", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastUpdated">
                  {t("admin.labels.contentLastUpdated")}
                </Label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={lastUpdated}
                  onChange={(e) => form.set("last_updated", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.labels.contentLang")}</Label>
                <Select
                  value={lang}
                  onValueChange={(v) => form.set("lang", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pl">polski</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1 pr-4">
                <Label htmlFor="isPublished">
                  {t("admin.labels.contentPublished")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.contentPublishedHint")}
                </p>
              </div>
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={(checked) =>
                  form.set("is_published", String(checked))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">{t("admin.labels.contentBody")}</Label>
              <MarkdownEditor
                textareaId="body"
                value={body}
                onChange={(value) => form.set("body", value)}
              />
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
                onClick={() => navigate("/admin/content")}
              >
                {t("admin.actions.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={rebuildPromptOpen} onOpenChange={setRebuildPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.labels.rebuildPromptTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.labels.rebuildPromptBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rebuilding}>
              {t("admin.labels.notNow")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRebuild} disabled={rebuilding}>
              {rebuilding
                ? t("admin.labels.rebuilding")
                : t("admin.labels.rebuildNow")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
