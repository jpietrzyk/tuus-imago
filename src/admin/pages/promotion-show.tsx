import { useOne } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import { ArrowLeft, Megaphone, Pencil } from "lucide-react";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";
import { useState } from "react";

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

export function PromotionShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);

  const { query: promotionQuery, result: promotion, invalidate } = useOne<Promotion>({
    resource: "promotions",
    id: id ?? "",
    meta: { select: "*" },
  });

  if (promotionQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("admin.labels.promotionNotFound")}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/promotions")}
          className="mt-4"
        >
          {t("admin.labels.promotionBackToPromotions")}
        </Button>
      </div>
    );
  }

  const discountLabel =
    promotion.discount_type === "percentage"
      ? `${promotion.discount_value}%`
      : `${Number(promotion.discount_value).toFixed(2)} ${promotion.currency}`;

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          resource: "promotions",
          id: promotion.id,
          data: { is_active: !promotion.is_active },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Update failed");
      }
      invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/promotions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {promotion.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(promotion.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={promotion.is_active ? "default" : "secondary"}>
            {promotion.is_active
              ? t("admin.labels.promotionActive")
              : t("admin.labels.promotionInactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={toggling}
          >
            {promotion.is_active
              ? t("admin.labels.deactivatePromotion")
              : t("admin.labels.activatePromotion")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/promotions/${id}/edit`)}
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
                <Megaphone className="h-5 w-5" /> {t("admin.labels.promotionDiscount")}
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
                    {promotion.min_order_amount
                      ? `${Number(promotion.min_order_amount).toFixed(2)} ${promotion.currency}`
                      : t("admin.labels.noLimit")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.couponMinOrder")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {promotion.min_slots ?? t("admin.labels.noLimit")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.minSlots")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.promotionDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.promotionName")}</span>
                <span className="font-medium">{promotion.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.promotionSlogan")}</span>
                <span>{promotion.slogan}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.type")}</span>
                <span>{promotion.discount_type === "percentage" ? t("admin.labels.percentage") : t("admin.labels.fixedAmount")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.promotionValidity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.validFrom")}</span>
                <span>
                  {promotion.valid_from
                    ? formatDateTime(promotion.valid_from)
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.validUntil")}</span>
                <span>
                  {promotion.valid_until
                    ? formatDateTime(promotion.valid_until)
                    : t("admin.labels.noLimit")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.status")}</span>
                <Badge variant={promotion.is_active ? "default" : "secondary"}>
                  {promotion.is_active
                    ? t("admin.labels.promotionActive")
                    : t("admin.labels.promotionInactive")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>
                {t("admin.labels.created")} {formatDateTime(promotion.created_at)}
              </p>
              {promotion.updated_at && (
                <>
                  <Separator className="my-2" />
                  <p>
                    {t("admin.labels.updated")} {formatDateTime(promotion.updated_at)}
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
