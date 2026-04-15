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
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";
import { t } from "@/locales/i18n";

export function PromotionCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [minSlots, setMinSlots] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

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
          resource: "promotions",
          data: {
            name: name.trim(),
            slogan: slogan.trim(),
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            currency: "PLN",
            min_order_amount: minOrderAmount
              ? parseFloat(minOrderAmount)
              : null,
            min_slots: minSlots ? parseInt(minSlots, 10) : null,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
            is_active: false,
          },
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }

      navigate("/admin/promotions");
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
          onClick={() => navigate("/admin/promotions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("admin.labels.newPromotion")}</h1>
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
              <Label htmlFor="name">{t("admin.labels.promotionName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Spring Sale"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">{t("admin.labels.promotionSlogan")}</Label>
              <Input
                id="slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                required
                placeholder="e.g. Spring Sale -20%!"
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
                <Label htmlFor="minSlots">{t("admin.labels.minSlots")}</Label>
                <Input
                  id="minSlots"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="No minimum"
                  value={minSlots}
                  onChange={(e) => setMinSlots(e.target.value)}
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("admin.actions.creating")
                  : t("admin.labels.createPromotion")}
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
