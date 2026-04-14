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
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { CrudFilter } from "@refinedev/core";
import { formatPrice } from "@/lib/pricing";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";
import { t } from "@/locales/i18n";

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
  ref_count: number;
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

  const statsMapRef = useRef<Map<string, PartnerStat>>(new Map());

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _statsMap = useMemo(() => {
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
    statsMapRef.current = map;
    return map;
  }, [statsResult.data]);

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({
        field: "company_name",
        operator: "contains",
        value: search.trim(),
      });
    }
    if (activeFilter !== "__all__") {
      f.push({
        field: "is_active",
        operator: "eq",
        value: activeFilter === "true",
      });
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
          <span className="font-medium">
            {row.original.company_name}
          </span>
        ),
      },
      {
        id: "contact_name",
        accessorKey: "contact_name",
        header: t("admin.labels.partnerContact"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "city",
        accessorKey: "city",
        header: t("admin.labels.partnerCity"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "coupon_count",
        header: t("admin.labels.partnerCoupons"),
        cell: ({ row }: { row: { original: PartnerRow } }) => {
          const stat = statsMapRef.current.get(row.original.id);
          return <span>{stat?.coupon_count ?? 0}</span>;
        },
      },
      {
        id: "ref_count",
        header: t("admin.labels.partnerRefs"),
        cell: ({ row }: { row: { original: PartnerRow } }) => {
          const stat = statsMapRef.current.get(row.original.id);
          return <span>{stat?.ref_count ?? 0}</span>;
        },
      },
      {
        id: "total_orders",
        header: t("admin.labels.partnerOrders"),
        cell: ({ row }: { row: { original: PartnerRow } }) => {
          const stat = statsMapRef.current.get(row.original.id);
          return <span>{stat?.total_orders ?? 0}</span>;
        },
      },
      {
        id: "total_revenue",
        header: t("admin.labels.partnerRevenue"),
        cell: ({ row }: { row: { original: PartnerRow } }) => {
          const stat = statsMapRef.current.get(row.original.id);
          return <span>{formatPrice(stat?.total_revenue ?? 0)}</span>;
        },
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: t("admin.labels.partnerStatus"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue() ? t("admin.labels.active") : t("admin.labels.inactive")}
          </Badge>
        ),
      },
    ],
    [],
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
        <h1 className="text-3xl font-bold">{t("admin.labels.partners")}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1" />
            {exporting
              ? t("admin.labels.exporting")
              : t("admin.labels.exportCsv")}
          </Button>
          <Button onClick={() => navigate("/admin/partners/new")}>
            <Plus className="h-4 w-4 mr-2" /> {t("admin.labels.newPartner")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder={t("admin.labels.partnerSearchCompany")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t("admin.labels.partnerAllStatus")}
              </SelectItem>
              <SelectItem value="true">{t("admin.labels.active")}</SelectItem>
              <SelectItem value="false">
                {t("admin.labels.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable table={table} onRowClick={(row) => navigate(`/admin/partners/${row.id}`)} />
    </div>
  );
}
