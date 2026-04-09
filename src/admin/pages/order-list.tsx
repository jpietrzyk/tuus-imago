import { useTable } from "@refinedev/react-table";
import { useList } from "@refinedev/core";
import { type ColumnDef, type Column, type Row } from "@tanstack/react-table";
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
import {
  ORDER_STATUS_VARIANTS,
  PAYMENT_STATUS_VARIANTS,
  SHIPMENT_STATUS_VARIANTS,
} from "@/admin/components/badges";
import { formatPrice } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { getCloudinaryThumbnailUrl } from "@/lib/image-transformations";
import { useNavigate } from "react-router-dom";
import { Search, X, Download, CheckSquare, Square } from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
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

type OrderItemThumbnail = {
  order_id: string;
  transformed_url: string;
  slot_index: number;
};

import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

export function OrderListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [paymentFilter, setPaymentFilter] = useState("__all__");
  const [shipmentFilter, setShipmentFilter] = useState("__all__");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("cancelled");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const prevOrderIdsRef = useRef<string[]>([]);
  const thumbnailMapRef = useRef<Map<string, string>>(new Map());
  const [thumbVersion, setThumbVersion] = useState(0);

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
    if (shipmentFilter !== "__all__") {
      f.push({ field: "shipment_status", operator: "eq", value: shipmentFilter });
    }
    return f;
  }, [search, statusFilter, paymentFilter, shipmentFilter]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((table: { getFilteredRowModel: () => { rows: Row<OrderRow>[] } }) => {
    const rows = table.getFilteredRowModel().rows;
    setSelectedIds((prev) => {
      const allSelected = rows.every((r) => prev.has(r.original.id));
      const next = new Set(prev);
      if (allSelected) {
        for (const r of rows) next.delete(r.original.id);
      } else {
        for (const r of rows) next.add(r.original.id);
      }
      return next;
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<OrderRow, any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }: { table: { getFilteredRowModel: () => { rows: Row<OrderRow>[] } } }) => (
          <button onClick={() => toggleAll(table)} className="p-1">
            {table.getFilteredRowModel().rows.every((r) => selectedIds.has(r.original.id))
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />}
          </button>
        ),
        cell: ({ row }: { row: Row<OrderRow> }) => (
          <button
            onClick={(e) => { e.stopPropagation(); toggleRow(row.original.id); }}
            className="p-1"
          >
            {selectedIds.has(row.original.id)
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />}
          </button>
        ),
        size: 40,
      },
      {
        id: "thumbnail",
        header: "",
        cell: ({ row }: { row: Row<OrderRow> }) => {
          const thumb = thumbnailMapRef.current.get(row.original.id);
          if (!thumb) return <div className="h-9 w-9 rounded bg-muted" />;
          return (
            <img
              src={thumb}
              alt=""
              className="h-9 w-9 rounded object-cover border"
            />
          );
        },
        size: 52,
      },
      {
        id: "order_number",
        accessorKey: "order_number",
        header: ({ column }: { column: Column<OrderRow> }) => (
          <div className="flex items-center gap-1">
            Order #
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row, getValue }: { row: Row<OrderRow>; getValue: () => unknown }) => (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${row.original.id}`); }}
            className="text-blue-600 hover:underline font-medium"
          >
            {getValue() as string}
          </button>
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
          return <Badge variant={ORDER_STATUS_VARIANTS[val] ?? "secondary"}>{val.replace(/_/g, " ")}</Badge>;
        },
        size: 130,
      },
      {
        id: "payment_status",
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return <Badge variant={PAYMENT_STATUS_VARIANTS[val] ?? "secondary"}>{val}</Badge>;
        },
        size: 110,
      },
      {
        id: "shipment_status",
        accessorKey: "shipment_status",
        header: "Shipment",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return <Badge variant={SHIPMENT_STATUS_VARIANTS[val] ?? "secondary"}>{val.replace(/_/g, " ")}</Badge>;
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
          formatDate(getValue() as string),
        size: 100,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, toggleRow, toggleAll, thumbVersion],
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

  const orderIds = useMemo(
    () => {
      const rows: OrderRow[] = table.refineCore.tableQuery?.data?.data ?? [];
      return rows.map((o) => o.id);
    },
    [table.refineCore.tableQuery?.data?.data],
  );

  if (orderIds.length > 0) {
    prevOrderIdsRef.current = orderIds;
  }
  const effectiveOrderIds = orderIds.length > 0 ? orderIds : prevOrderIdsRef.current;

  const { result: thumbnailsResult } = useList<OrderItemThumbnail>({
    resource: "order_items",
    pagination: { pageSize: 100 },
    filters: [{ field: "order_id", operator: "in", value: effectiveOrderIds }],
    meta: { select: "order_id,transformed_url,slot_index" },
    queryOptions: { enabled: effectiveOrderIds.length > 0 },
  });

  const thumbItems = thumbnailsResult.data ?? [];
  const prevThumbLen = useRef(0);
  if (thumbItems.length !== prevThumbLen.current) {
    prevThumbLen.current = thumbItems.length;
    const map = new Map<string, string>();
    for (const item of thumbItems) {
      if (!map.has(item.order_id)) {
        map.set(item.order_id, getCloudinaryThumbnailUrl(item.transformed_url, 36, 36));
      }
    }
    thumbnailMapRef.current = map;
    // defer version bump to avoid setState during render
    queueMicrotask(() => setThumbVersion((v) => v + 1));
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: {
            ids: [...selectedIds],
            status: bulkStatus,
          },
        }),
      });
      const result = (await response.json()) as { data?: { updated: number; failed: number } };
      if (!response.ok) throw new Error("Bulk update failed");
      alert(`Updated ${result.data?.updated ?? 0} orders. Failed: ${result.data?.failed ?? 0}.`);
      setSelectedIds(new Set());
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "orders",
          meta: { export: true, filters, sorters: [{ field: "created_at", order: "desc" }] },
        }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = new Blob([await response.text()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("__all__");
    setPaymentFilter("__all__");
    setShipmentFilter("__all__");
  };

  const hasFilters = search || statusFilter !== "__all__" || paymentFilter !== "__all__" || shipmentFilter !== "__all__";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
          <Download className="h-4 w-4 mr-1" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Mark Paid</SelectItem>
              <SelectItem value="cancelled">Cancel</SelectItem>
              <SelectItem value="refunded">Refund</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkStatusUpdate} disabled={bulkLoading}>
            {bulkLoading ? "Updating..." : "Apply"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

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
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
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
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
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

        <Select value={shipmentFilter} onValueChange={setShipmentFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All shipments</SelectItem>
            <SelectItem value="pending_fulfillment">Pending Fulfillment</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed_delivery">Failed Delivery</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <DataTable table={table} />
    </div>
  );
}
