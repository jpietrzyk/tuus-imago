import { getPaintingSizeOptions } from "./painting-size";

export type ImageDisplayProportion =
  | "horizontal"
  | "vertical"
  | "square"
  | "rectangle";

interface CropCalculationInput {
  sourceWidth: number;
  sourceHeight: number;
  proportion: ImageDisplayProportion;
}

export interface CropCalculationResult {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  outputWidth: number;
  outputHeight: number;
  sourceArea: number;
  cropArea: number;
  coverageRatio: number;
  coveragePercent: number;
  widthScale: number;
  heightScale: number;
}

const greatestCommonDivisor = (a: number, b: number): number => {
  if (!b) {
    return a;
  }

  return greatestCommonDivisor(b, a % b);
};

export const formatAspectRatio = (width: number, height: number): string => {
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const [rectangularBaseSize] = getPaintingSizeOptions("rectangular");
const RECTANGULAR_ASPECT_RATIO =
  rectangularBaseSize.widthCm / rectangularBaseSize.heightCm;

export const getTargetAspectRatio = (
  proportion: ImageDisplayProportion,
): number => {
  switch (proportion) {
    case "vertical":
      return 1 / RECTANGULAR_ASPECT_RATIO;
    case "square":
    case "rectangle":
      return 1;
    case "horizontal":
    default:
      return RECTANGULAR_ASPECT_RATIO;
  }
};

export const getFrameAspectRatioClassName = (
  proportion: ImageDisplayProportion,
): string => {
  switch (proportion) {
    case "vertical":
      return "aspect-[2/3]";
    case "horizontal":
      return "aspect-[3/2]";
    case "square":
    case "rectangle":
    default:
      return "aspect-square";
  }
};

/**
 * Swap horizontal/vertical proportions. Used when a 90°/270° rotation flips the
 * on-screen axes: the crop that fills the frame after rotation must be selected
 * against the inverse frame aspect. square/rectangle are unchanged.
 */
export const invertDisplayProportion = (
  proportion: ImageDisplayProportion,
): ImageDisplayProportion => {
  if (proportion === "horizontal") {
    return "vertical";
  }
  if (proportion === "vertical") {
    return "horizontal";
  }
  return proportion;
};

export const calculateMaxCenteredCrop = ({
  sourceWidth,
  sourceHeight,
  proportion,
}: CropCalculationInput): CropCalculationResult => {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const sourceArea = safeWidth * safeHeight;

  const targetAspectRatio = getTargetAspectRatio(proportion);
  const sourceAspectRatio = safeWidth / safeHeight;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = safeWidth;
  let cropHeight = safeHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    cropWidth = safeHeight * targetAspectRatio;
    cropX = (safeWidth - cropWidth) / 2;
  } else if (sourceAspectRatio < targetAspectRatio) {
    cropHeight = safeWidth / targetAspectRatio;
    cropY = (safeHeight - cropHeight) / 2;
  }

  const outputWidth = Math.max(1, Math.round(cropWidth));
  const outputHeight = Math.max(1, Math.round(cropHeight));
  const cropArea = cropWidth * cropHeight;
  const coverageRatio = cropArea / sourceArea;

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    outputWidth,
    outputHeight,
    sourceArea,
    cropArea,
    coverageRatio,
    coveragePercent: Math.round(coverageRatio * 10000) / 100,
    widthScale: cropWidth / safeWidth,
    heightScale: cropHeight / safeHeight,
  };
};

export const calculateAllProportions = (
  sourceWidth: number,
  sourceHeight: number,
): Record<"horizontal" | "vertical" | "square", CropCalculationResult> => {
  return {
    horizontal: calculateMaxCenteredCrop({
      sourceWidth,
      sourceHeight,
      proportion: "horizontal",
    }),
    vertical: calculateMaxCenteredCrop({
      sourceWidth,
      sourceHeight,
      proportion: "vertical",
    }),
    square: calculateMaxCenteredCrop({
      sourceWidth,
      sourceHeight,
      proportion: "square",
    }),
  };
};

export const getOptimalDisplayProportion = (
  sourceWidth: number,
  sourceHeight: number,
): ImageDisplayProportion => {
  const proportions = calculateAllProportions(sourceWidth, sourceHeight);
  const orderedCandidates = ["horizontal", "vertical", "square"] as const;
  type CandidateProportion = (typeof orderedCandidates)[number];

  return orderedCandidates.reduce<CandidateProportion>(
    (bestProportion, candidate) => {
      const bestCoverage = proportions[bestProportion].coveragePercent;
      const candidateCoverage = proportions[candidate].coveragePercent;

      return candidateCoverage > bestCoverage ? candidate : bestProportion;
    },
    "horizontal",
  );
};
