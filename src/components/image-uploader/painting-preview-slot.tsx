import { useRef } from "react";
import { ChevronLeft, ChevronRight, Minus } from "lucide-react";
import { t } from "@/locales/i18n";
import { type ImageDisplayProportion } from "./image-proportion-calculator";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import { usePreviewRenderConfig } from "./use-preview-render-config";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";

interface PaintingPreviewSlotProps {
  selectedImage: SelectedImageItem | null;
  activeSlotIndex: number | null;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewFrameAspectRatio: number;
  hasMultipleImages: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onMovePrevious: () => void;
  onMoveNext: () => void;
  onRemoveImage: () => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

export default function PaintingPreviewSlot({
  selectedImage,
  activeSlotIndex,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewFrameAspectRatio,
  hasMultipleImages,
  canMovePrevious,
  canMoveNext,
  onMovePrevious,
  onMoveNext,
  onRemoveImage,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: PaintingPreviewSlotProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const latestRenderConfigRef = usePreviewRenderConfig({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
  });

  usePreviewCanvasRender({
    previewUrl: selectedImage?.previewUrl ?? null,
    canvasRef: previewCanvasRef,
    latestRenderConfigRef,
    onMetadataResolved,
  });

  return (
    <div className="relative mx-0 flex-1 h-full min-w-0 flex items-center justify-center">
      <div
        className="relative h-full w-full md:w-[85%] lg:w-[80%] xl:w-[78%] max-w-640 max-h-full overflow-hidden rounded-none border-0 flex items-center justify-center"
        data-testid="selected-image-preview-frame"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {hasMultipleImages && (
          <button
            type="button"
            onClick={onMovePrevious}
            disabled={!canMovePrevious}
            aria-label={t("uploader.previousImage")}
            data-testid="uploader-slider-prev"
            className="absolute left-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-background/90 text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onRemoveImage}
          aria-label={t("uploader.removeImageSlot", {
            index:
              typeof activeSlotIndex === "number"
                ? String(activeSlotIndex + 1)
                : "",
          })}
          data-testid="uploader-remove-active-image"
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-background/90 text-muted-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>

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

        {hasMultipleImages && (
          <button
            type="button"
            onClick={onMoveNext}
            disabled={!canMoveNext}
            aria-label={t("uploader.nextImage")}
            data-testid="uploader-slider-next"
            className="absolute right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-background/90 text-muted-foreground disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
