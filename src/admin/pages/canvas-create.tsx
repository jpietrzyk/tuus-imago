import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { t } from "@/locales/i18n";

export function CanvasCreatePage() {
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
          resource: "picture_canvases",
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

      navigate("/admin/canvases");
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
          onClick={() => navigate("/admin/canvases")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.newCanvas")}</h1>
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
              <Label htmlFor="name">{t("admin.labels.canvasName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Classic Matte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.canvasDescription")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Matte cotton canvas with gallery finish"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("admin.labels.canvasPrice")}</Label>
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
              <Label htmlFor="imageUrl">{t("admin.labels.canvasImageUrl")}</Label>
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
                <Label htmlFor="color">{t("admin.labels.canvasColor")}</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#f5f0e6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">
                  {t("admin.labels.canvasMaterial")}
                </Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. cotton"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">
                {t("admin.labels.canvasSortOrder")}
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
                  {t("admin.labels.canvasDefault")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.canvasDefaultHint")}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.creating")
                  : t("admin.labels.createCanvas")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/canvases")}
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
