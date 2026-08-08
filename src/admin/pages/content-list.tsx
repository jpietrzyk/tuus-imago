import { useTable } from "@refinedev/react-table";
import { type ColumnDef, type Column } from "@tanstack/react-table";
import { DataTable } from "@/components/refine-ui/data-table";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "@/locales/i18n";
import { triggerBuild } from "@/admin/lib/trigger-build";

type ContentPageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  menu_section: "legal" | "payments" | "company";
  menu_order: number;
  last_updated: string | null;
  is_published: boolean;
  updated_at: string;
};

const sectionLabel: Record<ContentPageRow["menu_section"], string> = {
  legal: "admin.labels.contentSectionLegal",
  payments: "admin.labels.contentSectionPayments",
  company: "admin.labels.contentSectionCompany",
};

export function ContentListPage() {
  const navigate = useNavigate();
  const [rebuildState, setRebuildState] = useState<{
    loading: boolean;
    message: string | null;
    error: boolean;
  }>({ loading: false, message: null, error: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<ContentPageRow, any>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }: { column: Column<ContentPageRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.contentTitle")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "slug",
        accessorKey: "slug",
        header: t("admin.labels.contentSlug"),
        cell: ({ getValue }) => (
          <code className="text-xs text-muted-foreground">{getValue() as string}</code>
        ),
      },
      {
        id: "menu_section",
        accessorKey: "menu_section",
        header: t("admin.labels.contentMenuSection"),
        cell: ({ getValue }) => (
          <Badge variant="outline">
            {t(sectionLabel[getValue() as ContentPageRow["menu_section"]])}
          </Badge>
        ),
      },
      {
        id: "menu_order",
        accessorKey: "menu_order",
        header: t("admin.labels.contentMenuOrder"),
        cell: ({ getValue }) => String(getValue() ?? "—"),
      },
      {
        id: "is_published",
        accessorKey: "is_published",
        header: t("admin.labels.status"),
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue()
              ? t("admin.labels.active")
              : t("admin.labels.inactive")}
          </Badge>
        ),
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: ({ column }: { column: Column<ContentPageRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.contentLastUpdated")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? new Date(val).toLocaleDateString("pl-PL") : "—";
        },
      },
    ],
    [],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "content_pages",
      sorters: {
        permanent: [
          { field: "menu_section", order: "asc" },
          { field: "menu_order", order: "asc" },
        ],
      },
      pagination: { pageSize: 50 },
    },
  });

  const handleRebuild = async () => {
    setRebuildState({ loading: true, message: null, error: false });
    const result = await triggerBuild();
    if (result.ok) {
      setRebuildState({ loading: false, message: t("admin.labels.rebuildTriggered"), error: false });
    } else {
      setRebuildState({
        loading: false,
        message: result.statusCode === 500
          ? t("admin.labels.rebuildNotConfigured")
          : t("admin.labels.rebuildFailed"),
        error: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.labels.contentTitle")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRebuild}
          disabled={rebuildState.loading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {rebuildState.loading
            ? t("admin.labels.rebuilding")
            : t("admin.labels.triggerRebuild")}
        </Button>
      </div>

      {rebuildState.message && (
        <div
          className={`rounded-md p-3 text-sm ${
            rebuildState.error
              ? "bg-destructive/10 text-destructive"
              : "bg-green-50 text-green-600"
          }`}
        >
          {rebuildState.message}
        </div>
      )}

      <DataTable
        table={table}
        onRowClick={(row) => navigate(`/admin/content/${row.id}/edit`)}
      />
    </div>
  );
}
