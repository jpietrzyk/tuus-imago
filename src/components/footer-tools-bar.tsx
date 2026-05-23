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
import { SplitSquareVertical, TriangleAlert } from "lucide-react";
import { UploaderSlotSwitcher } from "@/components/image-uploader/uploader-slot-switcher";
import { UploaderTools, type UploaderProportion } from "@/components/image-uploader/uploader-tools";
import { UploaderEffectsPanelButton } from "@/components/image-uploader/uploader-effects-panel";
import type { SelectedImageItem } from "@/components/image-uploader/image-uploader";

export interface FooterToolsBarProps {
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
  canUpdateEffects: boolean;
  isEditMode: boolean;
  onEnterEditMode: () => void;
}

export function FooterToolsBar({
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
  canUpdateEffects,
  isEditMode,
  onEnterEditMode,
}: FooterToolsBarProps) {
  const splitButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={shouldConfirmSplit ? undefined : onSplitImage}
      disabled={!canSplitImage}
      aria-label={t("uploader.splitSelectedImage")}
      className="h-9 w-9 sm:h-10 sm:w-10 shadow-lg border-2"
    >
      <SplitSquareVertical className="h-4 w-4 sm:h-5 sm:w-5" />
    </Button>
  );

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-1">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
          hidden={isEditMode}
        />
      </div>

      <div className="px-4 py-1">
        <div className="grid grid-cols-3 items-center gap-y-1">
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
                      className="w-full sm:w-auto h-auto min-h-9 whitespace-normal wrap-break-word text-center leading-tight"
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
            <UploaderEffectsPanelButton
              disabled={!canUpdateEffects}
              isEditMode={isEditMode}
              onEnterEditMode={onEnterEditMode}
            />
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
      </div>
    </div>
  );
}
