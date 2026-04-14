import { useOne, useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import { ArrowLeft, Link, Pencil, QrCode } from "lucide-react";
import { useState } from "react";
import { RefQrCodeDialog } from "@/admin/components/ref-qr-code-dialog";

type RefRecord = {
  id: string;
  partner_id: string;
  ref_code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Partner = {
  id: string;
  company_name: string;
};

export function RefShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [qrOpen, setQrOpen] = useState(false);

  const { query: refQuery, result: refRecord } = useOne<RefRecord>({
    resource: "partner_refs",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: partnersResult } = useList<Partner>({
    resource: "partners",
    pagination: { pageSize: 500 },
    sorters: [{ field: "company_name", order: "asc" }],
  });

  const partners = partnersResult?.data ?? [];
  const partnerName = refRecord?.partner_id
    ? partners.find((p) => p.id === refRecord.partner_id)?.company_name ?? null
    : null;

  if (refQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!refRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("admin.labels.refNotFound")}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/refs")}
          className="mt-4"
        >
          {t("admin.labels.refBackToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/refs")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {refRecord.ref_code}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(refRecord.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={refRecord.is_active ? "default" : "secondary"}>
            {refRecord.is_active
              ? t("admin.labels.active")
              : t("admin.labels.inactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            {t("admin.labels.partnerRefCode")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/refs/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t("admin.actions.edit")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" /> {t("admin.labels.refCodeInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold font-mono">
                    {refRecord.ref_code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.partnerRefCode")}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {refRecord.label || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.labels.partnerRefLabel")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.refDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.status")}</span>
                <Badge variant={refRecord.is_active ? "default" : "secondary"}>
                  {refRecord.is_active
                    ? t("admin.labels.active")
                    : t("admin.labels.inactive")}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.refPartner")}</span>
                {refRecord.partner_id ? (
                  <button
                    className="text-primary hover:underline"
                    onClick={() => navigate(`/admin/partners/${refRecord.partner_id}`)}
                  >
                    {partnerName ?? "—"}
                  </button>
                ) : (
                  <span>{t("admin.labels.noPartner")}</span>
                )}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.partnerRefLabel")}</span>
                <span>{refRecord.label || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.refDates")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.created")}</span>
                <span>{formatDateTime(refRecord.created_at)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.labels.updated")}</span>
                <span>{formatDateTime(refRecord.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RefQrCodeDialog
        refCode={refRecord.ref_code}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />
    </div>
  );
}
