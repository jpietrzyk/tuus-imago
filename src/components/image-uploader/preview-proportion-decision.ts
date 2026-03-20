import {
  getOptimalDisplayProportion,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

interface ResolvePreviewProportionDecisionArgs {
  sourceWidth: number;
  sourceHeight: number;
  selectedImageMetadata: SelectedImageMetadata | null;
  allowAutoSelectOptimalProportion?: boolean;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
}

export const resolvePreviewProportionDecision = ({
  sourceWidth,
  sourceHeight,
  selectedImageMetadata,
  allowAutoSelectOptimalProportion = true,
  bestProportion,
  userSelectedProportion,
}: ResolvePreviewProportionDecisionArgs) => {
  const optimalDisplayProportion =
    bestProportion ?? getOptimalDisplayProportion(sourceWidth, sourceHeight);
  const shouldAutoSelectOptimalProportion =
    allowAutoSelectOptimalProportion &&
    !selectedImageMetadata &&
    userSelectedProportion === "horizontal";

  const nextDisplayImageProportion = shouldAutoSelectOptimalProportion
    ? optimalDisplayProportion
    : userSelectedProportion;

  return {
    nextDisplayImageProportion,
    shouldAutoSelectOptimalProportion,
  };
};
