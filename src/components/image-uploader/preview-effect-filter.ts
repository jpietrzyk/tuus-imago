import type { SelectedImageItem } from "./image-uploader";

/**
 * Build a CSS `filter` string for the local (pre-upload) preview based on an
 * image's brightness/contrast effects. Cloud previews already encode effects,
 * so no filter is applied in that case.
 */
export const buildPreviewEffectFilter = (
  image: SelectedImageItem | null,
  useCloudPreview: boolean,
): string | undefined => {
  if (!image || !image.previewEffects || useCloudPreview) {
    return undefined;
  }

  const { brightness, contrast } = image.previewEffects;

  if (brightness === 0 && contrast === 0) {
    return undefined;
  }

  const brightnessFactor = 1 + brightness / 100;
  const contrastFactor = 1 + contrast / 100;

  const clampedBrightness = Math.max(0, Math.min(2, brightnessFactor));
  const clampedContrast = Math.max(0, Math.min(2, contrastFactor));

  return `brightness(${clampedBrightness}) contrast(${clampedContrast})`;
};
