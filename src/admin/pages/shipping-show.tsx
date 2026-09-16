import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useOne } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import { ArrowLeft, Pencil, Truck } from "lucide-react";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { useState } from "react";
import { formatPrice } from "@/lib/pricing";

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

export function ShippingShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);

  const { query: shippingQuery, result: shipping } = useOne<ShippingMethod>({
    resource: "shipping_methods",
    id: id ?? "",
    meta: { select: "*" },
  });

  if (shippingQuery.isFetching) {
    return <LoadingSpinner fullPage />;
  }

  if (!shipping) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("admin.labels.shippingNotFound")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/shipping")}
          className="mt-4"
        >
          {t("admin.labels.shippingBackToShipping")}
        </Button>
      </div>
    );
  }

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      await adminFetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        body: {
          resource: "shipping_methods",
          id: shipping.id,
          data: { is_active: !shipping.is_active },
        },
      });
      shippingQuery.refetch();
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
          onClick={() => navigate("/admin/shipping")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{shipping.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(shipping.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {shipping.is_default && (
            <Badge>{t("admin.labels.shippingDefault")}</Badge>
          )}
          <Badge variant={shipping.is_active ? "default" : "secondary"}>
            {shipping.is_active
              ? t("admin.labels.promotionActive")
              : t("admin.labels.promotionInactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={toggling}
          >
            {shipping.is_active
              ? t("admin.labels.deactivatePromotion")
              : t("admin.labels.activatePromotion")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/shipping/${id}/edit`)}
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
                <Truck className="h-5 w-5" />
                {t("admin.labels.shippingDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingName")}
                </span>
                <span className="font-medium">{shipping.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingDescription")}
                </span>
                <span>{shipping.description ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingPrice")}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(shipping.price) || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingDeliveryTime")}
                </span>
                <span>{shipping.delivery_time ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingFreeThreshold")}
                </span>
                <span>
                  {shipping.free_shipping_threshold != null
                    ? formatPrice(Number(shipping.free_shipping_threshold))
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.shippingSortOrder")}
                </span>
                <span>{shipping.sort_order}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>
                {t("admin.labels.created")}{" "}
                {formatDateTime(shipping.created_at)}
              </p>
              {shipping.updated_at && (
                <>
                  <Separator className="my-2" />
                  <p>
                    {t("admin.labels.updated")}{" "}
                    {formatDateTime(shipping.updated_at)}
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
