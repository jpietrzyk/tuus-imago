import type { DpiQuality } from "./image-dpi-calculator";
import {
  calculateOrientationMatchedDpi,
  getOrientationMatchedPrintDimensions,
  getRequiredPixelsForPrintSize,
} from "./image-dpi-calculator";
import { IMAGE_DPI_RULES } from "./image-dpi-rules";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getTargetAspectRatio } from "./image-proportion-calculator";
import type { PaintingShape, PaintingSizeIndex } from "./painting-size";
import {
  formatPaintingSizeLabel,
  getPaintingSizeOptions,
} from "./painting-size";
import { getRestingDisplayCropDimensions } from "./rotated-image-properties";
import { computeTriptychWindowCrop } from "./triptych-window-crop";

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

/**
 * Structural input for {@link isSlotPrintable}. Mirrors the fields of a
 * selected image slot the per-slot printability projection needs, without
 * importing the slot type itself (avoids a module cycle through
 * image-uploader).
 */
export interface SlotPrintabilityInput {
  metadata: { width: number; height: number } | null;
  displayImageProportion: ImageDisplayProportion;
  /** Rotation the client still applies (0 for baked Cloudinary previews). */
  clientRotation: number | undefined;
  triptychWindowIndex?: number;
}

/**
 * Whether ANY painting size can be printed from this slot's resting crop
 * (or triptych window). Mirrors the active-slot `sizesDpiInfo` memo in
 * image-uploader so every slot can be projected the same way. Returns
 * `null` while metadata has not resolved yet — unknown, not blocked.
 */
export function isSlotPrintable(image: SlotPrintabilityInput): boolean | null {
  const { metadata } = image;
  if (!metadata) {
    return null;
  }

  const shape: PaintingShape =
    image.displayImageProportion === "square" ? "square" : "rectangular";

  if (image.triptychWindowIndex !== undefined) {
    const windowCrop = computeTriptychWindowCrop({
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      frameAspectRatio: getTargetAspectRatio(image.displayImageProportion),
      windowIndex: image.triptychWindowIndex,
      panX: 0,
    });
    return computeSizesDpiAvailability(
      windowCrop.cropWidth,
      windowCrop.cropHeight,
      shape,
    ).some((info) => info.isAvailable);
  }

  const restingCrop = getRestingDisplayCropDimensions({
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    proportion: image.displayImageProportion,
    rotation: image.clientRotation,
  });

  return computeSizesDpiAvailability(
    restingCrop.width,
    restingCrop.height,
    shape,
  ).some((info) => info.isAvailable);
}

export interface UnprintablePhotoInfo {
  /** Source pixels (what the user sees in file properties). */
  width: number;
  height: number;
  /** Approximate DPI at the smallest offered size for the slot's shape. */
  dpi: number;
  /** Label of the smallest offered size, orientation-matched (e.g. "40 x 40"). */
  sizeLabel: string;
  /** Minimum source pixels required for that smallest size at min DPI. */
  minWidth: number;
  minHeight: number;
}

/**
 * User-facing numbers for the unprintable-photo notice, measured against
 * the smallest offered size for the slot's shape — the actual bar the
 * photo fails. Returns null when the photo could print there.
 */
export function getUnprintablePhotoInfo(
  sourceWidth: number,
  sourceHeight: number,
  shape: PaintingShape,
): UnprintablePhotoInfo | null {
  if (!IMAGE_DPI_RULES.guardEnabled) {
    return null;
  }

  const smallest = getPaintingSizeOptions(shape)[0];
  const { dpi } = calculateOrientationMatchedDpi(
    sourceWidth,
    sourceHeight,
    smallest.widthCm,
    smallest.heightCm,
  );

  if (dpi >= IMAGE_DPI_RULES.minDpi) {
    return null;
  }

  const matched = getOrientationMatchedPrintDimensions(
    sourceWidth,
    sourceHeight,
    smallest.widthCm,
    smallest.heightCm,
  );
  const required = getRequiredPixelsForPrintSize(
    matched.widthCm,
    matched.heightCm,
  );

  return {
    width: sourceWidth,
    height: sourceHeight,
    dpi,
    sizeLabel: formatPaintingSizeLabel(
      smallest,
      sourceHeight > sourceWidth ? "portrait" : "landscape",
    ),
    minWidth: required.width,
    minHeight: required.height,
  };
}
