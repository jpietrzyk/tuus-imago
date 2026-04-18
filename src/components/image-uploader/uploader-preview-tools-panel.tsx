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
import { Check, RotateCcw, SplitSquareVertical, TriangleAlert, X } from "lucide-react";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import UploaderTools from "./uploader-tools";
import {
  UploaderEffectsPanelButton,
  UploaderEffectsPanelContent,
} from "./uploader-effects-panel";
import type { SelectedImageItem } from "./image-uploader";
import type { UploaderProportion } from "./uploader-tools";
import type { CropAdjust } from "./use-crop-adjust";

interface EffectsSnapshot {
  brightness: number;
  contrast: number;
  grayscale: number;
  removeBackground: boolean;
  enhance: boolean;
  upscale: boolean;
  restore: boolean;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  cropAdjust: CropAdjust | undefined;
}

interface UploaderPreviewToolsPanelProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onSplitImage: () => void;
  canSplitImage: boolean;
  shouldConfirmSplit: boolean;
  onSelectProportion: (proportion: UploaderProportion) => void;
  onUpdateEffect: (
    effectName: "brightness" | "contrast" | "grayscale",
    value: number,
  ) => void;
  onToggleRemoveBackground: (enabled: boolean) => void;
  onToggleEnhance: (enabled: boolean) => void;
  onToggleUpscale: (enabled: boolean) => void;
  onToggleRestore: (enabled: boolean) => void;
  onUpdateRotation: (degrees: number) => void;
  onToggleFlipHorizontal: (enabled: boolean) => void;
  onToggleFlipVertical: (enabled: boolean) => void;
  activeImageEffects: {
    brightness: number;
    contrast: number;
    grayscale: number;
    removeBackground?: boolean;
    enhance?: boolean;
    upscale?: boolean;
    restore?: boolean;
  } | null;
  activeImageTransform: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  } | null;
  canUpdateEffects: boolean;
  isRemoveBackgroundBusy?: boolean;
  isEnhanceBusy?: boolean;
  isUpscaleBusy?: boolean;
  isRestoreBusy?: boolean;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
  activeImageCropAdjust?: CropAdjust;
  onUpdateCropAdjust?: (adjust: CropAdjust | undefined) => void;
  isZoomAvailable?: boolean;
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
  onToggleUpscale,
  onToggleRestore,
  onUpdateRotation,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
  activeImageEffects,
  activeImageTransform,
  canUpdateEffects,
  isRemoveBackgroundBusy = false,
  isEnhanceBusy = false,
  isUpscaleBusy = false,
  isRestoreBusy = false,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
  onEditModeChange,
  activeImageCropAdjust,
  onUpdateCropAdjust,
  isZoomAvailable = false,
}: UploaderPreviewToolsPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [snapshot, setSnapshot] = useState<EffectsSnapshot | null>(null);

  const captureSnapshot = (): EffectsSnapshot => {
    const effects = activeImageEffects ?? {
      brightness: 0,
      contrast: 0,
      grayscale: 0,
      removeBackground: false,
      enhance: false,
      upscale: false,
      restore: false,
    };
    const trans = activeImageTransform ?? {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };
    return {
      brightness: effects.brightness,
      contrast: effects.contrast,
      grayscale: effects.grayscale ?? 0,
      removeBackground: !!effects.removeBackground,
      enhance: !!effects.enhance,
      upscale: !!effects.upscale,
      restore: !!effects.restore,
      rotation: trans.rotation,
      flipHorizontal: trans.flipHorizontal,
      flipVertical: trans.flipVertical,
      cropAdjust: activeImageCropAdjust
        ? { ...activeImageCropAdjust }
        : undefined,
    };
  };

  const restoreSnapshot = (snap: EffectsSnapshot) => {
    onUpdateEffect("brightness", snap.brightness);
    onUpdateEffect("contrast", snap.contrast);
    onUpdateEffect("grayscale", snap.grayscale);
    onToggleRemoveBackground(snap.removeBackground);
    onToggleEnhance(snap.enhance);
    onToggleUpscale(snap.upscale);
    onToggleRestore(snap.restore);
    onUpdateRotation(snap.rotation);
    onToggleFlipHorizontal(snap.flipHorizontal);
    onToggleFlipVertical(snap.flipVertical);
    if (onUpdateCropAdjust) {
      onUpdateCropAdjust(snap.cropAdjust ?? { zoom: 1, panX: 0, panY: 0 });
    }
  };

  const closeDrawer = (restore: boolean) => {
    if (restore && snapshot) {
      restoreSnapshot(snapshot);
    }
    setSnapshot(null);
    setIsEditMode(false);
    onEditModeChange?.(false);
  };

  const enterEditMode = () => {
    setSnapshot(captureSnapshot());
    setIsEditMode(true);
    onEditModeChange?.(true);
  };

  const handleApprove = () => {
    closeDrawer(false);
  };

  const handleCancel = () => {
    closeDrawer(true);
  };

  const handleReset = () => {
    if (snapshot) {
      restoreSnapshot(snapshot);
    }
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
    <>
      <div className="mx-auto w-full rounded-xl border border-border/60 bg-background px-2 py-2 sm:px-3 lg:px-3 lg:py-1.5 shadow-md md:w-1/2">
        <div className="w-full">
          <UploaderSlotSwitcher
            slots={slots}
            activeSlotIndex={activeSlotIndex}
            onSelectSlot={onSelectSlot}
            hidden={isEditMode}
          />
        </div>

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
      </div>

      {isEditMode && (
        <div
          role="dialog"
          aria-label={t("uploader.previewEffectsTitle")}
          className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-[40dvh] flex-col rounded-t-xl border-t text-sm shadow-lg animate-in slide-in-from-bottom duration-300"
        >
        <div className="mx-auto w-full md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-screen-sm flex flex-col min-h-0 flex-1">
          <div className="bg-muted mt-4 h-1.5 w-[100px] rounded-full mx-auto shrink-0" />
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-2 bg-muted/40 border-b border-border/60 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 gap-1.5 text-muted-foreground"
              aria-label={t("uploader.effectsCancel")}
            >
              <X className="h-4 w-4" />
              {t("uploader.effectsCancel")}
            </Button>
            <span className="text-sm font-semibold">
              {t("uploader.previewEffectsTitle")}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5"
                aria-label={t("uploader.effectsReset")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("uploader.effectsReset")}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleApprove}
                className="h-8 gap-1.5"
                aria-label={t("uploader.effectsApprove")}
              >
                <Check className="h-4 w-4" />
                {t("uploader.effectsApprove")}
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 lg:px-3 pb-6 pt-3">
            <UploaderEffectsPanelContent
              effects={activeImageEffects}
              transform={activeImageTransform}
              onUpdateEffect={onUpdateEffect}
              onToggleRemoveBackground={onToggleRemoveBackground}
              onToggleEnhance={onToggleEnhance}
              onToggleUpscale={onToggleUpscale}
              onToggleRestore={onToggleRestore}
              onUpdateRotation={onUpdateRotation}
              onToggleFlipHorizontal={onToggleFlipHorizontal}
              onToggleFlipVertical={onToggleFlipVertical}
              disabled={!canUpdateEffects}
              isRemoveBackgroundBusy={isRemoveBackgroundBusy}
              isEnhanceBusy={isEnhanceBusy}
              isUpscaleBusy={isUpscaleBusy}
              isRestoreBusy={isRestoreBusy}
              zoom={activeImageCropAdjust?.zoom ?? 1}
              minZoom={1}
              maxZoom={3}
              isZoomAvailable={isZoomAvailable}
              onZoomChange={
                onUpdateCropAdjust
                  ? (z) =>
                      onUpdateCropAdjust({
                        zoom: z,
                        panX: activeImageCropAdjust?.panX ?? 0,
                        panY: activeImageCropAdjust?.panY ?? 0,
                      })
                   : undefined
               }
            />
          </div>
        </div>
        </div>
      )}
    </>
  );
}

export default UploaderPreviewToolsPanel;
