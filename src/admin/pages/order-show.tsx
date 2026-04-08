import { useOne, useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/pricing";
import { formatDateTime } from "@/lib/format";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ShipmentStatusBadge,
} from "@/admin/components/badges";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Tag,
} from "lucide-react";
import { useState } from "react";

type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_method: string;
  shipping_cost: number;
  total_price: number;
  unit_price: number;
  items_count: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_status: string;
  payment_provider: string | null;
  payment_paid_at: string | null;
  payment_verified_at: string | null;
  shipment_status: string;
  tracking_number: string | null;
  currency: string;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: string;
  slot_key: string;
  slot_index: number;
  transformed_url: string;
  transformations: Record<string, unknown>;
  ai_adjustments: Record<string, unknown> | null;
};

type StatusHistoryEntry = {
  id: string;
  status_type: string;
  status: string;
  note: string;
  created_at: string;
};

type ShipmentStatus =
  | "pending_fulfillment"
  | "in_transit"
  | "delivered"
  | "failed_delivery"
  | "returned";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending_fulfillment: ["in_transit", "failed_delivery", "returned"],
  in_transit: ["delivered", "failed_delivery", "returned"],
  delivered: ["returned"],
  failed_delivery: ["in_transit", "returned"],
  returned: [],
};

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["cancelled", "refunded"],
  cancelled: [],
  refunded: [],
};

const SHIPMENT_LABELS: Record<string, string> = {
  pending_fulfillment: "Pending Fulfillment",
  in_transit: "In Transit",
  delivered: "Delivered",
  failed_delivery: "Failed Delivery",
  returned: "Returned",
};

const ORDER_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

async function getAuthHeaders() {
  const { supabase } = await import("@/lib/supabase-client");
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token}` };
}

export function OrderShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { query: orderQuery, result: order } = useOne<OrderDetail>({
    resource: "orders",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: itemsResult } = useList<OrderItem>({
    resource: "order_items",
    pagination: { pageSize: 100 },
    filters: [{ field: "order_id", operator: "eq", value: id }],
  });

  const { result: historyResult } = useList<StatusHistoryEntry>({
    resource: "order_status_history",
    pagination: { pageSize: 100 },
    filters: [{ field: "order_id", operator: "eq", value: id }],
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const items = itemsResult.data ?? [];
  const history = historyResult.data ?? [];

  if (orderQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const shipmentStatus = order.shipment_status as ShipmentStatus;
  const allowedShipmentTransitions = SHIPMENT_TRANSITIONS[shipmentStatus] ?? [];
  const orderStatus = order.status as OrderStatus;
  const allowedOrderTransitions = ORDER_TRANSITIONS[orderStatus] ?? [];

  const handleOrderStatusUpdate = async (newStatus: OrderStatus) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "orders",
          id: order.id,
          data: { status: newStatus, note: statusNote || undefined },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Update failed");
      }
      setStatusNote("");
      window.location.reload();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleShipmentUpdate = async (newStatus: ShipmentStatus) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "orders",
          id: order.id,
          data: {
            shipment_status: newStatus,
            tracking_number: trackingNumber || order.tracking_number,
          },
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Update failed");
      }
      window.location.reload();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md border">
                      <img
                        src={item.transformed_url}
                        alt={item.slot_key}
                        className="h-16 w-16 rounded object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {item.slot_key} (Slot {item.slot_index + 1})
                        </p>
                        <a
                          href={item.transformed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block"
                        >
                          View full image
                        </a>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPrice(order.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Current:</span>
                <OrderStatusBadge status={order.status} />
              </div>

              {updateError && (
                <div className="text-sm text-destructive">{updateError}</div>
              )}

              {allowedOrderTransitions.length > 0 && (
                <div className="space-y-3">
                  <Input
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional note for status change..."
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {allowedOrderTransitions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() => handleOrderStatusUpdate(status)}
                      >
                        Mark as {ORDER_LABELS[status] ?? status}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Shipment Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Current:</span>
                <ShipmentStatusBadge status={order.shipment_status} />
                {order.tracking_number && (
                  <span className="text-sm text-muted-foreground">
                    Tracking: {order.tracking_number}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Number</label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={order.tracking_number ?? "Enter tracking number"}
                />
              </div>

              {allowedShipmentTransitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedShipmentTransitions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => handleShipmentUpdate(status)}
                    >
                      Mark as {SHIPMENT_LABELS[status] ?? status}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {order.customer_name}</p>
              <p><span className="font-medium">Email:</span> {order.customer_email}</p>
              {order.customer_phone && (
                <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
              )}
              <p><span className="font-medium">Marketing:</span> {order.marketing_consent ? "Yes" : "No"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_postal_code}</p>
              <p>{order.shipping_country}</p>
              <Separator className="my-2" />
              <p><span className="font-medium">Method:</span> {order.shipping_method}</p>
              <p><span className="font-medium">Cost:</span> {formatPrice(order.shipping_cost)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="font-medium">Status:</span> {order.payment_status}</p>
              {order.payment_provider && (
                <p><span className="font-medium">Provider:</span> {order.payment_provider}</p>
              )}
              {order.payment_paid_at && (
                <p><span className="font-medium">Paid:</span> {formatDateTime(order.payment_paid_at)}</p>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span>Subtotal ({order.items_count}x)</span>
                <span>{formatPrice(order.items_count * order.unit_price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {order.coupon_code}
                  </span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total_price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((entry: StatusHistoryEntry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-32 shrink-0 text-muted-foreground text-xs">
                  {formatDateTime(entry.created_at)}
                </div>
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium shrink-0">
                  {entry.status_type}
                </span>
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium shrink-0">
                  {entry.status.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground">{entry.note}</span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground">No history entries</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
