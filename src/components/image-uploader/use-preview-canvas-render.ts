import { useEffect } from "react";
import {
  drawCroppedImageToCanvas,
  loadImageElement,
  resolveImageDimensions,
} from "./preview-canvas-utils";
import { buildPreviewRenderPlan } from "./preview-render-plan";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface UsePreviewCanvasRenderArgs {
  previewUrl: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedImageMetadata: SelectedImageMetadata | null;
  allowAutoSelectOptimalProportion?: boolean;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
  latestRenderConfigRef: React.MutableRefObject<{
    selectedImageMetadata: SelectedImageMetadata | null;
    bestProportion: ImageDisplayProportion | null;
    userSelectedProportion: ImageDisplayProportion;
    previewEffects: { brightness: number; contrast: number } | null;
  }>;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

export const usePreviewCanvasRender = ({
  previewUrl,
  canvasRef,
  selectedImageMetadata,
  allowAutoSelectOptimalProportion = true,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  latestRenderConfigRef,
  onMetadataResolved,
}: UsePreviewCanvasRenderArgs) => {
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!previewUrl || !canvas) {
      return;
    }

    let isActive = true;
    let resizeFrameId: number | null = null;
    let loadedImage: HTMLImageElement | null = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    const drawPreview = () => {
      if (!isActive || !loadedImage || sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      const {
        selectedImageMetadata,
        bestProportion,
        userSelectedProportion,
        previewEffects,
      } = latestRenderConfigRef.current;

      const {
        metadata,
        crop,
        nextDisplayImageProportion,
        shouldAutoSelectOptimalProportion,
      } = buildPreviewRenderPlan({
        sourceWidth,
        sourceHeight,
        selectedImageMetadata,
        allowAutoSelectOptimalProportion,
        bestProportion,
        userSelectedProportion,
      });

      onMetadataResolved({
        metadata,
        nextDisplayImageProportion,
        shouldAutoSelectOptimalProportion,
      });

      drawCroppedImageToCanvas({
        canvas,
        image: loadedImage,
        crop,
        effects: previewEffects,
      });
    };

    const scheduleResizeDraw = () => {
      if (!isActive || !loadedImage) {
        return;
      }

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        drawPreview();
      });
    };

    const renderPreview = async () => {
      try {
        const image = await loadImageElement(previewUrl);
        if (!isActive) {
          return;
        }

        const dimensions = resolveImageDimensions(image);
        sourceWidth = dimensions.sourceWidth;
        sourceHeight = dimensions.sourceHeight;
        loadedImage = image;

        if (sourceWidth <= 0 || sourceHeight <= 0) {
          return;
        }

        drawPreview();
      } catch {
        // Ignore image loading errors in preview; uploader handles validation earlier.
      }
    };

    void renderPreview();
    window.addEventListener("resize", scheduleResizeDraw);
    window.addEventListener("orientationchange", scheduleResizeDraw);

    // Redraw when the canvas element itself changes size due to layout shifts
    // (e.g. debug panel showing/hiding, container resize unrelated to window).
    const resizeObserver = new ResizeObserver(scheduleResizeDraw);
    resizeObserver.observe(canvas);

    return () => {
      isActive = false;

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      window.removeEventListener("resize", scheduleResizeDraw);
      window.removeEventListener("orientationchange", scheduleResizeDraw);
      resizeObserver.disconnect();
    };
  }, [
    bestProportion,
    canvasRef,
    latestRenderConfigRef,
    onMetadataResolved,
    previewUrl,
    allowAutoSelectOptimalProportion,
    userSelectedProportion,
    selectedImageMetadata,
    previewEffects,
  ]);
};
