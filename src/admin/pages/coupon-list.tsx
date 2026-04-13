import { useTable } from "@refinedev/react-table";
import { useList } from "@refinedev/core";
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
import { t } from "@/locales/i18n";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  partner_id: string | null;
  created_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

export function CouponListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [activeFilter, setActiveFilter] = useState("__all__");
  const [exporting, setExporting] = useState(false);

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 200 },
    sorters: [{ field: "company_name", order: "asc" }],
    queryOptions: { enabled: true },
  });

  const partnerLookup = useMemo(() => {
    const partners = partnersResult?.data ?? [];
    const map = new Map<string, string>();
    for (const p of partners) {
      map.set(p.id, p.company_name);
    }
    return map;
  }, [partnersResult?.data]);

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({ field: "code", operator: "contains", value: search.trim() });
    }
    if (typeFilter !== "__all__") {
      f.push({ field: "discount_type", operator: "eq", value: typeFilter });
    }
    if (activeFilter !== "__all__") {
      f.push({
        field: "is_active",
        operator: "eq",
        value: activeFilter === "true",
      });
    }
    return f;
  }, [search, typeFilter, activeFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<CouponRow, any>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        header: ({ column }: { column: Column<CouponRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.code")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span className="font-mono font-medium">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "partner_id",
        accessorKey: "partner_id",
        header: t("admin.labels.partner"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const pid = getValue() as string | null;
          if (!pid) return <span className="text-muted-foreground">—</span>;
          return (
            <span>
              {partnerLookup.get(pid) ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          );
        },
      },
      {
        id: "discount_type",
        accessorKey: "discount_type",
        header: t("admin.labels.type"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant="outline">
            {getValue() === "percentage" ? "%" : "Fixed"}
          </Badge>
        ),
      },
      {
        id: "discount_value",
        accessorKey: "discount_value",
        header: t("admin.labels.value"),
        cell: ({ row }: { row: { original: CouponRow } }) =>
          row.original.discount_type === "percentage"
            ? `${row.original.discount_value}%`
            : `${Number(row.original.discount_value).toFixed(2)} PLN`,
      },
      {
        id: "used_count",
        accessorKey: "used_count",
        header: t("admin.labels.used"),
        cell: ({ row }: { row: { original: CouponRow } }) => {
          const { used_count, max_uses } = row.original;
          return max_uses ? `${used_count}/${max_uses}` : used_count;
        },
      },
      {
        id: "partner",
        header: t("admin.labels.partner"),
        accessorFn: (row: CouponRow) =>
          row.partner_id ? (partnerLookup.get(row.partner_id) ?? "") : "",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: t("admin.labels.status"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue() ? t("admin.labels.active") : t("admin.labels.inactive")}
          </Badge>
        ),
      },
      {
        id: "valid_until",
        accessorKey: "valid_until",
        header: t("admin.labels.validUntil"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val
            ? new Date(val).toLocaleDateString("pl-PL")
            : t("admin.labels.noLimit");
        },
      },
    ],
    [partnerLookup],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "coupons",
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
          resource: "coupons",
          meta: { export: true },
        }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = new Blob([await response.text()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupons-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <h1 className="text-3xl font-bold">{t("admin.labels.couponTitle")}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1" />
            {exporting ? t("admin.labels.exporting") : t("admin.labels.exportCsv")}
          </Button>
          <Button onClick={() => navigate("/admin/coupons/new")}>
            <Plus className="h-4 w-4 mr-2" /> {t("admin.labels.couponNewCoupon")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder={t("admin.labels.couponSearchCode")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("admin.labels.couponAllTypes")}</SelectItem>
              <SelectItem value="percentage">{t("admin.labels.percentage")}</SelectItem>
              <SelectItem value="fixed_amount">{t("admin.labels.fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("admin.labels.partnerAllStatus")}</SelectItem>
              <SelectItem value="true">{t("admin.labels.active")}</SelectItem>
              <SelectItem value="false">{t("admin.labels.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable table={table} onRowClick={(row) => navigate(`/admin/coupons/${row.id}`)} />
    </div>
  );
}
