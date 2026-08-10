import {
  calculateMaxCenteredCrop,
  type CropCalculationResult,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";

export interface CropAdjust {
  zoom: number;
  panX: number;
  panY: number;
}

/**
 * Determine whether the source image overflows the centered base crop in each
 * axis. When there is overflow the user can pan (drag) to reveal the masked
 * edges even at zoom 1 — this is the case for triptych panels whose vertical
 * thirds are taller than the portrait frame.
 */
export function resolvePanAvailability({
  sourceWidth,
  sourceHeight,
  proportion,
}: {
  sourceWidth: number;
  sourceHeight: number;
  proportion: ImageDisplayProportion;
}): { canPanX: boolean; canPanY: boolean } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { canPanX: false, canPanY: false };
  }
  const crop = calculateMaxCenteredCrop({
    sourceWidth,
    sourceHeight,
    proportion,
  });
  return {
    canPanX: crop.cropWidth < sourceWidth - 0.5,
    canPanY: crop.cropHeight < sourceHeight - 0.5,
  };
}

export function adjustCropForZoomPan(
  baseCrop: CropCalculationResult,
  zoom: number,
  panX: number,
  panY: number,
): CropCalculationResult {
  const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
  const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;

  const effectiveZoom = Math.max(1, zoom);
  const zoomScale = 1 / effectiveZoom;
  const adjustedWidth = baseCrop.cropWidth * zoomScale;
  const adjustedHeight = baseCrop.cropHeight * zoomScale;

  // Pan range is the room the adjusted crop has to move inside the *source*
  // (not just inside the base crop). When the source matches the base crop
  // (aspect-aligned image) this is identical to the previous zoom-only
  // formula. When the source is larger than the crop — e.g. a triptych panel
  // whose vertical third is taller than the portrait frame — the range is
  // non-zero even at zoom 1, letting the user drag to reveal the masked edges.
  const maxPanOffsetX = (sourceWidth - adjustedWidth) / 2;
  const maxPanOffsetY = (sourceHeight - adjustedHeight) / 2;

  // Nothing to adjust: no zoom and no overflow room in either axis.
  if (effectiveZoom <= 1 && maxPanOffsetX <= 0 && maxPanOffsetY <= 0) {
    return baseCrop;
  }

  const offsetX = panX * maxPanOffsetX;
  const offsetY = panY * maxPanOffsetY;

  const centerX = baseCrop.cropX + baseCrop.cropWidth / 2;
  const centerY = baseCrop.cropY + baseCrop.cropHeight / 2;

  let cropX = centerX - adjustedWidth / 2 + offsetX;
  let cropY = centerY - adjustedHeight / 2 + offsetY;

  const maxX = Math.max(0, sourceWidth - adjustedWidth);
  const maxY = Math.max(0, sourceHeight - adjustedHeight);
  cropX = Math.max(0, Math.min(cropX, maxX));
  cropY = Math.max(0, Math.min(cropY, maxY));

  const outputWidth = Math.max(1, Math.round(adjustedWidth));
  const outputHeight = Math.max(1, Math.round(adjustedHeight));
  const cropArea = adjustedWidth * adjustedHeight;

  return {
    cropX,
    cropY,
    cropWidth: adjustedWidth,
    cropHeight: adjustedHeight,
    outputWidth,
    outputHeight,
    sourceArea: baseCrop.sourceArea,
    cropArea,
    coverageRatio: cropArea / baseCrop.sourceArea,
    coveragePercent: Math.round((cropArea / baseCrop.sourceArea) * 10000) / 100,
    widthScale: adjustedWidth / sourceWidth,
    heightScale: adjustedHeight / sourceHeight,
  };
}

