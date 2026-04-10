import { Badge } from "@/components/ui/badge";
import { t } from "@/locales/i18n";

const ORDER_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_payment: "outline",
  paid: "default",
  cancelled: "destructive",
  refunded: "secondary",
};

const PAYMENT_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  registered: "secondary",
  verified: "default",
  failed: "destructive",
};

const SHIPMENT_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_fulfillment: "outline",
  in_transit: "default",
  delivered: "secondary",
  failed_delivery: "destructive",
  returned: "destructive",
};

const ORDER_LABELS: Record<string, string> = {
  pending_payment: t("admin.statuses.order.pending_payment"),
  paid: t("admin.statuses.order.paid"),
  cancelled: t("admin.statuses.order.cancelled"),
  refunded: t("admin.statuses.order.refunded"),
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: t("admin.statuses.payment.pending"),
  registered: t("admin.statuses.payment.registered"),
  verified: t("admin.statuses.payment.verified"),
  failed: t("admin.statuses.payment.failed"),
};

const SHIPMENT_LABELS: Record<string, string> = {
  pending_fulfillment: t("admin.statuses.shipment.pending_fulfillment"),
  in_transit: t("admin.statuses.shipment.in_transit"),
  delivered: t("admin.statuses.shipment.delivered"),
  failed_delivery: t("admin.statuses.shipment.failed_delivery"),
  returned: t("admin.statuses.shipment.returned"),
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? "secondary"}>
      {ORDER_LABELS[status] ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status] ?? "secondary"}>
      {PAYMENT_LABELS[status] ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export function ShipmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={SHIPMENT_STATUS_VARIANTS[status] ?? "secondary"}>
      {(SHIPMENT_LABELS[status] ?? status).replace(/_/g, " ")}
    </Badge>
  );
}

export {
  SHIPMENT_LABELS,
  ORDER_STATUS_VARIANTS,
  PAYMENT_STATUS_VARIANTS,
  SHIPMENT_STATUS_VARIANTS,
};
