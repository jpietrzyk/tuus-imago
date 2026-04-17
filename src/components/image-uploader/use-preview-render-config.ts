import { useEffect, useRef } from "react";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";

interface PreviewRenderConfig {
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
  previewCropAdjust?: CropAdjust;
}

export const usePreviewRenderConfig = ({
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  previewCropAdjust,
}: PreviewRenderConfig) => {
  const latestRenderConfigRef = useRef<PreviewRenderConfig>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects,
    previewCropAdjust,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
      previewEffects,
      previewCropAdjust,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion, previewEffects, previewCropAdjust]);

  return latestRenderConfigRef;
};
