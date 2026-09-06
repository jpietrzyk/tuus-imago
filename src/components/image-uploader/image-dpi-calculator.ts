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

export function getDpiQuality(dpi: number): DpiQuality {
  const { excellent, good, acceptable } = IMAGE_DPI_RULES.qualityThresholds;
  if (dpi >= excellent) return "excellent";
  if (dpi >= good) return "good";
  if (dpi >= acceptable) return "acceptable";
  return "low";
}
