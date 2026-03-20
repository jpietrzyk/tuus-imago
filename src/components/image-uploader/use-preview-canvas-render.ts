import { useEffect } from "react";
import {
  drawCroppedImageToCanvas,
  loadImageElement,
  resolveImageDimensions,
} from "./preview-canvas-utils";
import { buildPreviewRenderPlan } from "./preview-render-plan";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface UsePreviewCanvasRenderArgs {
  previewUrl: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  latestRenderConfigRef: React.MutableRefObject<{
    selectedImageMetadata: SelectedImageMetadata | null;
    bestProportion: ImageDisplayProportion | null;
    userSelectedProportion: ImageDisplayProportion;
  }>;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

export const usePreviewCanvasRender = ({
  previewUrl,
  canvasRef,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  latestRenderConfigRef,
  onMetadataResolved,
}: UsePreviewCanvasRenderArgs) => {
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!previewUrl || !canvas) {
      return;
    }

    let isActive = true;

    const renderPreview = async () => {
      try {
        const image = await loadImageElement(previewUrl);
        if (!isActive) {
          return;
        }

        const { sourceWidth, sourceHeight } = resolveImageDimensions(image);

        if (sourceWidth <= 0 || sourceHeight <= 0) {
          return;
        }

        const {
          selectedImageMetadata,
          bestProportion,
          userSelectedProportion,
        } = latestRenderConfigRef.current;

        const {
          metadata,
          crop,
          nextDisplayImageProportion,
          shouldAutoSelectOptimalProportion,
        } = buildPreviewRenderPlan({
          sourceWidth,
          sourceHeight,
          selectedImageMetadata,
          bestProportion,
          userSelectedProportion,
        });

        onMetadataResolved({
          metadata,
          nextDisplayImageProportion,
          shouldAutoSelectOptimalProportion,
        });

        drawCroppedImageToCanvas({
          canvas,
          image,
          crop,
        });
      } catch {
        // Ignore image loading errors in preview; uploader handles validation earlier.
      }
    };

    void renderPreview();

    return () => {
      isActive = false;
    };
  }, [
    bestProportion,
    canvasRef,
    latestRenderConfigRef,
    onMetadataResolved,
    previewUrl,
    userSelectedProportion,
       selectedImageMetadata,
  ]);
};
