import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Download, Trash2 } from "lucide-react";
import { t } from "@/locales/i18n";
import { deleteAccount, exportUserData } from "@/lib/orders-api";

export function DangerZone() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportData = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tuus-imago-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("account.exportDataError"));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      await signOut();
      navigate("/");
    } catch {
      setDeleting(false);
      setDeleteError(t("account.deleteAccountError"));
    }
  };

  return (
    <Card className="border-red-200 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {t("account.dangerZoneTitle")}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {t("account.dangerZoneDescription")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t("account.exportDataTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("account.exportDataDescription")}
            </p>
            {exportError && <p className="text-sm text-red-600 mt-1">{exportError}</p>}
          </div>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
            className="shrink-0"
          >
            {exporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
            {t("account.exportDataButton")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <h3 className="font-medium text-red-800 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t("account.deleteAccountTitle")}
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {t("account.deleteAccountDescription")}
            </p>
            {deleteError && <p className="text-sm text-red-700 mt-1 font-medium">{deleteError}</p>}
          </div>
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="shrink-0"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("account.deleteAccountButton")}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 shrink-0">
              <p className="text-sm font-medium text-red-800">
                {t("account.deleteAccountConfirmTitle")}
              </p>
              <p className="text-xs text-red-600">
                {t("account.deleteAccountConfirmDescription")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {deleting ? t("account.deleteAccountDeleting") : t("account.deleteAccountConfirmButton")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={deleting}
                >
                  {t("account.deleteAccountCancelButton")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
