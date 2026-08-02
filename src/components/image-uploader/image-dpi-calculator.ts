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
