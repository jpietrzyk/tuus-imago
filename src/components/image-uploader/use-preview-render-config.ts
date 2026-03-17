import { useEffect, useRef } from "react";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface PreviewRenderConfig {
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
}

export const usePreviewRenderConfig = ({
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
}: PreviewRenderConfig) => {
  const latestRenderConfigRef = useRef<PreviewRenderConfig>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion]);

  return latestRenderConfigRef;
};
