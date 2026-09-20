import { useEffect, useState } from "react";
import { useOne } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { getComplaintPhotoThumbnailUrl } from "@/lib/complaint-photos";
import { t } from "@/locales/i18n";

type ComplaintDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  order_number: string;
  order_date: string | null;
  product: string | null;
  complaint_type: string;
  description: string;
  resolution: string | null;
  status: string;
  admin_notes: string | null;
  photos: { url: string; public_id: string }[] | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "new", labelKey: "admin.labels.complaintStatusNew" },
  { value: "in_review", labelKey: "admin.labels.complaintStatusInReview" },
  { value: "resolved", labelKey: "admin.labels.complaintStatusResolved" },
  { value: "rejected", labelKey: "admin.labels.complaintStatusRejected" },
];

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span>{value || "—"}</span>
    </div>
  );
}

export function ComplaintShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { query, result } = useOne<ComplaintDetail>({
    resource: "complaints",
    id: id ?? "",
  });

  const complaint = result;
  const [status, setStatus] = useState("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setAdminNotes(complaint.admin_notes ?? "");
    }
  }, [complaint]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await adminFetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        body: {
          resource: "complaints",
          id,
          data: { status, admin_notes: adminNotes.trim() || null },
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!complaint) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          {t("admin.labels.complaintNoComplaints")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/complaints")}
        >
          {t("admin.labels.complaintBack")}
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
          onClick={() => navigate("/admin/complaints")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {complaint.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {complaint.email} &middot; {formatDateTime(complaint.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.labels.complaintDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label={t("admin.labels.complaintName")}
              value={complaint.name}
            />
            <DetailRow
              label={t("admin.labels.complaintEmail")}
              value={complaint.email}
            />
            <DetailRow
              label={t("admin.labels.complaintPhone")}
              value={complaint.phone}
            />
            <DetailRow
              label={t("admin.labels.complaintAddress")}
              value={complaint.address}
            />
            <DetailRow
              label={t("admin.labels.complaintOrderDate")}
              value={complaint.order_date}
            />
            <DetailRow
              label={t("admin.labels.complaintProduct")}
              value={complaint.product}
            />
            <DetailRow
              label={t("admin.labels.complaintType")}
              value={complaint.complaint_type}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.labels.complaintDescription")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap">{complaint.description}</p>
            {complaint.resolution && (
              <>
                <Separator />
                <div>
                  <p className="font-medium mb-1">
                    {t("admin.labels.complaintResolution")}
                  </p>
                  <p className="whitespace-pre-wrap">{complaint.resolution}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(complaint.photos?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.labels.complaintPhotos")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-4">
              {complaint.photos?.map((photo, index) => (
                <li key={photo.public_id || photo.url}>
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={getComplaintPhotoThumbnailUrl(photo.url, 256)}
                      alt={`${t("admin.labels.complaintPhotos")} ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-32 w-32 rounded-md border border-border object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.labels.complaintAdminNotes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="complaintStatus">
              {t("admin.labels.complaintStatus")}
            </Label>
            <select
              id="complaintStatus"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">
              {t("admin.labels.complaintAdminNotes")}
            </Label>
            <Textarea
              id="adminNotes"
              rows={4}
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
            />
          </div>

          {saved && (
            <p role="status" className="text-sm text-green-700">
              {t("admin.labels.complaintSaved")}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {t("admin.labels.complaintSave")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
