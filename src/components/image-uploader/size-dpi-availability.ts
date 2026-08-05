import type { DpiQuality } from "./image-dpi-calculator";
import { calculateOrientationMatchedDpi } from "./image-dpi-calculator";
import { IMAGE_DPI_RULES } from "./image-dpi-rules";
import type { PaintingShape, PaintingSizeIndex } from "./painting-size";
import { getPaintingSizeOptions } from "./painting-size";

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
    const result = calculateOrientationMatchedDpi(
      imageWidth,
      imageHeight,
      option.widthCm,
      option.heightCm,
    );

    return {
      sizeIndex: option.key,
      dpi: result.dpi,
      quality: result.quality,
      isAvailable: IMAGE_DPI_RULES.guardEnabled
        ? result.dpi >= IMAGE_DPI_RULES.minDpi
        : true,
    };
  });
}

export function resolveRecommendedPaintingSize(
  sizesDpiInfo: SizeDpiInfo[],
): PaintingSizeIndex {
  const acceptable = sizesDpiInfo.filter(
    (info) => info.dpi >= IMAGE_DPI_RULES.minDpi,
  );

  if (acceptable.length === 0) {
    return 0;
  }

  return acceptable.reduce<PaintingSizeIndex>(
    (max, info) => (info.sizeIndex > max ? info.sizeIndex : max),
    acceptable[0].sizeIndex,
  );
}
