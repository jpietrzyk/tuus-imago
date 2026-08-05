import { useCallback, useEffect, useRef, useState } from "react";
import IconAdd from "@/components/icons/icon-add.svg?react";
import IconRemove from "@/components/icons/icon-remove.svg?react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import { type ImageDisplayProportion, getFrameAspectRatioClassName } from "./image-proportion-calculator";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import { usePreviewRenderConfig } from "./use-preview-render-config";
import { useCanvasPanZoom } from "./use-canvas-pan-zoom";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";

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
  swipeDisabled?: boolean;
  isEditMode?: boolean;
  previewCropAdjust?: CropAdjust;
  onCropAdjustChange?: (adjust: CropAdjust | undefined) => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  onSelectEmptySlot?: () => void;
  onClearSlot?: () => void;
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
  swipeDisabled = false,
  isEditMode = false,
  previewCropAdjust,
  onCropAdjustChange,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
  onClearSlot,
}: PaintingPreviewSlotProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectivePreviewUrl = previewUrl ?? selectedImage?.previewUrl ?? null;
  const effectivePreviewEffects = useCloudPreview
    ? null
    : (selectedImage?.previewEffects ?? null);
  // The cloud preview URL already encodes rotation/flip, so the client-side
  // canvas transform is only applied for local (pre-upload) previews.
  const effectivePreviewTransform = useCloudPreview
    ? null
    : (selectedImage?.previewTransform ?? null);
  const [isFocusPulseActive, setIsFocusPulseActive] = useState(false);
  const frameAspectRatioClassName =
    getFrameAspectRatioClassName(userSelectedProportion);
  const latestRenderConfigRef = usePreviewRenderConfig({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects: effectivePreviewEffects,
    previewTransform: effectivePreviewTransform,
    previewCropAdjust,
  });

  // Use refs for values read inside callbacks so the callbacks remain
  // stable across re-renders.  This prevents useCanvasPanZoom from
  // re-registering its event listeners on every crop adjust change.
  const previewCropAdjustRef = useRef(previewCropAdjust);
  const onCropAdjustChangeRef = useRef(onCropAdjustChange);

  useEffect(() => {
    previewCropAdjustRef.current = previewCropAdjust;
    onCropAdjustChangeRef.current = onCropAdjustChange;
  });

  // Shared ref for immediate canvas draws during zoom — created here so
  // both usePreviewCanvasRender and useCanvasPanZoom can reference it
  // regardless of hook call order.
  const requestDrawRef = useRef<(cropAdjust: { zoom: number; panX: number; panY: number }) => void>(() => {});

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const adjust = previewCropAdjustRef.current;
      const onChange = onCropAdjustChangeRef.current;
      if (!onChange) return;
      onChange({
        zoom: newZoom,
        panX: adjust?.panX ?? 0,
        panY: adjust?.panY ?? 0,
      });
    },
    [],
  );

  const handlePanChange = useCallback(
    (newPanX: number, newPanY: number) => {
      const adjust = previewCropAdjustRef.current;
      const onChange = onCropAdjustChangeRef.current;
      if (!onChange) return;
      onChange({
        zoom: adjust?.zoom ?? 1,
        panX: newPanX,
        panY: newPanY,
      });
    },
    [],
  );

  useCanvasPanZoom({
    canvasRef: previewCanvasRef,
    isEditMode: isEditMode && !!onCropAdjustChange,
    zoom: previewCropAdjust?.zoom ?? 1,
    panX: previewCropAdjust?.panX ?? 0,
    panY: previewCropAdjust?.panY ?? 0,
    onZoomChange: handleZoomChange,
    onPanChange: handlePanChange,
    requestDrawRef,
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

  const [confirmedCloudUrl, setConfirmedCloudUrl] = useState<string | null>(
    null,
  );

  const handleMetadataResolved = useCallback(
    (args: Parameters<typeof onMetadataResolved>[0]) => {
      setConfirmedCloudUrl((prev) => {
        const next = effectivePreviewUrl;
        return prev === next ? prev : next;
      });
      onMetadataResolved(args);
    },
    [onMetadataResolved, effectivePreviewUrl],
  );

  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;

  usePreviewCanvasRender({
    previewUrl: effectivePreviewUrl,
    canvasRef: previewCanvasRef,
    allowAutoSelectOptimalProportion:
      selectedImage?.autoSelectOptimalPending ?? true,
    bestProportion,
    userSelectedProportion,
    previewEffects: effectivePreviewEffects,
    previewTransform: effectivePreviewTransform,
    previewCropAdjust,
    latestRenderConfigRef,
    onMetadataResolved: handleMetadataResolved,
    requestDrawRef,
  });

  return (
    <div className="relative mx-0 flex h-full max-h-full shrink-0 items-center justify-center">
      <div
        className={`group/preview-slot relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 flex items-center justify-center will-change-transform transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${frameAspectRatioClassName} ${
          isFocusPulseActive
            ? "scale-[0.985] md:scale-[0.995] opacity-95"
            : "scale-100 opacity-100"
        }`}
        data-testid="selected-image-preview-frame"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
        onTouchStart={swipeDisabled ? undefined : onTouchStart}
        onTouchEnd={swipeDisabled ? undefined : onTouchEnd}
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
              ...(isEditMode ? { cursor: "grab" } : {}),
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
            <IconAdd className="h-8 w-8 text-muted-foreground/50" />
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

        {selectedImage && onClearSlot && !isEditMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearSlot();
            }}
            aria-label={t("uploader.clearSlot")}
            data-testid="uploader-remove-active-image"
            className="absolute top-2 right-2 z-10 flex items-center justify-center rounded-full border border-border/70 bg-background/95 p-1.5 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 opacity-0 group-hover/preview-slot:opacity-100 peer-active/preview-slot:opacity-100 max-[768px]:opacity-100"
          >
            <IconRemove className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
