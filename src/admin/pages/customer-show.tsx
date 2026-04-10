import { useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { t } from "@/locales/i18n";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ShipmentStatusBadge,
} from "@/admin/components/badges";
import { ArrowLeft, User, MapPin, Mail } from "lucide-react";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  items_count: number;
  payment_status: string;
  shipment_status: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  marketing_consent: boolean;
  created_at: string;
};

export function CustomerShowPage() {
  const { email: emailParam } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const email = decodeURIComponent(emailParam ?? "");

  const { query, result } = useList<OrderRow>({
    resource: "orders",
    pagination: { pageSize: 100 },
    filters: [{ field: "customer_email", operator: "eq", value: email }],
    sorters: [{ field: "created_at", order: "desc" }],
    meta: {
      select:
        "id,order_number,status,total_price,items_count,payment_status,shipment_status,shipping_address,shipping_city,shipping_postal_code,shipping_country,marketing_consent,created_at",
    },
  });

  const orders = result?.data ?? [];

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("admin.labels.noCustomerFound")} {email}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/customers")}
          className="mt-4"
        >
          {t("admin.labels.backToCustomers")}
        </Button>
      </div>
    );
  }

  const latestOrder = orders[0];
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const hasMarketingConsent = orders.some((o) => o.marketing_consent);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/customers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{email}</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length}{" "}
            {orders.length !== 1
              ? t("admin.labels.orders")
              : t("admin.labels.order")}{" "}
            &middot; {formatPrice(totalSpent)} {t("admin.labels.total")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> {t("admin.labels.customerInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{email}</span>
            </div>
            <div>
              <span className="font-medium">
                {t("admin.labels.marketingConsent")}
              </span>{" "}
              <Badge variant={hasMarketingConsent ? "default" : "secondary"}>
                {hasMarketingConsent
                  ? t("admin.labels.yes")
                  : t("admin.labels.no")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> {t("admin.labels.latestAddress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{latestOrder.shipping_address}</p>
            <p>
              {latestOrder.shipping_city}, {latestOrder.shipping_postal_code}
            </p>
            <p>{latestOrder.shipping_country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.labels.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("admin.labels.totalOrders")}</span>
              <span className="font-medium">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("admin.labels.totalSpent")}</span>
              <span className="font-medium">{formatPrice(totalSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("admin.labels.avgOrderValue")}</span>
              <span className="font-medium">
                {formatPrice(totalSpent / orders.length)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.labels.orders")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.labels.orderNumber")}</TableHead>
                <TableHead>{t("admin.labels.status")}</TableHead>
                <TableHead>{t("admin.labels.payment")}</TableHead>
                <TableHead>{t("admin.labels.shipment")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.labels.total")}
                </TableHead>
                <TableHead>{t("admin.labels.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <TableCell className="font-mono text-sm">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.payment_status} />
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={order.shipment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(order.total_price)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
