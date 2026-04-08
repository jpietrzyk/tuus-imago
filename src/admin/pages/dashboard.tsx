import { useCustom, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ShoppingCart, DollarSign, Package, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { OrderStatusBadge } from "@/admin/components/badges";

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
type RevenueOverTimePoint = { date: string; revenue: number; count: number };
type RevenueByMonthPoint = { month: string; revenue: number; count: number };

const PIE_COLORS = ["#94a3b8", "#3b82f6", "#ef4444", "#a3a3a3"];

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

  const { result: revenueOverTimeResult } = useCustom<RevenueOverTimePoint[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "revenue_over_time", aggregate: "30" },
        data: {},
      },
    },
  });

  const { result: revenueByMonthResult } = useCustom<RevenueByMonthPoint[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "revenue_by_month" },
        data: {},
      },
    },
  });

  const totalOrders = ordersCountResult.data?.count ?? 0;
  const totalRevenue = paidOrdersResult.data?.total_price ?? 0;
  const activeCoupons = couponsResult.total ?? 0;
  const pendingShipments = pendingShipmentsResult.total ?? 0;
  const orders = recentOrdersResult.data ?? [];
  const statuses = statusBreakdownResult.data ?? [];
  const revenueOverTime = revenueOverTimeResult.data ?? [];
  const revenueByMonth = revenueByMonthResult.data ?? [];

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: unknown) => formatPrice(Number(value))}
                    labelFormatter={(label: unknown) => `Date: ${String(label)}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={((props: { name?: string; value?: number }) =>
                      `${String(props.name ?? "").replace(/_/g, " ")} (${props.value ?? 0})`
                    ) as unknown as boolean}
                  >
                    {statuses.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(value: unknown) => String(value).replace(/_/g, " ")} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No monthly data</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: unknown) => formatPrice(Number(value))} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders</p>
              ) : (
                statuses.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={s.status} />
                    </div>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(order.total_price)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
