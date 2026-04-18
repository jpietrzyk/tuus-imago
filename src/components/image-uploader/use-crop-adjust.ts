import type { CropCalculationResult } from "./image-proportion-calculator";

export interface CropAdjust {
  zoom: number;
  panX: number;
  panY: number;
}

export function adjustCropForZoomPan(
  baseCrop: CropCalculationResult,
  zoom: number,
  panX: number,
  panY: number,
): CropCalculationResult {
  if (zoom <= 1) {
    return baseCrop;
  }

  const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
  const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;

  const zoomScale = 1 / zoom;
  const adjustedWidth = baseCrop.cropWidth * zoomScale;
  const adjustedHeight = baseCrop.cropHeight * zoomScale;

  const maxPanOffsetX = (baseCrop.cropWidth - adjustedWidth) / 2;
  const maxPanOffsetY = (baseCrop.cropHeight - adjustedHeight) / 2;

  const offsetX = panX * maxPanOffsetX;
  const offsetY = panY * maxPanOffsetY;

  const centerX = baseCrop.cropX + baseCrop.cropWidth / 2;
  const centerY = baseCrop.cropY + baseCrop.cropHeight / 2;

  let cropX = centerX - adjustedWidth / 2 + offsetX;
  let cropY = centerY - adjustedHeight / 2 + offsetY;

  const maxX = sourceWidth - adjustedWidth;
  const maxY = sourceHeight - adjustedHeight;
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

