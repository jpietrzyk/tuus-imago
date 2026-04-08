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
  created_at: string;
};

export function CouponListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [activeFilter, setActiveFilter] = useState("__all__");

  const filters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [];
    if (search.trim()) {
      f.push({ field: "code", operator: "contains", value: search.trim() });
    }
    if (typeFilter !== "__all__") {
      f.push({ field: "discount_type", operator: "eq", value: typeFilter });
    }
    if (activeFilter !== "__all__") {
      f.push({ field: "is_active", operator: "eq", value: activeFilter === "true" });
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
            Code
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <span className="font-mono font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: "discount_type",
        accessorKey: "discount_type",
        header: "Type",
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge variant="outline">{getValue() === "percentage" ? "%" : "Fixed"}</Badge>
        ),
      },
      {
        id: "discount_value",
        accessorKey: "discount_value",
        header: "Value",
        cell: ({ row }: { row: { original: CouponRow } }) =>
          row.original.discount_type === "percentage"
            ? `${row.original.discount_value}%`
            : `${Number(row.original.discount_value).toFixed(2)} PLN`,
      },
      {
        id: "used_count",
        accessorKey: "used_count",
        header: "Used",
        cell: ({ row }: { row: { original: CouponRow } }) => {
          const { used_count, max_uses } = row.original;
          return max_uses ? `${used_count}/${max_uses}` : used_count;
        },
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
      {
        id: "valid_until",
        accessorKey: "valid_until",
        header: "Valid Until",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue() as string | null;
          return val ? new Date(val).toLocaleDateString("pl-PL") : "No limit";
        },
      },
    ],
    [],
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Button onClick={() => navigate("/admin/coupons/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Coupon
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-60">
          <Input
            placeholder="Search code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed</SelectItem>
            </SelectContent>
          </Select>
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
