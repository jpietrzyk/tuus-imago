import { useEffect, useRef } from "react";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";
import type { PreviewTransform } from "./preview-canvas-utils";

interface PreviewRenderConfig {
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: {
    brightness: number;
    contrast: number;
    grayscale?: number;
  } | null;
  previewTransform: PreviewTransform | null;
  previewCropAdjust?: CropAdjust;
  /** When set, the slot is a seamless wide-panorama triptych window. */
  triptychWindowIndex?: number;
}

export const usePreviewRenderConfig = ({
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  previewTransform,
  previewCropAdjust,
  triptychWindowIndex,
}: PreviewRenderConfig) => {
  const latestRenderConfigRef = useRef<PreviewRenderConfig>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects,
    previewTransform,
    previewCropAdjust,
    triptychWindowIndex,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
      previewEffects,
      previewTransform,
      previewCropAdjust,
      triptychWindowIndex,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion, previewEffects, previewTransform, previewCropAdjust, triptychWindowIndex]);

  return latestRenderConfigRef;
};
