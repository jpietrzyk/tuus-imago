import { useTable } from "@refinedev/react-table";
import { type ColumnDef, type Column } from "@tanstack/react-table";
import { DataTable } from "@/components/refine-ui/data-table";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/pricing";
import { Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import type { CrudFilter } from "@refinedev/core";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total_price: number;
  items_count: number;
  payment_status: string;
  shipment_status: string;
  created_at: string;
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_payment: "outline",
  paid: "default",
};

const PAYMENT_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  registered: "secondary",
  verified: "default",
  failed: "destructive",
};

const SHIPMENT_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_fulfillment: "outline",
  in_transit: "secondary",
  delivered: "default",
  failed_delivery: "destructive",
  returned: "destructive",
};

export function OrderListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [paymentFilter, setPaymentFilter] = useState("__all__");

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({ field: "customer_email", operator: "contains", value: search.trim() });
    }
    if (statusFilter !== "__all__") {
      f.push({ field: "status", operator: "eq", value: statusFilter });
    }
    if (paymentFilter !== "__all__") {
      f.push({ field: "payment_status", operator: "eq", value: paymentFilter });
    }
    return f;
  }, [search, statusFilter, paymentFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<OrderRow, any>[]>(
    () => [
      {
        id: "order_number",
        accessorKey: "order_number",
        header: ({ column }: { column: Column<OrderRow> }) => (
          <div className="flex items-center gap-1">
            Order #
            <DataTableSorter column={column} />
          </div>
        ),
        size: 120,
      },
      {
        id: "customer_name",
        accessorKey: "customer_name",
        header: "Customer",
        size: 160,
      },
      {
        id: "customer_email",
        accessorKey: "customer_email",
        header: "Email",
        size: 200,
      },
      {
        id: "total_price",
        accessorKey: "total_price",
        header: ({ column }: { column: Column<OrderRow> }) => (
          <div className="flex items-center gap-1">
            Total
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => formatPrice(getValue() as number),
        size: 100,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return <Badge variant={STATUS_VARIANTS[val] ?? "secondary"}>{val.replace(/_/g, " ")}</Badge>;
        },
        size: 130,
      },
      {
        id: "payment_status",
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return <Badge variant={PAYMENT_VARIANTS[val] ?? "secondary"}>{val}</Badge>;
        },
        size: 110,
      },
      {
        id: "shipment_status",
        accessorKey: "shipment_status",
        header: "Shipment",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return <Badge variant={SHIPMENT_VARIANTS[val] ?? "secondary"}>{val.replace(/_/g, " ")}</Badge>;
        },
        size: 140,
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: ({ column }: { column: Column<OrderRow> }) => (
          <div className="flex items-center gap-1">
            Created
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) =>
          new Date(getValue() as string).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        size: 100,
      },
    ],
    [],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "orders",
      filters: {
        permanent: filters,
      },
      sorters: {
        permanent: [{ field: "created_at", order: "desc" }],
      },
      pagination: { pageSize: 25 },
      meta: {
        select:
          "id,order_number,status,customer_name,customer_email,total_price,items_count,payment_status,shipment_status,created_at",
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {(search || statusFilter !== "__all__" || paymentFilter !== "__all__") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("__all__");
              setPaymentFilter("__all__");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <DataTable table={table} />
    </div>
  );
}
