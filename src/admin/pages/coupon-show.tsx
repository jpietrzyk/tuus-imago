import { useOne, useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import { ArrowLeft, Tag, Pencil } from "lucide-react";

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
  updated_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

export function CouponShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { query: couponQuery, result: coupon } = useOne<Coupon>({
    resource: "coupons",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 200 },
    sorters: [{ field: "company_name", order: "asc" }],
    queryOptions: { enabled: true },
  });

  const partners = partnersResult?.data ?? [];
  const partnerName = coupon?.partner_id
    ? partners.find((p) => p.id === coupon.partner_id)?.company_name ?? null
    : null;

  if (couponQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("admin.labels.couponNotFound")}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/coupons")}
          className="mt-4"
        >
          {t("admin.labels.couponBackToCoupons")}
        </Button>
      </div>
    );
  }

  const discountLabel =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}%`
      : `${Number(coupon.discount_value).toFixed(2)} ${coupon.currency}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/coupons")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {coupon.code}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(coupon.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={coupon.is_active ? "default" : "secondary"}>
            {coupon.is_active
              ? t("admin.labels.active")
              : t("admin.labels.inactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/coupons/${id}/edit`)}
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
                <Tag className="h-5 w-5" /> {t("admin.labels.couponDiscount")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{discountLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.couponDiscountValue")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {coupon.used_count}
                    {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.couponTimesUsed")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {coupon.min_order_amount
                      ? `${Number(coupon.min_order_amount).toFixed(2)} ${coupon.currency}`
                      : t("admin.labels.noLimit")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.couponMinOrder")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.couponDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.code")}</span>
                <span className="font-mono font-medium">{coupon.code}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.type")}</span>
                <span>{coupon.discount_type === "percentage" ? t("admin.labels.percentage") : t("admin.labels.fixedAmount")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.partner")}</span>
                <span>{partnerName ?? t("admin.labels.noPartner")}</span>
              </div>
              {coupon.description && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">{t("admin.labels.description")}</span>
                    <p className="mt-1">{coupon.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.couponValidity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.validFrom")}</span>
                <span>
                  {coupon.valid_from
                    ? formatDateTime(coupon.valid_from)
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.validUntil")}</span>
                <span>
                  {coupon.valid_until
                    ? formatDateTime(coupon.valid_until)
                    : t("admin.labels.noLimit")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.status")}</span>
                <Badge variant={coupon.is_active ? "default" : "secondary"}>
                  {coupon.is_active
                    ? t("admin.labels.active")
                    : t("admin.labels.inactive")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>
                {t("admin.labels.created")} {formatDateTime(coupon.created_at)}
              </p>
              {coupon.updated_at && (
                <>
                  <Separator className="my-2" />
                  <p>
                    {t("admin.labels.partnerUpdated")} {formatDateTime(coupon.updated_at)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
