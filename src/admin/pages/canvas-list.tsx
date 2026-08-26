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
import { Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CrudFilter } from "@refinedev/core";
import { t } from "@/locales/i18n";
import { formatPrice } from "@/lib/pricing";

type PictureCanvasRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  color: string | null;
  material: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export function CanvasListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("__all__");

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
  const columns = useMemo<ColumnDef<PictureCanvasRow, any>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }: { column: Column<PictureCanvasRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.canvasName")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }: { row: { original: PictureCanvasRow } }) => (
          <div className="flex items-center gap-2">
            {row.original.image_url ? (
              <img
                src={row.original.image_url}
                alt={row.original.name}
                className="h-8 w-8 rounded object-cover border border-border shrink-0"
              />
            ) : row.original.color ? (
              <span
                aria-hidden="true"
                className="inline-block h-6 w-6 rounded border border-border shrink-0"
                style={{ backgroundColor: row.original.color }}
              />
            ) : null}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "material",
        accessorKey: "material",
        header: t("admin.labels.canvasMaterial"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="text-sm text-muted-foreground">{val}</span>
          ) : (
            "—"
          );
        },
      },
      {
        id: "price",
        accessorKey: "price",
        header: ({ column }: { column: Column<PictureCanvasRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.value")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span className="font-medium">
            {formatPrice(Number(getValue()) || 0)}
          </span>
        ),
      },
      {
        id: "sort_order",
        accessorKey: "sort_order",
        header: ({ column }: { column: Column<PictureCanvasRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.canvasSortOrder")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span>{getValue() as number}</span>
        ),
      },
      {
        id: "is_default",
        accessorKey: "is_default",
        header: t("admin.labels.canvasDefault"),
        cell: ({ getValue }: { getValue: () => unknown }) =>
          getValue() ? (
            <Badge>{t("admin.labels.canvasDefault")}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: t("admin.labels.status"),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue()
              ? t("admin.labels.promotionActive")
              : t("admin.labels.promotionInactive")}
          </Badge>
        ),
      },
    ],
    [],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "picture_canvases",
      filters: {
        permanent: filters,
      },
      sorters: {
        permanent: [{ field: "sort_order", order: "asc" }],
      },
      pagination: { pageSize: 25 },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.labels.canvases")}</h1>
        <Button onClick={() => navigate("/admin/canvases/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("admin.labels.newCanvas")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder={t("admin.labels.canvasSearchName")}
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
              <SelectItem value="true">{t("admin.labels.promotionActive")}</SelectItem>
              <SelectItem value="false">{t("admin.labels.promotionInactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        table={table}
        onRowClick={(row) => navigate(`/admin/canvases/${row.id}`)}
      />
    </div>
  );
}
