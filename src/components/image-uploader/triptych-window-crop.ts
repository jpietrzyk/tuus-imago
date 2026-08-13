import type { CropCalculationResult } from "./image-proportion-calculator";

/**
 * When a panorama is split into a triptych, each panel becomes a portrait
 * "window". For a *narrow* panorama (aspect ≤ 3 × frame aspect) the three
 * equal-width thirds already fit the portrait frame and meet edge-to-edge, so
 * the legacy per-third crop is used. For a *wide* panorama the equal-width
 * thirds would be wider than the frame and get cropped, which breaks the
 * edge-to-edge continuity (content strips vanish at the panel seams). In that
 * case the three panels instead show three contiguous portrait windows cut from
 * the shared panorama, and the user can drag to scroll the whole band left/right
 * while the panels always stay edge-to-edge — the same feel as dragging the
 * top/bottom of a square image, but on the horizontal axis.
 */
export function isWidePanoramaForTriptych(
  sourceWidth: number,
  sourceHeight: number,
  frameAspectRatio: number,
): boolean {
  if (sourceHeight <= 0 || frameAspectRatio <= 0) {
    return false;
  }
  return sourceWidth / sourceHeight > 3 * frameAspectRatio + 1e-6;
}

export interface TriptychWindowCropResult extends CropCalculationResult {
  /** Horizontal room (in source px) the 3-window band can travel. */
  panRange: number;
  /** Width of a single portrait window in source px. */
  windowWidth: number;
}

/**
 * Compute the portrait window crop for one seamless-triptych panel.
 *
 * The three windows (indices 0, 1, 2) are contiguous portrait slices whose
 * combined width is `3 * frameAspectRatio * sourceHeight`. `panX ∈ [-1, 1]`
 * shifts the whole band within the source so the user can scroll a wide
 * panorama. Because every window shifts by the same amount, adjacent windows
 * always share an edge (panel N's right edge == panel N+1's left edge) and the
 * frame is always exactly filled — there is never an empty gap, exactly like
 * the vertical top/bottom pan of a square image.
 */
export function computeTriptychWindowCrop({
  sourceWidth,
  sourceHeight,
  frameAspectRatio,
  windowIndex,
  panX,
}: {
  sourceWidth: number;
  sourceHeight: number;
  frameAspectRatio: number;
  windowIndex: number;
  panX: number;
}): TriptychWindowCropResult {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);

  const windowWidth = safeHeight * frameAspectRatio;
  const totalWidth = windowWidth * 3;
  const panRange = Math.max(0, safeWidth - totalWidth);
  const clampedPan = Math.max(-1, Math.min(1, panX));
  const shift = (clampedPan * panRange) / 2;
  const baseX = (safeWidth - totalWidth) / 2 + shift;
  const cropX = baseX + windowIndex * windowWidth;
  const cropY = 0;
  const cropWidth = windowWidth;
  const cropHeight = safeHeight;

  const sourceArea = safeWidth * safeHeight;
  const cropArea = cropWidth * cropHeight;

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    outputWidth: Math.max(1, Math.round(cropWidth)),
    outputHeight: Math.max(1, Math.round(cropHeight)),
    sourceArea,
    cropArea,
    coverageRatio: cropArea / sourceArea,
    coveragePercent: Math.round((cropArea / sourceArea) * 10000) / 100,
    widthScale: cropWidth / safeWidth,
    heightScale: cropHeight / safeHeight,
    panRange,
    windowWidth,
  };
}
