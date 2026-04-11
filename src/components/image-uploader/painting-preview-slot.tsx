import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import { type ImageDisplayProportion } from "./image-proportion-calculator";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import { usePreviewRenderConfig } from "./use-preview-render-config";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";

interface PaintingPreviewSlotProps {
  selectedImage: SelectedImageItem | null;
  previewUrl?: string | null;
  useCloudPreview?: boolean;
  activeSlotIndex: number | null;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewFrameAspectRatio: number;
  isUploadOverlayVisible?: boolean;
  uploadProgress?: number;
  uploadProgressLabel?: string;
  uploadingSlotIndex?: number | null;
  isEffectUploading?: boolean;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  onSelectEmptySlot?: () => void;
}

export default function PaintingPreviewSlot({
  selectedImage,
  previewUrl = null,
  useCloudPreview = false,
  activeSlotIndex,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewFrameAspectRatio,
  isUploadOverlayVisible = false,
  uploadProgress = 0,
  uploadProgressLabel,
  uploadingSlotIndex = null,
  isEffectUploading = false,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
}: PaintingPreviewSlotProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectivePreviewUrl = previewUrl ?? selectedImage?.previewUrl ?? null;
  const effectivePreviewEffects = useCloudPreview
    ? null
    : (selectedImage?.previewEffects ?? null);
  const [isFocusPulseActive, setIsFocusPulseActive] = useState(false);
  const frameAspectRatioClassName =
    userSelectedProportion === "vertical"
      ? "aspect-[2/3]"
      : userSelectedProportion === "horizontal"
        ? "aspect-[16/9]"
        : "aspect-square";
  const latestRenderConfigRef = usePreviewRenderConfig({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects: effectivePreviewEffects,
  });

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsFocusPulseActive(true);
    });

    const timeoutId = window.setTimeout(() => {
      setIsFocusPulseActive(false);
    }, 220);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [
    activeSlotIndex,
    selectedImage,
    selectedImage?.previewUrl,
    userSelectedProportion,
  ]);

  // Track the last cloud URL that has been successfully rendered on canvas.
  // Updated via onMetadataResolved callback (fires after canvas draw).
  const [confirmedCloudUrl, setConfirmedCloudUrl] = useState<string | null>(
    null,
  );

  const handleMetadataResolved = useCallback(
    (args: Parameters<typeof onMetadataResolved>[0]) => {
      // Mark current cloud URL as rendered. Using a functional update to avoid
      // capturing effectivePreviewUrl in a stale closure, and letting React
      // bail out if the value hasn't changed (prevents infinite re-renders).
      setConfirmedCloudUrl((prev) => {
        const next = effectivePreviewUrl;
        return prev === next ? prev : next;
      });
      onMetadataResolved(args);
    },
    [onMetadataResolved, effectivePreviewUrl],
  );

  // Derive loading state: cloud preview is active but the URL hasn't been
  // confirmed as rendered yet (it changed since last onMetadataResolved).
  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;

  usePreviewCanvasRender({
    previewUrl: effectivePreviewUrl,
    canvasRef: previewCanvasRef,
    selectedImageMetadata,
    allowAutoSelectOptimalProportion:
      selectedImage?.autoSelectOptimalPending ?? true,
    bestProportion,
    userSelectedProportion,
    previewEffects: effectivePreviewEffects,
    latestRenderConfigRef,
    onMetadataResolved: handleMetadataResolved,
  });

  return (
    <div className="relative mx-0 flex h-full shrink-0 items-center justify-center">
      <div
        className={`relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 flex items-center justify-center will-change-transform transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${frameAspectRatioClassName} ${
          isFocusPulseActive
            ? "scale-[0.985] md:scale-[0.995] opacity-95"
            : "scale-100 opacity-100"
        }`}
        data-testid="selected-image-preview-frame"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {selectedImage ? (
          <canvas
            ref={previewCanvasRef}
            role="img"
            aria-label="Preview"
            data-testid="selected-image-preview-canvas"
            className="w-full h-full"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          />
        ) : (
          <button
            type="button"
            data-testid="selected-image-preview-placeholder"
            className="flex h-full w-full cursor-pointer items-center justify-center border border-dashed border-primary/70 bg-primary/5 px-4 text-center transition-colors duration-150 hover:border-primary hover:bg-primary/10"
            aria-label={
              typeof activeSlotIndex === "number"
                ? t("uploader.addImageSlot", {
                    index: String(activeSlotIndex + 1),
                  })
                : t("upload.clickToUpload")
            }
            onClick={onSelectEmptySlot}
          >
            <Upload className="h-8 w-8 text-muted-foreground/50" />
          </button>
        )}

        <UploadProgressOverlay
          isVisible={
            isUploadOverlayVisible &&
            !!selectedImage &&
            activeSlotIndex === uploadingSlotIndex
          }
          progress={uploadProgress}
          label={uploadProgressLabel}
        />

        <UploadProgressOverlay
          isVisible={isEffectUploading || isEffectImageLoading}
          progress={0}
          isIndeterminate
          label={t("uploader.applyingEffect")}
        />
      </div>
    </div>
  );
}
