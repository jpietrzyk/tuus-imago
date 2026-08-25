import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { t } from "@/locales/i18n";

export function FrameCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await adminFetch("/.netlify/functions/admin-api", {
        method: "POST",
        body: {
          resource: "picture_frames",
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: parseFloat(price),
            currency: "PLN",
            image_url: imageUrl.trim() || null,
            color: color.trim() || null,
            material: material.trim() || null,
            is_active: isActive,
            is_default: isActive && isDefault,
            sort_order: parseInt(sortOrder, 10) || 0,
          },
        },
      });

      navigate("/admin/frames");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold">{t("admin.labels.newFrame")}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.labels.frameName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Oak Classic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.frameDescription")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Solid oak frame with matte finish"
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
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t("admin.labels.frameImageUrl")}</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t("admin.labels.frameColor")}</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#c8a165"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">
                  {t("admin.labels.frameMaterial")}
                </Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. oak wood"
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
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIsActive(next);
                  if (!next) setIsDefault(false);
                }}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">{t("admin.labels.active")}</Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
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
                  ? t("admin.actions.creating")
                  : t("admin.labels.createFrame")}
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
