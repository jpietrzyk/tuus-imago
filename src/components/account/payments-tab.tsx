import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { t } from "@/locales/i18n";
import { getCustomerOrders, type CustomerOrder } from "@/lib/orders-api";
import { formatPrice } from "@/lib/pricing";

const PAYMENT_STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  verified: "default",
  failed: "destructive",
  refunded: "destructive",
};

export function PaymentsTab() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await getCustomerOrders();
      const allOrders = "orders" in data ? data.orders : [];
      setOrders(allOrders.filter((o) => o.payment_provider));
    } catch {
      setError("Could not load payment history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t("account.noPayments")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        {t("account.paymentHistory")}
      </h3>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("account.orderNumber")}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("account.date")}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("account.amount")}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("account.provider")}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("account.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">
                      {order.order_number}
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPrice(order.total_price)}
                    </td>
                    <td className="p-3 text-gray-600">
                      {order.payment_provider ?? "—"}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          PAYMENT_STATUS_COLORS[order.payment_status] ?? "outline"
                        }
                        className="text-xs"
                      >
                        {order.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
