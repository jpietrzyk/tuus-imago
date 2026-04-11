import { useEffect, useRef, useState } from "react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import type { SelectedImageItem } from "./image-uploader";
import {
  type ImageDisplayProportion,
  getTargetAspectRatio,
} from "./image-proportion-calculator";
import { resolveSlotFramePreset } from "./slot-frame-presets";

interface SideSlotPreviewProps {
  position: "left" | "right";
  slotIndex: number | null;
  image: SelectedImageItem | null;
  previewUrl?: string | null;
  useCloudPreview?: boolean;
  isNavigable: boolean;
  isUploadOverlayVisible?: boolean;
  uploadProgress?: number;
  uploadProgressLabel?: string;
  uploadingSlotIndex?: number | null;
  onSelectSlot: (index: number) => void;
}

export default function SideSlotPreview({
  position,
  slotIndex,
  image,
  previewUrl = null,
  useCloudPreview = false,
  isNavigable,
  isUploadOverlayVisible = false,
  uploadProgress = 0,
  uploadProgressLabel,
  uploadingSlotIndex = null,
  onSelectSlot,
}: SideSlotPreviewProps) {
  const isLeft = position === "left";
  const isSpacer = slotIndex === null;
  const isAddSlotAction = !image && typeof slotIndex === "number";
  const sideProportion: ImageDisplayProportion =
    image?.displayImageProportion ?? "horizontal";
  const sideFrameAspectRatio = getTargetAspectRatio(sideProportion);
  const slotFramePreset = resolveSlotFramePreset(sideProportion);
  const slotAspectRatioClassName =
    sideProportion === "vertical"
      ? "aspect-[2/3]"
      : sideProportion === "horizontal"
        ? "aspect-[16/9]"
        : "aspect-square";

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

  const [isEffectImageLoading, setIsEffectImageLoading] = useState(false);
  const prevCloudPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPreviewUrl = useCloudPreview ? (previewUrl ?? null) : null;
    if (
      currentPreviewUrl !== null &&
      currentPreviewUrl !== prevCloudPreviewUrlRef.current
    ) {
      setIsEffectImageLoading(true);
    }
    prevCloudPreviewUrlRef.current = currentPreviewUrl;
  }, [previewUrl, useCloudPreview]);

  if (isSpacer) {
    return (
      <div
        className="h-full shrink-0"
        style={{ flexBasis: "0", flexGrow: 1 }}
        aria-hidden="true"
      />
    );
  }

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
      className={`h-full shrink-0 overflow-hidden rounded-none bg-transparent transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-default disabled:opacity-70 ${
        isLeft
          ? "flex items-start justify-end"
          : "flex items-center justify-start"
      }`}
    >
      <div
        data-testid={
          isLeft
            ? "uploader-slider-side-left-preview-frame"
            : "uploader-slider-side-right-preview-frame"
        }
        className={`relative flex h-full w-full min-w-0 max-w-full ${slotFramePreset.sideFrameMinWidthClassName} ${slotAspectRatioClassName} overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          isLeft ? "items-start justify-end" : "items-center justify-start"
        } ${
          image
            ? isNavigable
              ? "opacity-95 md:opacity-92"
              : "opacity-80 md:opacity-75"
            : "border border-dashed border-primary/70 bg-primary/5 opacity-95"
        }`}
        style={{
          aspectRatio: String(sideFrameAspectRatio),
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
              onLoad={() => setIsEffectImageLoading(false)}
              onError={() => setIsEffectImageLoading(false)}
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
            <UploadProgressOverlay
              isVisible={useCloudPreview && isEffectImageLoading}
              progress={0}
              isIndeterminate
              label={t("uploader.applyingEffect")}
            />
          </>
        ) : null}
      </div>
    </button>
  );
}
