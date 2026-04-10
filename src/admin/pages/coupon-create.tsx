import { useNavigate } from "react-router-dom";
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
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useList } from "@refinedev/core";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";
import { t } from "@/locales/i18n";

type Partner = {
  id: string;
  company_name: string;
};

export function CouponCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [partnerId, setPartnerId] = useState<string>("__none__");

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 200 },
    sorters: [{ field: "company_name", order: "asc" }],
    queryOptions: { enabled: true },
  });

  const partners = partnersResult?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resource: "coupons",
          data: {
            code: code.toUpperCase().trim(),
            description: description.trim() || null,
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            currency: "PLN",
            min_order_amount: minOrderAmount
              ? parseFloat(minOrderAmount)
              : null,
            max_uses: maxUses ? parseInt(maxUses, 10) : null,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
            is_active: isActive,
            partner_id: partnerId === "__none__" ? null : partnerId,
          },
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }

      navigate("/admin/coupons");
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
          onClick={() => navigate("/admin/coupons")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.newCoupon")}</h1>
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
              <Label htmlFor="code">{t("admin.labels.code")}</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="e.g. SUMMER20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin.labels.description")}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.labels.discountType")}</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) =>
                    setDiscountType(v as "percentage" | "fixed_amount")
                  }
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
                  onChange={(e) => setDiscountValue(e.target.value)}
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
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">{t("admin.labels.maxUses")}</Label>
                <Input
                  id="maxUses"
                  type="number"
                  step="1"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
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
                  onChange={(e) => setValidFrom(e.target.value)}
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
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.labels.partner")}</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
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
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">{t("admin.labels.active")}</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.creating")
                  : t("admin.labels.createCoupon")}
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
