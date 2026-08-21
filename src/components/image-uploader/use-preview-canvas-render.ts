import { useEffect, useRef } from "react";
import {
  drawCroppedImageToCanvas,
  loadImageElement,
  resolveImageDimensions,
  type PreviewTransform,
} from "./preview-canvas-utils";
import { buildPreviewRenderPlan } from "./preview-render-plan";
import { adjustCropForZoomPan } from "./use-crop-adjust";
import { resolveTriptychSlotCrop } from "./triptych-window-crop";
import {
  calculateMaxCenteredCrop,
  invertDisplayProportion,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";

interface UsePreviewCanvasRenderArgs {
  previewUrl: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  allowAutoSelectOptimalProportion?: boolean;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
  previewTransform: PreviewTransform | null;
  previewCropAdjust?: CropAdjust;
  latestRenderConfigRef: React.MutableRefObject<{
    selectedImageMetadata: SelectedImageMetadata | null;
    bestProportion: ImageDisplayProportion | null;
    userSelectedProportion: ImageDisplayProportion;
    previewEffects: { brightness: number; contrast: number } | null;
    previewTransform: PreviewTransform | null;
    previewCropAdjust?: CropAdjust;
    triptychWindowIndex?: number;
  }>;
  /**
   * External ref that will be populated with a function for immediate
   * (non-React) canvas redraws.  Created by the parent so both this hook
   * and useCanvasPanZoom can share it regardless of hook call order.
   */
  requestDrawRef: React.MutableRefObject<(cropAdjust: { zoom: number; panX: number; panY: number }) => void>;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

export const usePreviewCanvasRender = ({
  previewUrl,
  canvasRef,
  allowAutoSelectOptimalProportion = true,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  previewTransform,
  previewCropAdjust,
  latestRenderConfigRef,
  onMetadataResolved,
  requestDrawRef,
}: UsePreviewCanvasRenderArgs) => {
  const imageCacheRef = useRef<{
    url: string;
    image: HTMLImageElement;
    sourceWidth: number;
    sourceHeight: number;
  } | null>(null);

  // Stable ref to the current drawPreview function exposed by the main effect.
  // This allows the lightweight crop-redraw effect to trigger a redraw
  // without requiring the main effect to tear down and re-setup.
  const drawPreviewRef = useRef<((cropAdjustOverride?: CropAdjust) => void) | null>(null);

  // Main effect: handles image loading, canvas setup, and resize handling.
  // Does NOT depend on previewCropAdjust — crop changes are handled by the
  // lightweight redraw effect below, avoiding expensive teardown on every pan.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!previewUrl || !canvas) {
      drawPreviewRef.current = null;
      return;
    }

    let isActive = true;
    let resizeFrameId: number | null = null;
    let retryFrameId: number | null = null;
    let drawFailureCount = 0;
    let loadedImage: HTMLImageElement | null = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    // Cached canvas display dimensions — updated only on resize events to
    // avoid getBoundingClientRect() forced reflows during zoom/pan.
    let cachedDisplayWidth = 0;
    let cachedDisplayHeight = 0;

    const updateCachedDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        cachedDisplayWidth = Math.max(1, Math.round(rect.width));
        cachedDisplayHeight = Math.max(1, Math.round(rect.height));
      }
    };

    const drawPreview = (cropAdjustOverride?: CropAdjust) => {
      if (!isActive || !loadedImage || sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      const {
        selectedImageMetadata,
        bestProportion,
        userSelectedProportion,
        previewEffects,
        previewTransform,
        previewCropAdjust,
        triptychWindowIndex,
      } = latestRenderConfigRef.current;

      const {
        metadata,
        crop: planCrop,
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

      // Use the override when provided (e.g. during wheel zoom for immediate
      // visual feedback), otherwise fall back to the React-committed value.
      const cropAdjust = cropAdjustOverride ?? previewCropAdjust;

      // Seamless triptych: the crop is a contiguous portrait window into the
      // shared source. A shared zoom shrinks every window by the same factor
      // and panY travels it vertically, while panX scrolls the whole band —
      // all three panels share the same zoom/panX/panY, so they always meet
      // edge-to-edge at any zoom level.
      let crop;
      if (triptychWindowIndex !== undefined) {
        crop = resolveTriptychSlotCrop({
          sourceWidth,
          sourceHeight,
          displayImageProportion: nextDisplayImageProportion,
          windowIndex: triptychWindowIndex,
          cropAdjust,
        });
      } else {
        // For 90°/270° rotations the image orientation swaps, so the crop that
        // fills the frame after rotation must be selected against the inverse
        // frame aspect (horizontal ↔ vertical).  Metadata and the proportion
        // decision stay on the original dimensions so the user's chosen frame
        // proportion is not yanked around by rotating.
        const normalizedRotation =
          previewTransform != null
            ? ((previewTransform.rotation % 360) + 360) % 360
            : 0;
        const isQuarterTurn =
          normalizedRotation === 90 || normalizedRotation === 270;
        const baseCrop = isQuarterTurn
          ? calculateMaxCenteredCrop({
              sourceWidth,
              sourceHeight,
              proportion: invertDisplayProportion(nextDisplayImageProportion),
            })
          : planCrop;

        crop = cropAdjust
          ? adjustCropForZoomPan(
              baseCrop,
              cropAdjust.zoom,
              cropAdjust.panX,
              cropAdjust.panY,
            )
          : baseCrop;
      }

      // Use cached dimensions during zoom/pan to avoid forced reflow.
      // Only fall back to getBoundingClientRect if we have no cache yet.
      const cachedDims = cachedDisplayWidth > 0 && cachedDisplayHeight > 0
        ? { w: cachedDisplayWidth, h: cachedDisplayHeight }
        : null;

      const painted = drawCroppedImageToCanvas({
        canvas,
        image: loadedImage,
        crop,
        effects: previewEffects,
        transform: previewTransform,
        cachedDimensions: cachedDims,
      });

      // A failed draw (null 2D context, most often under canvas/GPU memory
      // pressure with multi-megapixel sources) used to leave the preview
      // permanently blank with no signal. Retry on later frames — the
      // pressure is usually transient (parallel decodes settling, etc.).
      // Strict `=== false`: the explicit failure signal from a real draw.
      if (painted === false) {
        drawFailureCount += 1;
        console.error(
          `[preview-canvas] draw failed (attempt ${drawFailureCount}): buffer ${canvas.width}x${canvas.height}, crop ${Math.round(crop.cropX)},${Math.round(crop.cropY)} ${Math.round(crop.cropWidth)}x${Math.round(crop.cropHeight)}, source ${sourceWidth}x${sourceHeight}`,
        );
        if (isActive && drawFailureCount <= 10 && retryFrameId === null) {
          retryFrameId = window.requestAnimationFrame(() => {
            retryFrameId = null;
            drawPreview(cropAdjustOverride);
          });
        }
      } else {
        drawFailureCount = 0;
      }
    };

    // Expose drawPreview so the crop-redraw effect can call it.
    drawPreviewRef.current = drawPreview;

    // Expose a stable requestDraw function for immediate (non-React) draws.
    requestDrawRef.current = (cropAdjust: CropAdjust) => {
      drawPreview(cropAdjust);
    };

    // The GPU can evict the 2D context under memory pressure (draw calls then
    // become silent no-ops). Prevent the default loss, and repaint when the
    // context is restored.
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error("[preview-canvas] 2D context lost — will redraw on restore");
    };
    const handleContextRestored = () => {
      drawFailureCount = 0;
      drawPreview();
    };
    canvas.addEventListener("contextlost", handleContextLost);
    canvas.addEventListener("contextrestored", handleContextRestored);

    const scheduleResizeDraw = () => {
      if (!isActive || !loadedImage) {
        return;
      }

      // Update cached dimensions on resize so the next draw uses
      // accurate values without triggering a forced reflow.
      updateCachedDimensions();

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
        const cached = imageCacheRef.current;
        if (cached && cached.url === previewUrl) {
          loadedImage = cached.image;
          sourceWidth = cached.sourceWidth;
          sourceHeight = cached.sourceHeight;
          drawPreview();
          return;
        }

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

        imageCacheRef.current = {
          url: previewUrl,
          image,
          sourceWidth,
          sourceHeight,
        };

        drawPreview();
      } catch {
        // Ignore image loading errors in preview; uploader handles validation earlier.
      }
    };

    void renderPreview();
    window.addEventListener("resize", scheduleResizeDraw);
    window.addEventListener("orientationchange", scheduleResizeDraw);

    const resizeObserver = new ResizeObserver(scheduleResizeDraw);
    resizeObserver.observe(canvas);

    return () => {
      isActive = false;
      drawPreviewRef.current = null;
      requestDrawRef.current = () => {};

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }
      if (retryFrameId !== null) {
        window.cancelAnimationFrame(retryFrameId);
      }

      canvas.removeEventListener("contextlost", handleContextLost);
      canvas.removeEventListener("contextrestored", handleContextRestored);

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
    previewEffects,
    previewTransform,
    requestDrawRef,
  ]);

  // Lightweight effect: redraws the canvas when previewCropAdjust changes.
  // Uses requestAnimationFrame to batch rapid updates during drag.
  // This avoids the expensive teardown of the main effect.
  // Skips the initial mount — the main effect already handles the first draw.
  const prevCropAdjustRef = useRef(previewCropAdjust);
  const cropAdjustFirstMountRef = useRef(true);

  useEffect(() => {
    if (cropAdjustFirstMountRef.current) {
      cropAdjustFirstMountRef.current = false;
      prevCropAdjustRef.current = previewCropAdjust;
      return;
    }

    // Skip if value hasn't actually changed (object identity check)
    if (prevCropAdjustRef.current === previewCropAdjust) {
      return;
    }
    prevCropAdjustRef.current = previewCropAdjust;

    if (!drawPreviewRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      drawPreviewRef.current?.();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [previewCropAdjust]);
};
