import { useEffect, useRef } from "react";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface PreviewRenderConfig {
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
}

export const usePreviewRenderConfig = ({
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewEffects,
}: PreviewRenderConfig) => {
  const latestRenderConfigRef = useRef<PreviewRenderConfig>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
      previewEffects,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion, previewEffects]);

  return latestRenderConfigRef;
};
