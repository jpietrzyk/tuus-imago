import { useEffect, useRef, useState } from "react";
import { type ImageDisplayProportion } from "./image-proportion-calculator";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import { usePreviewRenderConfig } from "./use-preview-render-config";
import { resolveSlotFramePreset } from "./slot-frame-presets";
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
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: PaintingPreviewSlotProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
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
    previewEffects: selectedImage?.previewEffects ?? null,
  });
  const slotFramePreset = resolveSlotFramePreset(userSelectedProportion);

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

  usePreviewCanvasRender({
    previewUrl: selectedImage?.previewUrl ?? null,
    canvasRef: previewCanvasRef,
    selectedImageMetadata,
    allowAutoSelectOptimalProportion:
      selectedImage?.autoSelectOptimalPending ?? true,
    bestProportion,
    userSelectedProportion,
    previewEffects: selectedImage?.previewEffects ?? null,
    latestRenderConfigRef,
    onMetadataResolved,
  });

  return (
    <div className="relative mx-0 flex h-full w-full min-w-0 flex-1 items-center justify-center">
      <div
        className={`relative h-auto max-h-full overflow-hidden rounded-none border-0 flex items-center justify-center will-change-transform transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${slotFramePreset.mainFrameSizeClassName} ${frameAspectRatioClassName} ${
          isFocusPulseActive
            ? "scale-[0.985] md:scale-[0.995] opacity-95"
            : "scale-100 opacity-100"
        }`}
        data-testid="selected-image-preview-frame"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
      </div>
    </div>
  );
}
