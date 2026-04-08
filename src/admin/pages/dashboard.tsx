import { useCustom, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { ShoppingCart, DollarSign, Package, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_email: string;
  total_price: number;
  items_count: number;
  created_at: string;
};

type CountResult = { count: number };
type StatusGroup = { status: string; count: number };
type RevenueResult = { total_price: number };

export function DashboardPage() {
  const navigate = useNavigate();

  const { result: ordersCountResult } = useCustom<CountResult>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "count" },
      },
    },
  });

  const { result: paidOrdersResult } = useCustom<RevenueResult>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: {
          aggregateFunction: "sum",
          aggregate: "total_price",
        },
        data: {},
      },
    },
  });

  const { result: couponsResult } = useList({
    resource: "coupons",
    pagination: { pageSize: 1 },
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const { result: pendingShipmentsResult } = useList({
    resource: "orders",
    pagination: { pageSize: 1 },
    filters: [
      { field: "status", operator: "eq", value: "paid" },
      { field: "shipment_status", operator: "eq", value: "pending_fulfillment" },
    ],
  });

  const { result: recentOrdersResult } = useList<OrderRow>({
    resource: "orders",
    pagination: { pageSize: 10, currentPage: 1 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: { select: "id,order_number,status,customer_email,total_price,items_count,created_at" },
  });

  const { result: statusBreakdownResult } = useCustom<StatusGroup[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "count", groupBy: "status" },
      },
    },
  });

  const totalOrders = ordersCountResult.data?.count ?? 0;
  const totalRevenue = paidOrdersResult.data?.total_price ?? 0;
  const activeCoupons = couponsResult.total ?? 0;
  const pendingShipments = pendingShipmentsResult.total ?? 0;
  const orders = recentOrdersResult.data ?? [];
  const statuses = statusBreakdownResult.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {order.order_number}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-48">
                          {order.customer_email}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.total_price)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders</p>
              ) : (
                statuses.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                    </div>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending_payment: "outline",
    paid: "default",
    cancelled: "destructive",
    refunded: "secondary",
  };

  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
