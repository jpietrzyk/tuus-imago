import { IMAGE_DPI_RULES } from "./image-dpi-rules";
import type { CropCalculationResult } from "./image-proportion-calculator";
import type { PaintingSizeOption } from "./painting-size";

const CM_PER_INCH = 2.54;

export type DpiQuality = "excellent" | "good" | "acceptable" | "low";

export interface DpiCalculationResult {
  dpi: number;
  dpiX: number;
  dpiY: number;
  quality: DpiQuality;
}

export function calculateEffectiveDpi(
  pixelWidth: number,
  pixelHeight: number,
  printWidthCm: number,
  printHeightCm: number,
): DpiCalculationResult {
  const dpiX = pixelWidth / (printWidthCm / CM_PER_INCH);
  const dpiY = pixelHeight / (printHeightCm / CM_PER_INCH);
  const dpi = Math.floor(Math.min(dpiX, dpiY));

  return {
    dpi,
    dpiX: Math.floor(dpiX),
    dpiY: Math.floor(dpiY),
    quality: getDpiQuality(dpi),
  };
}

/**
 * Print dimensions after matching the print orientation to the image
 * orientation: a portrait image is printed on the portrait variant of the
 * size (axes swapped for non-square sizes). DPI and required-pixel
 * calculations must both use the same matched dimensions.
 */
export function getOrientationMatchedPrintDimensions(
  pixelWidth: number,
  pixelHeight: number,
  printWidthCm: number,
  printHeightCm: number,
): { widthCm: number; heightCm: number } {
  const imageIsPortrait = pixelHeight > pixelWidth;
  const printIsPortrait = printHeightCm > printWidthCm;
  const shouldSwap = imageIsPortrait !== printIsPortrait;

  return {
    widthCm: shouldSwap ? printHeightCm : printWidthCm,
    heightCm: shouldSwap ? printWidthCm : printHeightCm,
  };
}

export function calculateOrientationMatchedDpi(
  pixelWidth: number,
  pixelHeight: number,
  printWidthCm: number,
  printHeightCm: number,
): DpiCalculationResult {
  const matched = getOrientationMatchedPrintDimensions(
    pixelWidth,
    pixelHeight,
    printWidthCm,
    printHeightCm,
  );

  return calculateEffectiveDpi(
    pixelWidth,
    pixelHeight,
    matched.widthCm,
    matched.heightCm,
  );
}

export function calculateDpiFromCrop(
  crop: CropCalculationResult,
  printSize: PaintingSizeOption,
): DpiCalculationResult {
  return calculateEffectiveDpi(
    crop.cropWidth,
    crop.cropHeight,
    printSize.widthCm,
    printSize.heightCm,
  );
}

/**
 * Minimum source pixels needed to print the given (orientation-matched)
 * print size at the current minimum DPI.
 */
export function getRequiredPixelsForPrintSize(
  printWidthCm: number,
  printHeightCm: number,
  minDpi: number = IMAGE_DPI_RULES.minDpi,
): { width: number; height: number } {
  return {
    width: Math.ceil((minDpi * printWidthCm) / CM_PER_INCH),
    height: Math.ceil((minDpi * printHeightCm) / CM_PER_INCH),
  };
}

export function getDpiQuality(dpi: number): DpiQuality {
  const { excellent, good, acceptable } = IMAGE_DPI_RULES.qualityThresholds;
  if (dpi >= excellent) return "excellent";
  if (dpi >= good) return "good";
  if (dpi >= acceptable) return "acceptable";
  return "low";
}

/**
 * The largest crop zoom that still prints the given (orientation-matched)
 * size at the minimum DPI. Zoom samples a smaller region of the source, so the
 * pixels available to print scale down by 1/zoom; the cap is the DPI headroom
 * of the crop at zoom 1. Returns 1 when the crop is already at/below the
 * minimum (no room to zoom), and Infinity when the size needs no pixels.
 */
export function calculateMaxZoomForPrintSize(
  cropWidth: number,
  cropHeight: number,
  printWidthCm: number,
  printHeightCm: number,
  minDpi: number = IMAGE_DPI_RULES.minDpi,
): number {
  if (cropWidth <= 0 || cropHeight <= 0) {
    return 1;
  }

  const matched = getOrientationMatchedPrintDimensions(
    cropWidth,
    cropHeight,
    printWidthCm,
    printHeightCm,
  );
  const required = getRequiredPixelsForPrintSize(
    matched.widthCm,
    matched.heightCm,
    minDpi,
  );

  const zoomX = required.width > 0 ? cropWidth / required.width : Infinity;
  const zoomY = required.height > 0 ? cropHeight / required.height : Infinity;
  const maxZoom = Math.min(zoomX, zoomY);

  return Number.isFinite(maxZoom) ? Math.max(1, maxZoom) : Infinity;
}
