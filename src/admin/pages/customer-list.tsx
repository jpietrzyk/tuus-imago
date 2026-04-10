import { useCustom } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { Search, X, Download } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";

type CustomerAggregate = {
  customer_email: string;
  customer_name: string;
  order_count: number;
  total_revenue: number;
  last_order_date: string;
  marketing_consent: boolean;
};

import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

export function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const { query, result } = useCustom<CustomerAggregate[]>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: {
          aggregateFunction: "customer_list",
        },
      },
    },
  });

  const rawData = result.data;
  let customers: CustomerAggregate[] = [];
  if (Array.isArray(rawData)) {
    customers = rawData;
  } else if (rawData && typeof rawData === "object" && "data" in rawData) {
    const inner = (rawData as Record<string, unknown>).data;
    customers = Array.isArray(inner) ? (inner as CustomerAggregate[]) : [];
  }

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.customer_email.toLowerCase().includes(q) ||
        c.customer_name.toLowerCase().includes(q),
    );
  }

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/.netlify/functions/admin-api", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          resource: "customers",
          meta: { export: true },
        }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = new Blob([await response.text()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.labels.customers")}
        </h1>
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
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.labels.searchCustomers")}
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

      {query.isFetching ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.labels.name")}</TableHead>
                  <TableHead>{t("admin.labels.email")}</TableHead>
                  <TableHead className="text-right">
                    {t("admin.labels.orders")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("admin.labels.revenue")}
                  </TableHead>
                  <TableHead>{t("admin.labels.lastOrder")}</TableHead>
                  <TableHead>{t("admin.labels.marketing")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("admin.labels.noCustomersFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow
                      key={customer.customer_email}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/admin/customers/${encodeURIComponent(customer.customer_email)}`,
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {customer.customer_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer.customer_email}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.order_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(customer.total_revenue)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(customer.last_order_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.marketing_consent ? "default" : "secondary"
                          }
                        >
                          {customer.marketing_consent
                            ? t("admin.labels.yes")
                            : t("admin.labels.no")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
