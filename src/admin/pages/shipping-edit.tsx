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

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  delivery_time: string | null;
  free_shipping_threshold: number | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ShippingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateShipping } = useUpdate();

  const { query: shippingQuery, result: shipping } = useOne<ShippingMethod>({
    resource: "shipping_methods",
    id: id ?? "",
  });

  const form = useFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = form.get("name", shipping?.name ?? "");
  const description = form.get("description", shipping?.description ?? "");
  const price = form.get(
    "price",
    shipping?.price != null ? String(shipping.price) : "",
  );
  const deliveryTime = form.get(
    "delivery_time",
    shipping?.delivery_time ?? "",
  );
  const freeShippingThreshold = form.get(
    "free_shipping_threshold",
    shipping?.free_shipping_threshold != null
      ? String(shipping.free_shipping_threshold)
      : "",
  );
  const sortOrder = form.get(
    "sort_order",
    shipping?.sort_order != null ? String(shipping.sort_order) : "0",
  );
  const isActive =
    form.get(
      "is_active",
      shipping?.is_active != null ? String(shipping.is_active) : "true",
    ) === "true";
  const isDefault =
    form.get(
      "is_default",
      shipping?.is_default != null ? String(shipping.is_default) : "false",
    ) === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updateShipping(
      {
        resource: "shipping_methods",
        id,
        values: {
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          delivery_time: deliveryTime.trim() || null,
          free_shipping_threshold: parseOptionalAmount(freeShippingThreshold),
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

  if (shippingQuery.isFetching) {
    return <LoadingSpinner fullPage />;
  }

  if (!shipping) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("admin.labels.shippingNotFound")}
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">{t("admin.labels.editShipping")}</h1>
        <Badge
          variant={shipping.is_active ? "default" : "secondary"}
          className="ml-2"
        >
          {shipping.is_active
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
                {t("admin.labels.shippingUpdated")}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.labels.shippingName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => form.set("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.shippingDescription")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => form.set("description", e.target.value)}
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
                onChange={(e) => form.set("price", e.target.value)}
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
                onChange={(e) => form.set("delivery_time", e.target.value)}
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
                onChange={(e) =>
                  form.set("free_shipping_threshold", e.target.value)
                }
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
                  ? t("admin.actions.saving")
                  : t("admin.actions.saveChanges")}
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
