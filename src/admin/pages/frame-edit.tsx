import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useOne, useUpdate } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";
import { useFormState } from "@/admin/hooks/use-form-state";

type PictureFrame = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  color: string | null;
  material: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function FrameEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateFrame } = useUpdate();

  const { query: frameQuery, result: frame } = useOne<PictureFrame>({
    resource: "picture_frames",
    id: id ?? "",
  });

  const form = useFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = form.get("name", frame?.name ?? "");
  const description = form.get("description", frame?.description ?? "");
  const price = form.get(
    "price",
    frame?.price != null ? String(frame.price) : "",
  );
  const imageUrl = form.get("image_url", frame?.image_url ?? "");
  const color = form.get("color", frame?.color ?? "");
  const material = form.get("material", frame?.material ?? "");
  const sortOrder = form.get(
    "sort_order",
    frame?.sort_order != null ? String(frame.sort_order) : "0",
  );
  const isActive =
    form.get(
      "is_active",
      frame?.is_active != null ? String(frame.is_active) : "true",
    ) === "true";
  const isDefault =
    form.get(
      "is_default",
      frame?.is_default != null ? String(frame.is_default) : "false",
    ) === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updateFrame(
      {
        resource: "picture_frames",
        id,
        values: {
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          image_url: imageUrl.trim() || null,
          color: color.trim() || null,
          material: material.trim() || null,
          is_active: isActive,
          is_default: isActive && isDefault,
          sort_order: parseInt(sortOrder, 10) || 0,
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

  if (frameQuery.isFetching) {
    return (
      <LoadingSpinner fullPage />
    );
  }

  if (!frame) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("admin.labels.frameNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/frames")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.editFrame")}</h1>
        <Badge
          variant={frame.is_active ? "default" : "secondary"}
          className="ml-2"
        >
          {frame.is_active
            ? t("admin.labels.promotionActive")
            : t("admin.labels.promotionInactive")}
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
                {t("admin.labels.frameUpdated")}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.labels.frameName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => form.set("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.frameDescription")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => form.set("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("admin.labels.framePrice")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => form.set("price", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t("admin.labels.frameImageUrl")}</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => form.set("image_url", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t("admin.labels.frameColor")}</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => form.set("color", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">
                  {t("admin.labels.frameMaterial")}
                </Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => form.set("material", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">
                {t("admin.labels.frameSortOrder")}
              </Label>
              <Input
                id="sortOrder"
                type="number"
                step="1"
                value={sortOrder}
                onChange={(e) => form.set("sort_order", e.target.value)}
              />
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) =>
                  form.set("is_default", String(e.target.checked))
                }
                disabled={!isActive}
                className="h-4 w-4 rounded border-input"
              />
              <div>
                <Label htmlFor="isDefault">
                  {t("admin.labels.frameDefault")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.frameDefaultHint")}
                </p>
              </div>
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
                onClick={() => navigate("/admin/frames")}
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
