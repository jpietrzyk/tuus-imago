import {
  getTargetAspectRatio,
  type CropCalculationResult,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";

/**
 * When an image is split into a triptych, each panel becomes a portrait
 * "window": the three windows are contiguous slices of the shared source, so
 * they meet edge-to-edge and can be dragged/zoomed as one continuous band.
 * For a source whose equal-width thirds are wider than the portrait frame
 * (aspect > 3 × frame aspect) the windows overflow the source, so the band-fit
 * zoom shrinks them until the band tiles the source width again — this simply
 * adds vertical pan headroom instead of cropping content strips away at the
 * panel seams. Every triptych split uses this window model; there is no
 * separate per-third split, so zoom/pan is always shared and the panels stay
 * glued at every zoom level.
 */
export interface TriptychWindowCropResult extends CropCalculationResult {
  /** Horizontal room (in source px) the 3-window band can travel. */
  panRange: number;
  /** Width of a single portrait window in source px. */
  windowWidth: number;
  /** Vertical room (in source px) a window can travel (0 at zoom = 1). */
  panRangeY: number;
}

/**
 * Compute the portrait window crop for one seamless-triptych panel.
 *
 * The three windows (indices 0, 1, 2) are contiguous portrait slices whose
 * combined width is `3 * windowWidth`. `panX ∈ [-1, 1]` shifts the whole band
 * within the source so the user can scroll a wide panorama. A shared `zoom ≥ 1`
 * shrinks every window by the same factor (the band simply reveals more of the
 * panorama), and `panY ∈ [-1, 1]` travels the window vertically once zoom
 * creates vertical headroom. Because every window shares the same zoom/panX/panY
 * and is offset by a whole `windowWidth`, adjacent windows always share an edge
 * (panel N's right edge == panel N+1's left edge) at any zoom level, and the
 * frame is always exactly filled — there is never an empty gap, exactly like
 * the vertical top/bottom pan of a square image. This also holds when the
 * shared frame shape changes (e.g. to square/landscape): the effective zoom is
 * raised until the 3-window band fits the source width again.
 */
export function computeTriptychWindowCrop({
  sourceWidth,
  sourceHeight,
  frameAspectRatio,
  windowIndex,
  panX,
  zoom = 1,
  panY = 0,
}: {
  sourceWidth: number;
  sourceHeight: number;
  frameAspectRatio: number;
  windowIndex: number;
  panX: number;
  zoom?: number;
  panY?: number;
}): TriptychWindowCropResult {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);

  // Changing the linked triptych's shape can widen the frame (e.g. vertical →
  // square), making the 3-window band wider than the panorama itself. The
  // band must always fit edge-to-edge inside the source, so the effective
  // zoom is raised just enough to shrink the windows until it fits — the same
  // semantics as a user zoom (it simply adds vertical pan headroom instead of
  // producing out-of-bounds windows).
  const bandFitZoom = (3 * frameAspectRatio * safeHeight) / safeWidth;
  const effectiveZoom = Math.max(1, zoom, bandFitZoom);

  const cropHeight = safeHeight / effectiveZoom;
  const windowWidth = cropHeight * frameAspectRatio;
  const totalWidth = windowWidth * 3;

  const panRange = Math.max(0, safeWidth - totalWidth);
  const panRangeY = Math.max(0, safeHeight - cropHeight);

  const clampedPanX = Math.max(-1, Math.min(1, panX));
  const clampedPanY = Math.max(-1, Math.min(1, panY));

  const shiftX = (clampedPanX * panRange) / 2;
  const shiftY = (clampedPanY * panRangeY) / 2;

  const baseX = (safeWidth - totalWidth) / 2 + shiftX;
  const cropX = baseX + windowIndex * windowWidth;
  const cropWidth = windowWidth;

  const rawCropY = (safeHeight - cropHeight) / 2 + shiftY;
  const cropY = Math.max(
    0,
    Math.min(rawCropY, Math.max(0, safeHeight - cropHeight)),
  );

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
    panRangeY,
  };
}

export interface ResolveTriptychSlotCropArgs {
  sourceWidth: number;
  sourceHeight: number;
  displayImageProportion: ImageDisplayProportion;
  windowIndex: number;
  cropAdjust?: { zoom?: number; panX?: number; panY?: number } | null;
}

/**
 * Single source of truth for a seamless-triptych panel crop. Derives the frame
 * aspect from the slot's display proportion and applies the shared zoom/pan,
 * so the live canvas preview, the side-panel CSS sizing, and the uploaded
 * `custom_coordinates` all compute the identical window.
 */
export function resolveTriptychSlotCrop({
  sourceWidth,
  sourceHeight,
  displayImageProportion,
  windowIndex,
  cropAdjust,
}: ResolveTriptychSlotCropArgs): TriptychWindowCropResult {
  return computeTriptychWindowCrop({
    sourceWidth,
    sourceHeight,
    frameAspectRatio: getTargetAspectRatio(displayImageProportion),
    windowIndex,
    panX: cropAdjust?.panX ?? 0,
    panY: cropAdjust?.panY ?? 0,
    zoom: cropAdjust?.zoom ?? 1,
  });
}
