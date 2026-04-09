import { Badge } from "@/components/ui/badge";

const ORDER_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_payment: "outline",
  paid: "default",
  cancelled: "destructive",
  refunded: "secondary",
};

const PAYMENT_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  registered: "secondary",
  verified: "default",
  failed: "destructive",
};

const SHIPMENT_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_fulfillment: "outline",
  in_transit: "default",
  delivered: "secondary",
  failed_delivery: "destructive",
  returned: "destructive",
};

const SHIPMENT_LABELS: Record<string, string> = {
  pending_fulfillment: "Pending Fulfillment",
  in_transit: "In Transit",
  delivered: "Delivered",
  failed_delivery: "Failed Delivery",
  returned: "Returned",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? "secondary"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status] ?? "secondary"}>
      {status.replace(/_/g, " ")}
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

export { SHIPMENT_LABELS, ORDER_STATUS_VARIANTS, PAYMENT_STATUS_VARIANTS, SHIPMENT_STATUS_VARIANTS };
