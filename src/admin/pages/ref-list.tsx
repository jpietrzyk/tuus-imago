import { useTable } from "@refinedev/react-table";
import { useList, useCreate, useDelete } from "@refinedev/core";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { CrudFilter } from "@refinedev/core";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";

type RefRow = {
  id: string;
  partner_id: string;
  ref_code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

export function RefListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("__all__");
  const [activeFilter, setActiveFilter] = useState("__all__");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRefCode, setNewRefCode] = useState("");
  const [newRefLabel, setNewRefLabel] = useState("");
  const [newRefPartnerId, setNewRefPartnerId] = useState("__none__");
  const [newRefSaving, setNewRefSaving] = useState(false);

  const { mutateAsync: createRef } = useCreate();
  const { mutateAsync: deleteRef } = useDelete();

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 500 },
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
      f.push({ field: "ref_code", operator: "contains", value: search.trim() });
    }
    if (partnerFilter !== "__all__") {
      f.push({ field: "partner_id", operator: "eq", value: partnerFilter });
    }
    if (activeFilter !== "__all__") {
      f.push({
        field: "is_active",
        operator: "eq",
        value: activeFilter === "true",
      });
    }
    return f;
  }, [search, partnerFilter, activeFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<RefRow, any>[]>(
    () => [
      {
        id: "ref_code",
        accessorKey: "ref_code",
        header: ({ column }: { column: Column<RefRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.partnerRefCode")}
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
        id: "label",
        accessorKey: "label",
        header: t("admin.labels.partnerRefLabel"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "partner_id",
        accessorKey: "partner_id",
        header: t("admin.labels.refPartner"),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const pid = getValue() as string | null;
          if (!pid) return <span className="text-muted-foreground">—</span>;
          return (
            <button
              className="text-primary hover:underline text-left"
              onClick={() => navigate(`/admin/partners/${pid}`)}
            >
              {partnerLookup.get(pid) ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </button>
          );
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
      {
        id: "created_at",
        accessorKey: "created_at",
        header: ({ column }: { column: Column<RefRow> }) => (
          <div className="flex items-center gap-1">
            {t("admin.labels.date")}
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) =>
          formatDateTime(getValue() as string),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: RefRow } }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRef(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [partnerLookup, navigate],
  );

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "partner_refs",
      filters: {
        permanent: filters,
      },
      sorters: {
        permanent: [{ field: "created_at", order: "desc" }],
      },
      pagination: { pageSize: 25 },
    },
  });

  const handleAddRef = useCallback(async () => {
    if (!newRefCode.trim()) return;
    setNewRefSaving(true);
    try {
      await createRef({
        resource: "partner_refs",
        values: {
          ref_code: newRefCode.trim(),
          label: newRefLabel.trim() || null,
          partner_id: newRefPartnerId === "__none__" ? null : newRefPartnerId,
          is_active: true,
        },
      });
      setNewRefCode("");
      setNewRefLabel("");
      setNewRefPartnerId("__none__");
      setAddDialogOpen(false);
    } catch {
      // error handled by refine
    } finally {
      setNewRefSaving(false);
    }
  }, [newRefCode, newRefLabel, newRefPartnerId, createRef]);

  const handleDeleteRef = useCallback(async (refId: string) => {
    if (!confirm(t("admin.labels.refDeleteConfirm"))) return;
    try {
      await deleteRef({ resource: "partner_refs", id: refId });
    } catch {
      // error handled by refine
    }
  }, [deleteRef]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.labels.refListTitle")}</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("admin.labels.newRef")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder={t("admin.labels.refSearchCode")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-52">
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t("admin.labels.noPartner")}
              </SelectItem>
              {(partnersResult?.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <DataTable table={table} />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.labels.createRef")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {t("admin.labels.partnerRefCode")} *
              </label>
              <Input
                value={newRefCode}
                onChange={(e) => setNewRefCode(e.target.value)}
                placeholder="e.g. partner-name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("admin.labels.partnerRefLabel")}
              </label>
              <Input
                value={newRefLabel}
                onChange={(e) => setNewRefLabel(e.target.value)}
                placeholder={t("admin.labels.partnerRefLabelPlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("admin.labels.refPartner")}
              </label>
              <Select value={newRefPartnerId} onValueChange={setNewRefPartnerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t("admin.labels.noPartner")}
                  </SelectItem>
                  {(partnersResult?.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              {t("admin.actions.cancel")}
            </Button>
            <Button
              onClick={handleAddRef}
              disabled={!newRefCode.trim() || newRefSaving}
            >
              {newRefSaving ? t("admin.actions.saving") : t("admin.actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
