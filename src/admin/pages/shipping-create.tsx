import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { t } from "@/locales/i18n";

function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ShippingCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
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
          resource: "shipping_methods",
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: parseFloat(price),
            currency: "PLN",
            delivery_time: deliveryTime.trim() || null,
            free_shipping_threshold: parseOptionalAmount(freeShippingThreshold),
            is_active: isActive,
            is_default: isActive && isDefault,
            sort_order: parseInt(sortOrder, 10) || 0,
          },
        },
      });

      navigate("/admin/shipping");
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
          onClick={() => navigate("/admin/shipping")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.newShipping")}</h1>
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
              <Label htmlFor="name">{t("admin.labels.shippingName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. InPost Paczkomat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.shippingDescription")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Pickup at a parcel locker"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("admin.labels.shippingPrice")}</Label>
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
              <Label htmlFor="deliveryTime">
                {t("admin.labels.shippingDeliveryTime")}
              </Label>
              <Input
                id="deliveryTime"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g. 1-2 business days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">
                {t("admin.labels.shippingFreeThreshold")}
              </Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.labels.shippingFreeThresholdHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">
                {t("admin.labels.shippingSortOrder")}
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
                  {t("admin.labels.shippingDefault")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.labels.shippingDefaultHint")}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.creating")
                  : t("admin.labels.createShipping")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/shipping")}
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
