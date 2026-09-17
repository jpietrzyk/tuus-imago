import { useEffect, useRef } from "react";
import { computeSidePanelCrop, loadCachedImageElement } from "./side-panel-crop";
import { drawCroppedImageToCanvas } from "./preview-canvas-utils";
import type { SelectedImageItem } from "./image-uploader";

const MAX_DRAW_RETRIES = 10;

interface UseSlotPreviewCanvasParams {
  image: SelectedImageItem | null;
  previewUrl: string | null;
  /**
   * When false the hook is inert (no decode, no draw) so a cloud-backed
   * preview can keep rendering a plain, already-transformed <img>.
   */
  enabled?: boolean;
  /** Optional prefix for draw-failure logs. */
  debugLabel?: string;
}

/**
 * Decodes a slot's preview once and paints its cropped window into a canvas.
 *
 * Every surface that previews a slot — the desktop triptych side panels, the
 * mobile thumbnail strip and the swipe peeks — shares this so they all reflect
 * the same zoom/pan (and triptych window) crop instead of a stale full-frame
 * image. Crop state is read from the image at draw time, so a surface that
 * mounts after the user accepts a crop paints the committed result.
 */
export function useSlotPreviewCanvas({
  image,
  previewUrl,
  enabled = true,
  debugLabel,
}: UseSlotPreviewCanvasParams) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);
  const cachedDimsRef = useRef<{ w: number; h: number } | null>(null);
  const retryStateRef = useRef<{ frame: number | null; failures: number }>({
    frame: null,
    failures: 0,
  });

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imageElRef.current;
    if (!enabled || !canvas || !img || !image) {
      return;
    }

    const sourceDims = image.metadata ?? {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    const crop = computeSidePanelCrop(image, sourceDims);
    if (!crop) {
      return;
    }

    const painted = drawCroppedImageToCanvas({
      canvas,
      image: img,
      crop,
      effects: {
        brightness: image.previewEffects.brightness,
        contrast: image.previewEffects.contrast,
        grayscale: image.previewEffects.grayscale ?? 0,
      },
      transform: image.previewTransform ?? null,
      cachedDimensions: cachedDimsRef.current ?? undefined,
    });

    if (painted === false) {
      const retry = retryStateRef.current;
      retry.failures += 1;
      if (retry.failures === 1 || retry.failures > MAX_DRAW_RETRIES) {
        console.error(
          `[${debugLabel ?? "slot-preview"}] draw failed (attempt ${retry.failures}): buffer ${canvas.width}x${canvas.height}, crop ${Math.round(crop.cropX)},${Math.round(crop.cropY)} ${Math.round(crop.cropWidth)}x${Math.round(crop.cropHeight)}`,
        );
      }
      if (retry.failures <= MAX_DRAW_RETRIES && retry.frame === null) {
        retry.frame = window.requestAnimationFrame(() => {
          retry.frame = null;
          drawRef.current();
        });
      }
    } else {
      retryStateRef.current.failures = 0;
    }
  };

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
    draw();
  });

  useEffect(() => {
    let active = true;
    imageElRef.current = null;

    if (!enabled || !previewUrl) {
      return;
    }

    try {
      loadCachedImageElement(previewUrl)
        .then((img) => {
          if (!active) return;
          imageElRef.current = img;
          drawRef.current();
        })
        .catch(() => {
          // Preview load errors are ignored; the surface stays blank.
        });
    } catch {
      // Some environments cannot decode images (jsdom without the canvas
      // package); the surface stays blank instead of breaking the tree.
    }

    return () => {
      active = false;
    };
  }, [enabled, previewUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) {
      return;
    }

    // The retry state object is stable for the canvas' lifetime; capture it so
    // the cleanup does not read the ref at unmount time.
    const retryState = retryStateRef.current;

    const updateCachedDims = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        cachedDimsRef.current = {
          w: Math.max(1, Math.round(rect.width)),
          h: Math.max(1, Math.round(rect.height)),
        };
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error(
        `[${debugLabel ?? "slot-preview"}] 2D context lost — will redraw on restore`,
      );
    };
    const handleContextRestored = () => {
      retryState.failures = 0;
      drawRef.current();
    };

    updateCachedDims();

    let resizeFrame: number | null = null;
    const scheduleDraw = () => {
      updateCachedDims();
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        drawRef.current();
      });
    };

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleDraw)
        : null;
    observer?.observe(canvas);
    canvas.addEventListener("contextlost", handleContextLost);
    canvas.addEventListener("contextrestored", handleContextRestored);

    return () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      if (retryState.frame !== null) {
        window.cancelAnimationFrame(retryState.frame);
      }
      observer?.disconnect();
      canvas.removeEventListener("contextlost", handleContextLost);
      canvas.removeEventListener("contextrestored", handleContextRestored);
    };
  }, [debugLabel, enabled]);

  return canvasRef;
}
