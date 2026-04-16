import { useState } from "react";
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
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import UploaderTools from "./uploader-tools";
import {
  UploaderEffectsPanelButton,
  UploaderEffectsPanelContent,
} from "./uploader-effects-panel";
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
  onUpdateEffect: (
    effectName: "brightness" | "contrast",
    value: number,
  ) => void;
  onToggleRemoveBackground: (enabled: boolean) => void;
  onToggleEnhance: (enabled: boolean) => void;
  onResetEffects: () => void;
  activeImageEffects: {
    brightness: number;
    contrast: number;
    removeBackground?: boolean;
    enhance?: boolean;
  } | null;
  canUpdateEffects: boolean;
  isRemoveBackgroundBusy?: boolean;
  isEnhanceBusy?: boolean;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

export function UploaderPreviewToolsPanel({
  slots,
  activeSlotIndex,
  onSelectSlot,
  onSplitImage,
  canSplitImage,
  shouldConfirmSplit,
  onSelectProportion,
  onUpdateEffect,
  onToggleRemoveBackground,
  onToggleEnhance,
  onResetEffects,
  activeImageEffects,
  canUpdateEffects,
  isRemoveBackgroundBusy = false,
  isEnhanceBusy = false,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
  onEditModeChange,
}: UploaderPreviewToolsPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const enterEditMode = () => {
    setIsEditMode(true);
    onEditModeChange?.(true);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    onEditModeChange?.(false);
  };

  const splitButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={shouldConfirmSplit ? undefined : onSplitImage}
      disabled={!canSplitImage}
      aria-label={t("uploader.splitSelectedImage")}
      className="h-12 w-12 sm:h-14 sm:w-14 shadow-lg border-2"
    >
      <SplitSquareVertical className="h-6 w-6 sm:h-7 sm:w-7" />
    </Button>
  );

  return (
    <div className="mx-auto w-full md:w-1/2 rounded-xl border border-border/60 px-2 py-2 sm:px-3 lg:px-3 lg:py-1.5">
      <div className="w-full">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
        />
      </div>

      {isEditMode ? (
        <UploaderEffectsPanelContent
          effects={activeImageEffects}
          onUpdateEffect={onUpdateEffect}
          onToggleRemoveBackground={onToggleRemoveBackground}
          onToggleEnhance={onToggleEnhance}
          onResetEffects={onResetEffects}
          onClose={exitEditMode}
          disabled={!canUpdateEffects}
          isRemoveBackgroundBusy={isRemoveBackgroundBusy}
          isEnhanceBusy={isEnhanceBusy}
        />
      ) : (
        <div className="grid grid-cols-3 items-center gap-y-2 sm:gap-y-3 mt-2 sm:mt-3">
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
              onEnterEditMode={enterEditMode}
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
      )}
    </div>
  );
}

export default UploaderPreviewToolsPanel;
