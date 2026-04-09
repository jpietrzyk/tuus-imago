import { useTable } from "@refinedev/react-table";
import { useCustom } from "@refinedev/core";
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
import { Plus, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CrudFilter } from "@refinedev/core";
import { formatPrice } from "@/lib/pricing";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

type PartnerRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
};

type PartnerStat = {
  partner_id: string;
  company_name: string;
  is_active: boolean;
  coupon_count: number;
  total_orders: number;
  total_revenue: number;
  last_order_date: string | null;
  created_at: string;
};

export function PartnerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("__all__");
  const [exporting, setExporting] = useState(false);

  const { result: statsResult } = useCustom<PartnerStat[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "partners",
        meta: {
          aggregateFunction: "partner_stats",
        },
      },
    },
  });

  const statsMap = useMemo(() => {
    const rawData = statsResult.data;
    let stats: PartnerStat[] = [];
    if (Array.isArray(rawData)) {
      stats = rawData;
    } else if (rawData && typeof rawData === "object" && "data" in rawData) {
      const inner = (rawData as Record<string, unknown>).data;
      stats = Array.isArray(inner) ? (inner as PartnerStat[]) : [];
    }
    const map = new Map<string, PartnerStat>();
    for (const s of stats) {
      map.set(s.partner_id, s);
    }
    return map;
  }, [statsResult.data]);

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({ field: "company_name", operator: "contains", value: search.trim() });
    }
    if (activeFilter !== "__all__") {
      f.push({ field: "is_active", operator: "eq", value: activeFilter === "true" });
    }
    return f;
  }, [search, activeFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<PartnerRow, any>[]>(
    () => [
      {
        id: "company_name",
        accessorKey: "company_name",
        header: ({ column }: { column: Column<PartnerRow> }) => (
          <div className="flex items-center gap-1">
            Company
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }: { row: { original: PartnerRow } }) => (
          <button
            type="button"
            className="font-medium text-left hover:underline"
            onClick={() => navigate(`/admin/partners/${row.original.id}`)}
          >
            {row.original.company_name}
          </button>
        ),
      },
      {
        id: "contact_name",
        accessorKey: "contact_name",
        header: "Contact",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "city",
        accessorKey: "city",
        header: "City",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "coupon_count",
        header: "Coupons",
        accessorFn: (_row: PartnerRow) => {
          const stat = statsMap.get(_row.id);
          return stat?.coupon_count ?? 0;
        },
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span>{getValue() as number}</span>
        ),
      },
      {
        id: "total_orders",
        header: "Orders",
        accessorFn: (_row: PartnerRow) => {
          const stat = statsMap.get(_row.id);
          return stat?.total_orders ?? 0;
        },
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span>{getValue() as number}</span>
        ),
      },
      {
        id: "total_revenue",
        header: "Revenue",
        accessorFn: (_row: PartnerRow) => {
          const stat = statsMap.get(_row.id);
          return stat?.total_revenue ?? 0;
        },
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span>{formatPrice(getValue() as number)}</span>
        ),
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: "Status",
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue() ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [statsMap, navigate],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "partners",
      filters: {
        permanent: filters,
      },
      sorters: {
        permanent: [{ field: "created_at", order: "desc" }],
      },
      pagination: { pageSize: 25 },
    },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "partners",
          meta: { export: true },
        }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = new Blob([await response.text()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `partners-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Partners</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button onClick={() => navigate("/admin/partners/new")}>
            <Plus className="h-4 w-4 mr-2" /> New Partner
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable table={table} />
    </div>
  );
}
