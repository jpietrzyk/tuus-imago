import { AlertTriangle, Camera, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import type { UnprintablePhotoInfo } from "./size-dpi-availability";

interface UnprintablePhotoNoticeProps {
  /** Concrete numbers; null in the rare case they cannot be derived. */
  info: UnprintablePhotoInfo | null;
  onRetakePhoto: () => void;
  onChooseFromGallery: () => void;
}

/**
 * Shown in the painting preview when the active slot's photo cannot be
 * printed in ANY offered size: explains why (with concrete numbers), gives
 * generic hints for obtaining a higher-resolution photo, and offers the two
 * replacement actions. Ordering the slot stays possible only after the user
 * swaps in a printable photo.
 */
export function UnprintablePhotoNotice({
  info,
  onRetakePhoto,
  onChooseFromGallery,
}: UnprintablePhotoNoticeProps) {
  return (
    <div
      role="alert"
      data-testid="unprintable-photo-notice"
      className="w-full space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-amber-900"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">
            {t("uploader.unprintableTitle")}
          </p>
          <p className="break-words text-xs">
            {info
              ? t("uploader.unprintableReason", {
                  width: info.width,
                  height: info.height,
                  dpi: info.dpi,
                  sizeLabel: info.sizeLabel,
                  minWidth: info.minWidth,
                  minHeight: info.minHeight,
                })
              : t("uploader.unprintableReasonGeneric")}
          </p>
        </div>
      </div>

      <ul className="space-y-1 pl-7 text-xs">
        <li className="list-disc">{t("uploader.unprintableTip1")}</li>
        <li className="list-disc">{t("uploader.unprintableTip2")}</li>
        <li className="list-disc">{t("uploader.unprintableTip3")}</li>
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          className="flex-1 gap-2"
          onClick={onRetakePhoto}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {t("uploader.unprintableRetakeCta")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 gap-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          onClick={onChooseFromGallery}
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
          {t("uploader.unprintableChooseCta")}
        </Button>
      </div>
    </div>
  );
}

export default UnprintablePhotoNotice;
