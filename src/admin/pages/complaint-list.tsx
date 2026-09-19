import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useList } from "@refinedev/core";
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
import { formatDateTime } from "@/lib/format";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { t } from "@/locales/i18n";

type ComplaintRow = {
  id: string;
  name: string;
  email: string;
  order_number: string;
  complaint_type: string;
  status: string;
  created_at: string;
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  new: "admin.labels.complaintStatusNew",
  in_review: "admin.labels.complaintStatusInReview",
  resolved: "admin.labels.complaintStatusResolved",
  rejected: "admin.labels.complaintStatusRejected",
};

function statusVariant(status: string) {
  if (status === "resolved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  if (status === "in_review") return "secondary" as const;
  return "outline" as const;
}

export function ComplaintListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { query, result } = useList<ComplaintRow>({
    resource: "complaints",
    pagination: { pageSize: 100 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  let complaints = result.data ?? [];

  if (search) {
    const q = search.toLowerCase();
    complaints = complaints.filter(
      (complaint) =>
        complaint.email.toLowerCase().includes(q) ||
        complaint.name.toLowerCase().includes(q) ||
        complaint.order_number.toLowerCase().includes(q),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.navigation.complaints")}
        </h1>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.labels.complaintSearch")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-8"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-2.5"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.labels.complaintCreated")}</TableHead>
                  <TableHead>{t("admin.labels.complaintOrderNumber")}</TableHead>
                  <TableHead>{t("admin.labels.complaintName")}</TableHead>
                  <TableHead>{t("admin.labels.complaintEmail")}</TableHead>
                  <TableHead>{t("admin.labels.complaintType")}</TableHead>
                  <TableHead>{t("admin.labels.complaintStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("admin.labels.complaintNoComplaints")}
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/complaints/${complaint.id}`)
                      }
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(complaint.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {complaint.order_number}
                      </TableCell>
                      <TableCell>{complaint.name}</TableCell>
                      <TableCell className="text-sm">
                        {complaint.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {complaint.complaint_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(complaint.status)}>
                          {t(
                            STATUS_LABEL_KEYS[complaint.status] ??
                              "admin.labels.complaintStatusNew",
                          )}
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
