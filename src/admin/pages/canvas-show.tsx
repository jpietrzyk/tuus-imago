import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useOne } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/locales/i18n";
import { ArrowLeft, Image as ImageIcon, Pencil } from "lucide-react";
import { adminFetch } from "@/admin/lib/admin-fetch";
import { useState } from "react";
import { formatPrice } from "@/lib/pricing";

type PictureCanvas = {
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
  updated_at: string;
};

export function CanvasShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);

  const { query: canvasQuery, result: canvas } = useOne<PictureCanvas>({
    resource: "picture_canvases",
    id: id ?? "",
    meta: { select: "*" },
  });

  if (canvasQuery.isFetching) {
    return (
      <LoadingSpinner fullPage />
    );
  }

  if (!canvas) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("admin.labels.canvasNotFound")}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/canvases")}
          className="mt-4"
        >
          {t("admin.labels.canvasBackToCanvases")}
        </Button>
      </div>
    );
  }

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      await adminFetch("/.netlify/functions/admin-api", {
        method: "PATCH",
        body: {
          resource: "picture_canvases",
          id: canvas.id,
          data: { is_active: !canvas.is_active },
        },
      });
      canvasQuery.refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/canvases")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{canvas.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.labels.created")} {formatDateTime(canvas.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {canvas.is_default && (
            <Badge>{t("admin.labels.canvasDefault")}</Badge>
          )}
          <Badge variant={canvas.is_active ? "default" : "secondary"}>
            {canvas.is_active
              ? t("admin.labels.promotionActive")
              : t("admin.labels.promotionInactive")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={toggling}
          >
            {canvas.is_active
              ? t("admin.labels.deactivatePromotion")
              : t("admin.labels.activatePromotion")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/canvases/${id}/edit`)}
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
                <ImageIcon className="h-5 w-5" /> {t("admin.labels.canvasLook")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canvas.image_url ? (
                <img
                  src={canvas.image_url}
                  alt={canvas.name}
                  className="h-32 w-32 rounded-lg object-cover border"
                />
              ) : canvas.color ? (
                <div
                  aria-hidden="true"
                  className="h-32 w-32 rounded-lg border"
                  style={{ backgroundColor: canvas.color }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.canvasDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.canvasName")}
                </span>
                <span className="font-medium">{canvas.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.canvasDescription")}
                </span>
                <span>{canvas.description ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.canvasPrice")}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(canvas.price) || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.canvasMaterial")}
                </span>
                <span>{canvas.material ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.labels.canvasSortOrder")}
                </span>
                <span>{canvas.sort_order}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>
                {t("admin.labels.created")} {formatDateTime(canvas.created_at)}
              </p>
              {canvas.updated_at && (
                <>
                  <Separator className="my-2" />
                  <p>
                    {t("admin.labels.updated")}{" "}
                    {formatDateTime(canvas.updated_at)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
