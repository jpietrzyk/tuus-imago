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

export function CouponCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

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
            min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
            max_uses: maxUses ? parseInt(maxUses, 10) : null,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
            is_active: isActive,
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/coupons")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Coupon</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. SUMMER20" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed_amount")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount (PLN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Discount Value</Label>
                <Input id="value" type="number" step="0.01" min="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrder">Min Order Amount</Label>
                <Input id="minOrder" type="number" step="0.01" placeholder="No minimum" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input id="maxUses" type="number" step="1" placeholder="Unlimited" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input id="validFrom" type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Coupon"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/coupons")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
