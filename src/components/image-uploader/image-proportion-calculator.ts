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

export const getTargetAspectRatio = (
  proportion: ImageDisplayProportion,
): number => {
  switch (proportion) {
    case "vertical":
      return 2 / 3;
    case "square":
    case "rectangle":
      return 1;
    case "horizontal":
    default:
      return 16 / 9;
  }
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
