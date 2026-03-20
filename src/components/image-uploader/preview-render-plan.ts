import { calculateMaxCenteredCrop } from "./image-proportion-calculator";
import { buildPreviewImageMetadata } from "./preview-image-metadata";
import { resolvePreviewProportionDecision } from "./preview-proportion-decision";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface BuildPreviewRenderPlanArgs {
  sourceWidth: number;
  sourceHeight: number;
  selectedImageMetadata: SelectedImageMetadata | null;
  allowAutoSelectOptimalProportion?: boolean;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
}

export const buildPreviewRenderPlan = ({
  sourceWidth,
  sourceHeight,
  selectedImageMetadata,
  allowAutoSelectOptimalProportion = true,
  bestProportion,
  userSelectedProportion,
}: BuildPreviewRenderPlanArgs) => {
  const metadata = buildPreviewImageMetadata({
    sourceWidth,
    sourceHeight,
  });

  const {
    nextDisplayImageProportion,
    shouldAutoSelectOptimalProportion,
  } = resolvePreviewProportionDecision({
    sourceWidth,
    sourceHeight,
    selectedImageMetadata,
    allowAutoSelectOptimalProportion,
    bestProportion,
    userSelectedProportion,
  });

  const crop = calculateMaxCenteredCrop({
    sourceWidth,
    sourceHeight,
    proportion: nextDisplayImageProportion,
  });

  return {
    metadata,
    nextDisplayImageProportion,
    shouldAutoSelectOptimalProportion,
    crop,
  };
};
