import { useMemo, useCallback } from "react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import type { SelectedImageItem } from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getTargetAspectRatio } from "./image-proportion-calculator";
import { resolveSlotFramePreset } from "./slot-frame-presets";
import { useSideSlotProportionResolve } from "./use-side-slot-proportion-resolve";

interface SideSlotPreviewProps {
  position: "left" | "right";
  slotIndex: number | null;
  image: SelectedImageItem | null;
  previewUrl?: string | null;
  useCloudPreview?: boolean;
  selectedProportion: ImageDisplayProportion;
  isNavigable: boolean;
  isUploadOverlayVisible?: boolean;
  uploadProgress?: number;
  uploadProgressLabel?: string;
  uploadingSlotIndex?: number | null;
  onSelectSlot: (index: number) => void;
  onProportionResolved?: (proportion: ImageDisplayProportion) => void;
}

export default function SideSlotPreview({
  position,
  slotIndex,
  image,
  previewUrl = null,
  useCloudPreview = false,
  selectedProportion,
  isNavigable,
  isUploadOverlayVisible = false,
  uploadProgress = 0,
  uploadProgressLabel,
  uploadingSlotIndex = null,
  onSelectSlot,
  onProportionResolved,
}: SideSlotPreviewProps) {
  const isLeft = position === "left";
  const isAddSlotAction = !image && typeof slotIndex === "number";

  const stableOnProportionResolved = useCallback(
    (proportion: ImageDisplayProportion) => {
      onProportionResolved?.(proportion);
    },
    [onProportionResolved],
  );

  useSideSlotProportionResolve({
    image,
    onProportionResolved: stableOnProportionResolved,
  });

  const slotOwnProportion: ImageDisplayProportion = image?.displayImageProportion ?? selectedProportion;
  const slotFramePreset = resolveSlotFramePreset(slotOwnProportion);
  const slotAspectRatioClassName =
    slotOwnProportion === "vertical"
      ? "aspect-[2/3]"
      : slotOwnProportion === "horizontal"
        ? "aspect-[16/9]"
        : "aspect-square";

  const previewFrameAspectRatio = useMemo(
    () => getTargetAspectRatio(slotOwnProportion),
    [slotOwnProportion],
  );

  // Build CSS filter for preview effects
  const getEffectFilter = () => {
    if (!image || !image.previewEffects || useCloudPreview) {
      return undefined;
    }

    const { brightness, contrast } = image.previewEffects;

    if (brightness === 0 && contrast === 0) {
      return undefined;
    }

    const brightnessFactor = 1 + brightness / 100;
    const contrastFactor = 1 + contrast / 100;

    // Clamp values to reasonable ranges
    const clampedBrightness = Math.max(0, Math.min(2, brightnessFactor));
    const clampedContrast = Math.max(0, Math.min(2, contrastFactor));

    return `brightness(${clampedBrightness}) contrast(${clampedContrast})`;
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof slotIndex === "number") {
          onSelectSlot(slotIndex);
        }
      }}
      disabled={slotIndex === null}
      data-testid={
        isLeft ? "uploader-slider-side-left" : "uploader-slider-side-right"
      }
      aria-label={
        isAddSlotAction
          ? t("uploader.addImageSlot", {
              index: String(slotIndex + 1),
            })
          : t(isLeft ? "uploader.previousImage" : "uploader.nextImage")
      }
      className={`h-full shrink-0 ${slotFramePreset.sideFrameMaxWidthClassName} overflow-hidden rounded-none bg-transparent transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-default disabled:opacity-70 ${
        isLeft
          ? "flex items-start justify-end"
          : "flex items-center justify-start"
      } ${
        isNavigable
          ? "scale-[0.985] md:scale-[0.995]"
          : "scale-[0.965] md:scale-[0.985]"
      }`}
    >
      <div
        data-testid={
          isLeft
            ? "uploader-slider-side-left-preview-frame"
            : "uploader-slider-side-right-preview-frame"
        }
        className={`relative flex h-full w-auto max-w-full ${slotAspectRatioClassName} overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          isLeft ? "items-start justify-end" : "items-center justify-start"
        } ${
          image
            ? isNavigable
              ? "opacity-95 md:opacity-92"
              : "opacity-80 md:opacity-75"
            : "border border-dashed border-primary/70 bg-primary/5 opacity-95"
        }`}
        style={{
          aspectRatio: String(previewFrameAspectRatio),
        }}
      >
        {image ? (
          <>
            <img
              src={previewUrl ?? image.previewUrl}
              alt={
                typeof slotIndex === "number"
                  ? t("uploader.selectImageSlot", {
                      index: String(slotIndex + 1),
                    })
                  : ""
              }
              className="h-full w-full object-cover object-center"
              style={{
                filter: getEffectFilter(),
              }}
              draggable={false}
            />
            <UploadProgressOverlay
              isVisible={
                isUploadOverlayVisible &&
                typeof slotIndex === "number" &&
                slotIndex === uploadingSlotIndex
              }
              progress={uploadProgress}
              label={uploadProgressLabel}
            />
          </>
        ) : null}
      </div>
    </button>
  );
}
