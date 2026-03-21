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
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { Settings, SplitSquareVertical, TriangleAlert } from "lucide-react";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import UploaderTools from "./uploader-tools";
import type { SelectedImageItem } from "./image-uploader";
import type { UploaderProportion } from "./uploader-tools";

interface UploaderPreviewToolsPanelProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onSplitImage: () => void;
  canSplitImage: boolean;
  shouldConfirmSplit: boolean;
  onSelectProportion: (proportion: UploaderProportion) => void;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
}

export function UploaderPreviewToolsPanel({
  slots,
  activeSlotIndex,
  onSelectSlot,
  onSplitImage,
  canSplitImage,
  shouldConfirmSplit,
  onSelectProportion,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
}: UploaderPreviewToolsPanelProps) {
  const splitButton = (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      onClick={shouldConfirmSplit ? undefined : onSplitImage}
      disabled={!canSplitImage}
      aria-label={t("uploader.splitSelectedImage")}
      className="px-8 py-6 shadow-lg border-2"
    >
      <SplitSquareVertical className="h-10 w-10" />
    </Button>
  );

  return (
    <div className="mx-auto grid w-1/2 grid-cols-3 items-center gap-y-3 rounded-xl border border-border/60 px-3 py-3 sm:px-4">
      <div className="col-span-3 w-full">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
        />
      </div>
      <div className="col-start-1 flex justify-start">
        {shouldConfirmSplit ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>{splitButton}</AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <TriangleAlert
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                  {t("uploader.splitSlotsConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("uploader.splitSlotsConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("uploader.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={onSplitImage}
                  className="w-full sm:w-auto h-auto min-h-9 whitespace-normal break-words text-center leading-tight"
                >
                  {t("uploader.splitSlotsConfirmAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          splitButton
        )}
      </div>
      <div className="col-start-2 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled
          aria-label="Settings (coming soon)"
          className="px-8 py-6 shadow-lg border-2"
        >
          <Settings className="h-10 w-10" />
        </Button>
      </div>
      <div className="col-start-3 flex justify-end">
        <UploaderTools
          onSelectProportion={onSelectProportion}
          coveragePercent={coveragePercent}
          selectedProportion={selectedProportion}
          showCoverageDetails={showCoverageDetails}
        />
      </div>
    </div>
  );
}

export default UploaderPreviewToolsPanel;
