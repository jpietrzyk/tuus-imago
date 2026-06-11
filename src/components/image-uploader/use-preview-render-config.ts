import { useEffect, useRef } from "react";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";
import type { PreviewTransform } from "./preview-canvas-utils";

interface PreviewRenderConfig {
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
  previewTransform: PreviewTransform | null;
  previewCropAdjust?: CropAdjust;
}

export const usePreviewRenderConfig = ({
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  previewTransform,
  previewCropAdjust,
}: PreviewRenderConfig) => {
  const latestRenderConfigRef = useRef<PreviewRenderConfig>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects,
    previewTransform,
    previewCropAdjust,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
      previewEffects,
      previewTransform,
      previewCropAdjust,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion, previewEffects, previewTransform, previewCropAdjust]);

  return latestRenderConfigRef;
};
