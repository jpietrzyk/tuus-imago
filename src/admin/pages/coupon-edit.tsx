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
  created_at: string;
};

export function CouponEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateCoupon } = useUpdate();

  const { query: couponQuery, result: coupon } = useOne<Coupon>({
    resource: "coupons",
    id: id ?? "",
  });

  const [code, setCode] = useState(() => coupon?.code ?? "");
  const [description, setDescription] = useState(() => coupon?.description ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">(() => coupon?.discount_type ?? "percentage");
  const [discountValue, setDiscountValue] = useState(() => coupon ? String(coupon.discount_value) : "");
  const [minOrderAmount, setMinOrderAmount] = useState(() => coupon?.min_order_amount ? String(coupon.min_order_amount) : "");
  const [maxUses, setMaxUses] = useState(() => coupon?.max_uses ? String(coupon.max_uses) : "");
  const [validFrom, setValidFrom] = useState(() => coupon?.valid_from ? coupon.valid_from.slice(0, 16) : "");
  const [validUntil, setValidUntil] = useState(() => coupon?.valid_until ? coupon.valid_until.slice(0, 16) : "");
  const [isActive, setIsActive] = useState(() => coupon?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    return <div className="text-center py-12 text-muted-foreground">Coupon not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/coupons")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Coupon</h1>
        <Badge variant={coupon.is_active ? "default" : "secondary"} className="ml-2">
          {coupon.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 text-sm text-muted-foreground">
            Used <span className="font-medium">{coupon.used_count}</span> time{coupon.used_count !== 1 ? "s" : ""}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">Coupon updated.</div>}

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/coupons")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
