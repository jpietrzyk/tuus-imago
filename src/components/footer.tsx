import {
  RotateCcw,
  Scale,
  ShoppingBag,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { t } from "@/locales/i18n";

interface FooterProps {
  onOpenLegalMenu: () => void;
  showUpload?: boolean;
  onUpload?: () => void;
  isUploadPending?: boolean;
  showCheckout?: boolean;
  onCheckout?: () => void;
  showReset?: boolean;
  onReset?: () => void;
}

export function Footer({
  onOpenLegalMenu,
  showUpload = false,
  onUpload,
  isUploadPending = false,
  showCheckout = false,
  onCheckout,
  showReset = false,
  onReset,
}: FooterProps) {
  return (
    <footer className="w-full h-(--app-shell-bar-height) border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="truncate text-sm text-gray-600 whitespace-nowrap">
              {t("common.copyright", { year: new Date().getFullYear() })}
            </div>

            {showReset && onReset ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 rounded-full px-3 text-xs font-semibold sm:text-sm"
                    aria-label={t("uploader.resetSlots")}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t("uploader.resetShort")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <TriangleAlert
                        className="h-4 w-4 text-destructive"
                        aria-hidden="true"
                      />
                      {t("uploader.resetSlotsConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("uploader.resetSlotsConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("uploader.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={onReset}
                      className="w-full sm:w-auto h-auto min-h-9 whitespace-normal break-words text-center leading-tight"
                    >
                      {t("uploader.resetSlotsConfirmAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>

          <div className="flex justify-center">
            {showCheckout && onCheckout ? (
              <Button
                size="sm"
                className="h-9 gap-2 rounded-full px-4 text-xs font-semibold tracking-[0.01em] shadow-sm sm:text-sm"
                onClick={onCheckout}
                aria-label={t("checkout.openCheckout")}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {t("checkout.openCheckout")}
              </Button>
            ) : showUpload && onUpload ? (
              isUploadPending ? (
                <Button
                  size="sm"
                  disabled
                  className="h-9 gap-2 rounded-full px-4 text-xs font-semibold tracking-[0.01em] shadow-sm sm:text-sm"
                  aria-label={t("uploader.uploading")}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {t("uploader.uploading")}
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      className="h-9 gap-2 rounded-full px-4 text-xs font-semibold tracking-[0.01em] shadow-sm sm:text-sm"
                      aria-label={t("uploader.uploadSelectedSlots")}
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      {t("uploader.uploadSelectedSlots")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("uploader.uploadSelectedSlotsConfirmTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("uploader.uploadSelectedSlotsConfirmDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("uploader.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={onUpload}>
                        {t("uploader.uploadSelectedSlotsConfirmAction")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-full px-3 text-xs sm:text-sm"
              onClick={onOpenLegalMenu}
              aria-label={t("common.legalMenu")}
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              {t("common.legalMenu")}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
