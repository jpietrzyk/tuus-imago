import { useCustom } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { Search, X } from "lucide-react";
import { useState } from "react";

type CustomerAggregate = {
  customer_email: string;
  customer_name: string;
  order_count: number;
  total_revenue: number;
  last_order_date: string;
  marketing_consent: boolean;
};

export function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

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

  let customers = result.data ?? [];

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.customer_email.toLowerCase().includes(q) ||
        c.customer_name.toLowerCase().includes(q),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Marketing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found
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
                        {new Date(customer.last_order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.marketing_consent ? "default" : "secondary"}>
                          {customer.marketing_consent ? "Yes" : "No"}
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
