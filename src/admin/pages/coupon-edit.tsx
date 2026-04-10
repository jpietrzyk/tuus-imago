import { useOne, useUpdate, useList } from "@refinedev/core";
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

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  currency: string;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  partner_id: string | null;
  created_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

function useCouponFormState() {
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

export function CouponEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateCoupon } = useUpdate();

  const { query: couponQuery, result: coupon } = useOne<Coupon>({
    resource: "coupons",
    id: id ?? "",
  });

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 200 },
    sorters: [{ field: "company_name", order: "asc" }],
    queryOptions: { enabled: true },
  });

  const partners = partnersResult?.data ?? [];

  const form = useCouponFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const code = form.get("code", coupon?.code ?? "");
  const description = form.get("description", coupon?.description ?? "");
  const discountType = form.get(
    "discount_type",
    coupon?.discount_type ?? "percentage",
  ) as "percentage" | "fixed_amount";
  const discountValue = form.get(
    "discount_value",
    coupon?.discount_value != null ? String(coupon.discount_value) : "",
  );
  const minOrderAmount = form.get(
    "min_order_amount",
    coupon?.min_order_amount != null ? String(coupon.min_order_amount) : "",
  );
  const maxUses = form.get(
    "max_uses",
    coupon?.max_uses != null ? String(coupon.max_uses) : "",
  );
  const validFrom = form.get(
    "valid_from",
    coupon?.valid_from ? coupon.valid_from.slice(0, 16) : "",
  );
  const validUntil = form.get(
    "valid_until",
    coupon?.valid_until ? coupon.valid_until.slice(0, 16) : "",
  );
  const isActive =
    form.get(
      "is_active",
      coupon?.is_active != null ? String(coupon.is_active) : "true",
    ) === "true";
  const partnerId = form.get("partner_id", coupon?.partner_id ?? "__none__");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updateCoupon(
      {
        resource: "coupons",
        id,
        values: {
          code: code.toUpperCase().trim(),
          description: description.trim() || null,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          valid_from: validFrom || null,
          valid_until: validUntil || null,
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

  if (couponQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Coupon not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/coupons")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.editCoupon")}</h1>
        <Badge
          variant={coupon.is_active ? "default" : "secondary"}
          className="ml-2"
        >
          {coupon.is_active ? t("admin.labels.active") : t("admin.labels.inactive")}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 text-sm text-muted-foreground">
            Used <span className="font-medium">{coupon.used_count}</span> time
            {coupon.used_count !== 1 ? "s" : ""}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                Coupon updated.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => form.set("code", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => form.set("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => form.set("discount_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">
                      Fixed Amount (PLN)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Discount Value</Label>
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
                <Label htmlFor="minOrder">Min Order Amount</Label>
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
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  step="1"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => form.set("max_uses", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => form.set("valid_from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => form.set("valid_until", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Partner</Label>
              <Select
                value={partnerId}
                onValueChange={(v) => form.set("partner_id", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No partner</SelectItem>
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
              <Label htmlFor="isActive">Active</Label>
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
                onClick={() => navigate("/admin/coupons")}
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
