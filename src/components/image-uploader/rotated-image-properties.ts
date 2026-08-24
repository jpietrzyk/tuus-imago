import {
  calculateMaxCenteredCrop,
  formatAspectRatio,
  invertDisplayProportion,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

// Normalizes a rotation value to [0, 360) without importing
// preview-canvas-utils, so this module stays usable in test setups that mock
// the canvas utilities.
const toNormalizedDegrees = (rotation: number | undefined): number =>
  (((rotation ?? 0) % 360) + 360) % 360;

/**
 * True when a rotation flips the image axes (90°/270°): a landscape source
 * is displayed — and printed — as a portrait (vertical shape) image and
 * vice versa.
 */
export const isQuarterTurnRotation = (
  rotation: number | undefined,
): boolean => {
  const normalized = toNormalizedDegrees(rotation);
  return normalized === 90 || normalized === 270;
};

/**
 * Metadata as the image must be treated after a client-side rotation:
 * 90°/270° swap the axes and the aspect ratio is recalculated, so a
 * landscape source becomes portrait. Non-quarter rotations (0°/180°)
 * return the input unchanged.
 */
export const getRotatedImageMetadata = (
  metadata: SelectedImageMetadata,
  rotation: number | undefined,
): SelectedImageMetadata => {
  if (!isQuarterTurnRotation(rotation)) {
    return metadata;
  }

  return {
    width: metadata.height,
    height: metadata.width,
    aspectRatio: formatAspectRatio(metadata.height, metadata.width),
  };
};

/**
 * Display-space dimensions of the resting centered crop that fills the given
 * frame proportion for this rotation — the pixels that are actually shown
 * and printed. Mirrors the render-side logic in use-preview-canvas-render:
 * for 90°/270° the source-space crop is selected against the inverse frame
 * aspect and the rotation swaps it back to the frame orientation.
 */
export const getRestingDisplayCropDimensions = ({
  sourceWidth,
  sourceHeight,
  proportion,
  rotation,
}: {
  sourceWidth: number;
  sourceHeight: number;
  proportion: ImageDisplayProportion;
  rotation: number | undefined;
}): { width: number; height: number } => {
  const quarterTurn = isQuarterTurnRotation(rotation);
  const crop = calculateMaxCenteredCrop({
    sourceWidth,
    sourceHeight,
    proportion: quarterTurn
      ? invertDisplayProportion(proportion)
      : proportion,
  });

  return quarterTurn
    ? { width: crop.cropHeight, height: crop.cropWidth }
    : { width: crop.cropWidth, height: crop.cropHeight };
};
