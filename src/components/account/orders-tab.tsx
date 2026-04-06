import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import { t } from "@/locales/i18n";
import { getCustomerOrders, type CustomerOrder } from "@/lib/orders-api";
import { getCloudinaryThumbnailUrl } from "@/lib/image-transformations";
import { formatPrice } from "@/lib/pricing";
import { ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_payment: "outline",
  paid: "default",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const PAYMENT_STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  verified: "default",
  failed: "destructive",
  refunded: "destructive",
};

export function OrdersTab() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCustomerOrders();
      setOrders("orders" in data ? data.orders : []);
    } catch {
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const found = orders.find((o) => o.id === orderId);
      if (found) setSelectedOrder(found);
    }
  }, [orderId, orders]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchOrders}>
            {t("account.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedOrder) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedOrder(null);
                navigate("/account/orders");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Package className="h-5 w-5 text-blue-600" />
            {selectedOrder.order_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t("account.orderStatus")}</p>
              <Badge variant={STATUS_COLORS[selectedOrder.status] ?? "outline"}>
                {selectedOrder.status}
              </Badge>
            </div>
            <div>
              <p className="text-gray-500">{t("account.paymentStatus")}</p>
              <Badge variant={PAYMENT_STATUS_COLORS[selectedOrder.payment_status] ?? "outline"}>
                {selectedOrder.payment_status}
              </Badge>
            </div>
            <div>
              <p className="text-gray-500">{t("account.date")}</p>
              <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">{t("account.total")}</p>
              <p className="font-semibold">{formatPrice(selectedOrder.total_price)}</p>
              {selectedOrder.discount_amount > 0 && (
                <p className="text-green-600 text-xs">
                  {t("account.discount")}: -{formatPrice(selectedOrder.discount_amount)}
                </p>
              )}
            </div>
          </div>

          {selectedOrder.tracking_number && (
            <div className="text-sm">
              <p className="text-gray-500">{t("account.trackingNumber")}</p>
              <p className="font-mono">{selectedOrder.tracking_number}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500 mb-2">{t("account.items")}</p>
            <div className="space-y-2">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                >
                  <img
                    src={getCloudinaryThumbnailUrl(item.transformed_url, 48, 48)}
                    alt={item.slot_key}
                    className="h-12 w-12 rounded object-cover border"
                  />
                  <span className="text-sm capitalize">{item.slot_key}</span>
                  <a
                    href={item.transformed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm bg-gray-50 p-3 rounded">
            <p className="text-gray-500 mb-1">{t("account.shippingAddress")}</p>
            <p>{selectedOrder.customer_name}</p>
            <p>{selectedOrder.shipping_address}</p>
            <p>
              {selectedOrder.shipping_postal_code} {selectedOrder.shipping_city}
            </p>
            <p>{selectedOrder.shipping_country}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t("account.noOrders")}</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            {t("account.startShopping")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setSelectedOrder(order);
            navigate(`/account/orders/${order.id}`);
          }}
        >
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{order.order_number}</p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-1">
                <Badge variant={STATUS_COLORS[order.status] ?? "outline"} className="text-xs">
                  {order.status}
                </Badge>
                <Badge variant={PAYMENT_STATUS_COLORS[order.payment_status] ?? "outline"} className="text-xs">
                  {order.payment_status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(order.total_price)}</p>
              <p className="text-xs text-gray-500">
                {order.items_count} {order.items_count === 1 ? t("account.item") : t("account.items")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
