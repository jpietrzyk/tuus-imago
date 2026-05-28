import type { DpiQuality } from "./image-dpi-calculator";
import { calculateEffectiveDpi } from "./image-dpi-calculator";
import type { PaintingShape, PaintingSizeIndex } from "./painting-size";
import { getPaintingSizeOptions } from "./painting-size";
import { IMAGE_VALIDATION_RULES } from "./image-validation-rules";

export interface SizeDpiInfo {
  sizeIndex: PaintingSizeIndex;
  dpi: number;
  quality: DpiQuality;
  isAvailable: boolean;
}

export function computeSizesDpiAvailability(
  imageWidth: number,
  imageHeight: number,
  shape: PaintingShape,
): SizeDpiInfo[] {
  const options = getPaintingSizeOptions(shape);

  return options.map((option) => {
    const result = calculateEffectiveDpi(
      imageWidth,
      imageHeight,
      option.widthCm,
      option.heightCm,
    );

    return {
      sizeIndex: option.key,
      dpi: result.dpi,
      quality: result.quality,
      isAvailable: result.dpi >= IMAGE_VALIDATION_RULES.minDpi,
    };
  });
}
