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
import { Plus, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CrudFilter } from "@refinedev/core";
import { t } from "@/locales/i18n";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

type PromotionRow = {
  id: string;
  name: string;
  slogan: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_order_amount: number | null;
  min_slots: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
};

export function PromotionListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("__all__");
  const [exporting, setExporting] = useState(false);

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({ field: "name", operator: "contains", value: search.trim() });
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
  const columns = useMemo<ColumnDef<PromotionRow, any>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }: { column: Column<PromotionRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.promotionName")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: "slogan",
        accessorKey: "slogan",
        header: t("admin.labels.promotionSlogan"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span className="text-sm text-muted-foreground max-w-40 truncate inline-block">
            {getValue() as string}
          </span>
        ),
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
        cell: ({ row }: { row: { original: PromotionRow } }) =>
          row.original.discount_type === "percentage"
            ? `${row.original.discount_value}%`
            : `${Number(row.original.discount_value).toFixed(2)} PLN`,
      },
      {
        id: "min_slots",
        accessorKey: "min_slots",
        header: t("admin.labels.minSlots"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as number | null;
          return val ? `${val}` : "—";
        },
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: t("admin.labels.status"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue() ? t("admin.labels.promotionActive") : t("admin.labels.promotionInactive")}
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
    [],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "promotions",
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
          resource: "promotions",
          meta: { export: true },
        }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = new Blob([await response.text()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `promotions-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <h1 className="text-3xl font-bold">{t("admin.labels.promotions")}</h1>
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
          <Button onClick={() => navigate("/admin/promotions/new")}>
            <Plus className="h-4 w-4 mr-2" /> {t("admin.labels.newPromotion")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder={t("admin.labels.promotionSearchName")}
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
              <SelectItem value="__all__">{t("admin.labels.partnerAllStatus")}</SelectItem>
              <SelectItem value="true">{t("admin.labels.promotionActive")}</SelectItem>
              <SelectItem value="false">{t("admin.labels.promotionInactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable table={table} onRowClick={(row) => navigate(`/admin/promotions/${row.id}`)} />
    </div>
  );
}
