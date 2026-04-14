import { useOne, useCustom, useCreate, useDelete } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/pricing";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  FileText,
  Tag,
  BarChart3,
  Pencil,
  Link2,
  Plus,
  Trash2,
  Eye,
  QrCode,
} from "lucide-react";
import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";
import { RefQrCodeDialog } from "@/admin/components/ref-qr-code-dialog";

type Partner = {
  id: string;
  company_name: string;
  contact_name: string | null;
  nip: string | null;
  contact_email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PartnerCoupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  used_count: number;
  is_active: boolean;
};

type PartnerStatDetail = {
  partner_id: string;
  coupon_count: number;
  coupons: PartnerCoupon[];
  total_orders: number;
  total_revenue: number;
  last_order_date: string | null;
  ref_count: number;
  refs: PartnerRefWithEvents[];
  total_ref_events: number;
};

type PartnerRefWithEvents = {
  id: string;
  ref_code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  event_count: number;
};

function unwrapData<T>(raw: unknown): T | null {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as Record<string, unknown>).data as T;
  }
  if (raw) return raw as T;
  return null;
}

export function PartnerShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addRefDialogOpen, setAddRefDialogOpen] = useState(false);
  const [newRefCode, setNewRefCode] = useState("");
  const [newRefLabel, setNewRefLabel] = useState("");
  const [newRefSaving, setNewRefSaving] = useState(false);

  const [addCouponDialogOpen, setAddCouponDialogOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscountType, setNewCouponDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [newCouponDiscountValue, setNewCouponDiscountValue] = useState("");
  const [newCouponSaving, setNewCouponSaving] = useState(false);
  const [newCouponError, setNewCouponError] = useState<string | null>(null);

  const [qrDialogCode, setQrDialogCode] = useState<string | null>(null);

  const { query: partnerQuery, result: partner } = useOne<Partner>({
    resource: "partners",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: statsResult, query: statsQuery } = useCustom<PartnerStatDetail>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "partner_stats", groupBy: id },
      },
    },
  });

  const { mutateAsync: createRef } = useCreate();
  const { mutateAsync: deleteRef } = useDelete();

  const stats = unwrapData<PartnerStatDetail>(statsResult.data);

  const handleAddRef = useCallback(async () => {
    if (!newRefCode.trim() || !id) return;
    setNewRefSaving(true);
    try {
      await createRef({
        resource: "partner_refs",
        values: {
          partner_id: id,
          ref_code: newRefCode.trim(),
          label: newRefLabel.trim() || null,
          is_active: true,
        },
      });
      setNewRefCode("");
      setNewRefLabel("");
      setAddRefDialogOpen(false);
      await statsQuery.refetch();
    } catch {
      // error handled by refine
    } finally {
      setNewRefSaving(false);
    }
  }, [newRefCode, newRefLabel, id, createRef, statsQuery.refetch]);

  const handleDeleteRef = useCallback(async (refId: string) => {
    if (!confirm(t("admin.labels.partnerRefDeleteConfirm"))) return;
    try {
      await deleteRef({
        resource: "partner_refs",
        id: refId,
      });
      await statsQuery.refetch();
    } catch {
      // error handled by refine
    }
  }, [deleteRef, statsQuery.refetch]);

  const handleAddCoupon = useCallback(async () => {
    if (!newCouponCode.trim() || !newCouponDiscountValue || !id) return;
    setNewCouponSaving(true);
    setNewCouponError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resource: "coupons",
          data: {
            code: newCouponCode.toUpperCase().trim(),
            discount_type: newCouponDiscountType,
            discount_value: parseFloat(newCouponDiscountValue),
            currency: "PLN",
            is_active: true,
            partner_id: id,
          },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }
      setNewCouponCode("");
      setNewCouponDiscountValue("");
      setNewCouponDiscountType("percentage");
      setAddCouponDialogOpen(false);
      await statsQuery.refetch();
    } catch (err) {
      setNewCouponError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setNewCouponSaving(false);
    }
  }, [newCouponCode, newCouponDiscountType, newCouponDiscountValue, id, statsQuery.refetch]);

  if (partnerQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("admin.labels.partnerNotFound")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/partners")}
          className="mt-4"
        >
          {t("admin.labels.partnerBackToPartners")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/partners")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {partner.company_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(partner.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={partner.is_active ? "default" : "secondary"}>
            {partner.is_active
              ? t("admin.labels.active")
              : t("admin.labels.inactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/partners/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t("admin.actions.edit")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> {t("admin.labels.partnerStatistics")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {stats?.total_orders ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.partnerTotalOrders")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {formatPrice(stats?.total_revenue ?? 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.partnerTotalRevenue")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {stats?.coupon_count ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.partnerCoupons")}
                  </p>
                </div>
              </div>
              {stats?.last_order_date && (
                <p className="text-sm text-muted-foreground mt-3">
                  {t("admin.labels.partnerLastOrder")}{" "}
                  {formatDateTime(stats.last_order_date)}
                </p>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" /> {t("admin.labels.partnerCoupons")} (
                {stats?.coupons?.length ?? 0})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddCouponDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("admin.labels.partnerCouponCreate")}
              </Button>
            </CardHeader>
            <CardContent>
              {!stats?.coupons?.length ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.labels.partnerNoCouponsAssigned")}
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center gap-3 p-2 rounded-md border"
                    >
                      <span className="font-mono font-medium text-sm">
                        {coupon.code}
                      </span>
                      <Badge variant="outline">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `${Number(coupon.discount_value).toFixed(2)} PLN`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t("admin.labels.partnerUsed")} {coupon.used_count}x
                      </span>
                      <Badge
                        variant={coupon.is_active ? "default" : "secondary"}
                        className="ml-auto"
                      >
                        {coupon.is_active
                          ? t("admin.labels.active")
                          : t("admin.labels.inactive")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
             </CardContent>
           </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" /> {t("admin.labels.partnerRefs")} (
                {stats?.refs?.length ?? 0})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddRefDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("admin.actions.create")}
              </Button>
            </CardHeader>
            <CardContent>
              {!stats?.refs?.length ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.labels.partnerNoRefs")}
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.refs.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center gap-3 p-2 rounded-md border"
                    >
                      <span className="font-mono font-medium text-sm">
                        {ref.ref_code}
                      </span>
                      {ref.label && (
                        <span className="text-xs text-muted-foreground">
                          {ref.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {ref.event_count}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => setQrDialogCode(ref.ref_code)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Badge
                        variant={ref.is_active ? "default" : "secondary"}
                      >
                        {ref.is_active
                          ? t("admin.labels.active")
                          : t("admin.labels.inactive")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRef(ref.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {stats.total_ref_events > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("admin.labels.partnerTotalRefEvents")}: {stats.total_ref_events}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
         </div>

        <Dialog open={addRefDialogOpen} onOpenChange={setAddRefDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.labels.partnerRefCreate")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {t("admin.labels.partnerRefCode")} *
                </label>
                <Input
                  value={newRefCode}
                  onChange={(e) => setNewRefCode(e.target.value)}
                  placeholder="e.g. partner-name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("admin.labels.partnerRefLabel")}
                </label>
                <Input
                  value={newRefLabel}
                  onChange={(e) => setNewRefLabel(e.target.value)}
                  placeholder={t("admin.labels.partnerRefLabelPlaceholder")}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddRefDialogOpen(false)}
              >
                {t("admin.actions.cancel")}
              </Button>
              <Button
                onClick={handleAddRef}
                disabled={!newRefCode.trim() || newRefSaving}
              >
                {newRefSaving ? t("admin.actions.saving") : t("admin.actions.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addCouponDialogOpen} onOpenChange={setAddCouponDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.labels.partnerCouponCreate")}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCoupon();
              }}
              className="space-y-4"
            >
              {newCouponError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {newCouponError}
                </div>
              )}
              <div>
                <Label>{t("admin.labels.code")} *</Label>
                <Input
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="e.g. SUMMER20"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("admin.labels.discountType")}</Label>
                  <Select
                    value={newCouponDiscountType}
                    onValueChange={(v) => setNewCouponDiscountType(v as "percentage" | "fixed_amount")}
                  >
                    <SelectTrigger className="mt-1">
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
                <div>
                  <Label>{t("admin.labels.discountValue")} *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newCouponDiscountValue}
                    onChange={(e) => setNewCouponDiscountValue(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddCouponDialogOpen(false)}
                >
                  {t("admin.actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={!newCouponCode.trim() || !newCouponDiscountValue || newCouponSaving}
                >
                  {newCouponSaving ? t("admin.actions.saving") : t("admin.actions.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

         <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> {t("admin.labels.partnerCompany")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">
                  {t("admin.labels.partnerCompany")}:
                </span>{" "}
                {partner.company_name}
              </p>
              {partner.nip && (
                <p>
                  <span className="font-medium">{t("admin.labels.partnerNip")}</span>{" "}
                  {partner.nip}
                </p>
              )}
              {partner.contact_email && (
                <p>
                  <span className="font-medium">
                    {t("admin.labels.email")}:
                  </span>{" "}
                  {partner.contact_email}
                </p>
              )}
              {partner.phone && (
                <p>
                  <span className="font-medium">{t("admin.labels.partnerPhone")}</span>{" "}
                  {partner.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> {t("admin.labels.partnerContact")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {partner.contact_name ? (
                <p>{partner.contact_name}</p>
              ) : (
                <p className="text-muted-foreground">
                  {t("admin.labels.partnerContactName")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> {t("admin.labels.partnerLocation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {partner.address && <p>{partner.address}</p>}
              {partner.city && <p>{partner.city}</p>}
              {!partner.address && !partner.city && (
                <p className="text-muted-foreground">
                  {t("admin.labels.partnerNoAddress")}
                </p>
              )}
            </CardContent>
          </Card>

          {partner.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> {t("admin.labels.partnerNotes")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {partner.notes}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>
                {t("admin.labels.created")} {formatDateTime(partner.created_at)}
              </p>
              <Separator className="my-2" />
              <p>
                {t("admin.labels.partnerUpdated")} {formatDateTime(partner.updated_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <RefQrCodeDialog
        refCode={qrDialogCode ?? ""}
        open={qrDialogCode !== null}
        onOpenChange={(open) => {
          if (!open) setQrDialogCode(null);
        }}
      />
    </div>
  );
}
