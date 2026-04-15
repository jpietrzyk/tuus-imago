import { useOne, useUpdate } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";

type Promotion = {
  id: string;
  name: string;
  slogan: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  currency: string;
  min_order_amount: number | null;
  min_slots: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function useFormState() {
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

export function PromotionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updatePromotion } = useUpdate();

  const { query: promotionQuery, result: promotion } = useOne<Promotion>({
    resource: "promotions",
    id: id ?? "",
  });

  const form = useFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = form.get("name", promotion?.name ?? "");
  const slogan = form.get("slogan", promotion?.slogan ?? "");
  const discountType = form.get(
    "discount_type",
    promotion?.discount_type ?? "percentage",
  ) as "percentage" | "fixed_amount";
  const discountValue = form.get(
    "discount_value",
    promotion?.discount_value != null ? String(promotion.discount_value) : "",
  );
  const minOrderAmount = form.get(
    "min_order_amount",
    promotion?.min_order_amount != null ? String(promotion.min_order_amount) : "",
  );
  const minSlots = form.get(
    "min_slots",
    promotion?.min_slots != null ? String(promotion.min_slots) : "",
  );
  const validFrom = form.get(
    "valid_from",
    promotion?.valid_from ? promotion.valid_from.slice(0, 16) : "",
  );
  const validUntil = form.get(
    "valid_until",
    promotion?.valid_until ? promotion.valid_until.slice(0, 16) : "",
  );
  const isActive =
    form.get(
      "is_active",
      promotion?.is_active != null ? String(promotion.is_active) : "false",
    ) === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updatePromotion(
      {
        resource: "promotions",
        id,
        values: {
          name: name.trim(),
          slogan: slogan.trim(),
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
          min_slots: minSlots ? parseInt(minSlots, 10) : null,
          valid_from: validFrom || null,
          valid_until: validUntil || null,
          is_active: isActive,
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

  if (promotionQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("admin.labels.promotionNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/promotions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.editPromotion")}</h1>
        <Badge
          variant={promotion.is_active ? "default" : "secondary"}
          className="ml-2"
        >
          {promotion.is_active ? t("admin.labels.promotionActive") : t("admin.labels.promotionInactive")}
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
                Promotion updated.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.labels.promotionName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => form.set("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">{t("admin.labels.promotionSlogan")}</Label>
              <Input
                id="slogan"
                value={slogan}
                onChange={(e) => form.set("slogan", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.labels.discountType")}</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => form.set("discount_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      {t("admin.labels.percentage")}
                    </SelectItem>
                    <SelectItem value="fixed_amount">
                      {t("admin.labels.fixedAmount")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t("admin.labels.discountValue")}</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={discountValue}
                  onChange={(e) => form.set("discount_value", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrder">
                  {t("admin.labels.minOrderAmount")}
                </Label>
                <Input
                  id="minOrder"
                  type="number"
                  step="0.01"
                  placeholder="No minimum"
                  value={minOrderAmount}
                  onChange={(e) => form.set("min_order_amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSlots">{t("admin.labels.minSlots")}</Label>
                <Input
                  id="minSlots"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="No minimum"
                  value={minSlots}
                  onChange={(e) => form.set("min_slots", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">{t("admin.labels.validFrom")}</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => form.set("valid_from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">
                  {t("admin.labels.validUntil")}
                </Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => form.set("valid_until", e.target.value)}
                />
              </div>
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
                onClick={() => navigate("/admin/promotions")}
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
