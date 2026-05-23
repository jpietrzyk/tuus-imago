import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { Check, RotateCcw, X } from "lucide-react";
import { UploaderEffectsPanelContent } from "./uploader-effects-panel";
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
  onEditModeChange?: (isEditMode: boolean) => void;
  activeImageCropAdjust?: CropAdjust;
  onUpdateCropAdjust?: (adjust: CropAdjust | undefined) => void;
  isZoomAvailable?: boolean;
  externalEditMode?: boolean;
}

export function UploaderPreviewToolsPanel({
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
  onEditModeChange,
  activeImageCropAdjust,
  onUpdateCropAdjust,
  isZoomAvailable = false,
  externalEditMode,
}: UploaderPreviewToolsPanelProps) {
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [snapshot, setSnapshot] = useState<EffectsSnapshot | null>(null);
  const prevExternalEditMode = useRef(false);

  const isEditMode = externalEditMode ?? internalEditMode;

  useEffect(() => {
    if (externalEditMode && !prevExternalEditMode.current) {
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
      setSnapshot({
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
      });
    }
    prevExternalEditMode.current = !!externalEditMode;
  }, [externalEditMode, activeImageEffects, activeImageTransform, activeImageCropAdjust]);

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
    setInternalEditMode(false);
    onEditModeChange?.(false);
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

  const showDrawer = externalEditMode ?? internalEditMode;

  return (
    <>
      {showDrawer && (
        <div
          role="dialog"
          aria-label={t("uploader.previewEffectsTitle")}
          className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] sm:h-[40dvh] flex-col rounded-t-xl border-t text-sm shadow-lg animate-in slide-in-from-bottom duration-300"
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
