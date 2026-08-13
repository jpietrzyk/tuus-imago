import {
  computeSizesDpiAvailability,
  type SizeDpiInfo,
} from "./size-dpi-availability";
import { getPaintingSizeOptions } from "./painting-size";
import type { PaintingShape, PaintingSizeIndex } from "./painting-size";

export const TRIPTYCH_PART_COUNT = 3;

export const TRIPTYCH_PROJECTED_SHAPE: PaintingShape = "rectangular";

export interface SplitPrintabilityProjection {
  projectedSizesDpiInfo: SizeDpiInfo[];
  willSelectedSizeBeBlocked: boolean;
  noSizePrintable: boolean;
}

export function projectTriptychPrintability(
  sourceWidth: number,
  sourceHeight: number,
  selectedIndex: PaintingSizeIndex,
  projectedShape: PaintingShape = TRIPTYCH_PROJECTED_SHAPE,
  /**
   * When provided, wide panoramas are projected at their seamless window width
   * (sourceHeight * frameAspectRatio) instead of the equal-third width, since
   * each printed canvas is a portrait window rather than an equal-width strip.
   * For non-wide sources this is identical to the legacy third width.
   */
  frameAspectRatio?: number,
): SplitPrintabilityProjection {
  const equalThirdWidth = Math.floor(sourceWidth / TRIPTYCH_PART_COUNT);
  const partWidth =
    frameAspectRatio && frameAspectRatio > 0
      ? Math.min(
          equalThirdWidth,
          Math.round(sourceHeight * frameAspectRatio),
        )
      : equalThirdWidth;
  const projectedSizesDpiInfo = computeSizesDpiAvailability(
    partWidth,
    sourceHeight,
    projectedShape,
  );

  const projectedOptionKeys = new Set(
    getPaintingSizeOptions(projectedShape).map((option) => option.key),
  );
  const selectedProjected = projectedSizesDpiInfo.find(
    (info) => info.sizeIndex === selectedIndex,
  );
  const willSelectedSizeBeBlocked =
    !projectedOptionKeys.has(selectedIndex) ||
    (selectedProjected ? !selectedProjected.isAvailable : true);

  const noSizePrintable = projectedSizesDpiInfo.every(
    (info) => !info.isAvailable,
  );

  return {
    projectedSizesDpiInfo,
    willSelectedSizeBeBlocked,
    noSizePrintable,
  };
}

export function resolveTriptychTargetSizeIndex(
  sourceSizeIndex: PaintingSizeIndex,
  projection: SplitPrintabilityProjection,
): PaintingSizeIndex {
  const available = projection.projectedSizesDpiInfo.filter(
    (info) => info.isAvailable,
  );
  if (available.length === 0) {
    return sourceSizeIndex;
  }
  const largestAvailableIndex = available.reduce(
    (max, info) => (info.sizeIndex > max ? info.sizeIndex : max),
    available[0].sizeIndex,
  );
  const target = Math.min(sourceSizeIndex, largestAvailableIndex);
  return target as PaintingSizeIndex;
}
