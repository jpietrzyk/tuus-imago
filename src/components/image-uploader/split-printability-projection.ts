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
): SplitPrintabilityProjection {
  const partWidth = Math.floor(sourceWidth / TRIPTYCH_PART_COUNT);
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
