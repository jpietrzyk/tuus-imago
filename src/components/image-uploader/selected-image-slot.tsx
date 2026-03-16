import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/locales/i18n";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";

interface SelectedImageSlotProps {
  selectedImage: SelectedImageItem | null;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewFrameAspectRatio: number;
  hasMultipleImages: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onMovePrevious: () => void;
  onMoveNext: () => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

const getOptimalDisplayProportion = (
  sourceWidth: number,
  sourceHeight: number,
): ImageDisplayProportion => {
  const proportions = calculateAllProportions(sourceWidth, sourceHeight);
  const orderedCandidates = ["horizontal", "vertical", "square"] as const;
  type CandidateProportion = (typeof orderedCandidates)[number];

  return orderedCandidates.reduce<CandidateProportion>(
    (bestProportion, candidate) => {
      const bestCoverage = proportions[bestProportion].coveragePercent;
      const candidateCoverage = proportions[candidate].coveragePercent;

      return candidateCoverage > bestCoverage ? candidate : bestProportion;
    },
    "horizontal",
  );
};

export default function SelectedImageSlot({
  selectedImage,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewFrameAspectRatio,
  hasMultipleImages,
  canMovePrevious,
  canMoveNext,
  onMovePrevious,
  onMoveNext,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: SelectedImageSlotProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const latestRenderConfigRef = useRef({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion]);

  useEffect(() => {
    if (!selectedImage?.previewUrl || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;

      if (sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      const metadata: SelectedImageMetadata = {
        width: sourceWidth,
        height: sourceHeight,
        aspectRatio: formatAspectRatio(sourceWidth, sourceHeight),
      };

      const {
        selectedImageMetadata: latestSelectedImageMetadata,
        bestProportion: latestBestProportion,
        userSelectedProportion: latestUserSelectedProportion,
      } = latestRenderConfigRef.current;

      const optimalDisplayProportion =
        latestBestProportion ??
        getOptimalDisplayProportion(sourceWidth, sourceHeight);
      const shouldAutoSelectOptimalProportion =
        !latestSelectedImageMetadata &&
        latestUserSelectedProportion === "horizontal";
      const nextDisplayImageProportion = shouldAutoSelectOptimalProportion
        ? optimalDisplayProportion
        : latestUserSelectedProportion;

      onMetadataResolved({
        metadata,
        nextDisplayImageProportion,
        shouldAutoSelectOptimalProportion,
      });

      const crop = calculateMaxCenteredCrop({
        sourceWidth,
        sourceHeight,
        proportion: nextDisplayImageProportion,
      });

      // Use rendered size as backing store size to keep preview crisp on current layout.
      const rect = canvas.getBoundingClientRect();
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const hasMeasuredCanvasSize = rect.width > 0 && rect.height > 0;
      const displayWidth = hasMeasuredCanvasSize
        ? Math.max(1, Math.round(rect.width))
        : crop.outputWidth;
      const displayHeight = hasMeasuredCanvasSize
        ? Math.max(1, Math.round(rect.height))
        : crop.outputHeight;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);

      if (
        typeof HTMLImageElement !== "undefined" &&
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      const dstW = canvas.width;
      const dstH = canvas.height;

      // Source crop and destination frame share the same target ratio, so this fills
      // the full slot without adding letterbox gaps.
      context.clearRect(0, 0, dstW, dstH);
      context.drawImage(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        0,
        0,
        dstW,
        dstH,
      );
    };

    image.src = selectedImage.previewUrl;
  }, [onMetadataResolved, selectedImage]);

  return (
    <div className="relative mx-3 flex-1 h-full min-w-0 flex items-center justify-center">
      <div
        className="relative h-full w-full md:w-[95%] lg:w-[92%] xl:w-[96%] max-w-480 max-h-full overflow-hidden rounded-lg border-2 border-dashed border-border/35 flex items-center justify-center"
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
