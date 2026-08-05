import { calculateOrientationMatchedDpi } from "./image-dpi-calculator";
import { IMAGE_DPI_RULES } from "./image-dpi-rules";
import {
  DEFAULT_PAINTING_SIZE_INDEX,
  getPaintingSizeOptions,
  type PaintingShape,
  type PaintingSizeOption,
} from "./painting-size";
import { getOptimalDisplayProportion } from "./image-proportion-calculator";
import { type ImageValidationRules } from "./image-validation-rules";
import { loadImageDimensions } from "./load-image-dimensions";

function resolveReferencePrintSize(
  width: number,
  height: number,
): PaintingSizeOption {
  const optimalProportion = getOptimalDisplayProportion(width, height);
  const shape: PaintingShape =
    optimalProportion === "square" ? "square" : "rectangular";
  const options = getPaintingSizeOptions(shape);
  return (
    options.find((option) => option.key === DEFAULT_PAINTING_SIZE_INDEX) ??
    options[0]
  );
}

export interface ImageValidationViolation {
  rule: string;
  messageKey: string;
  params: Record<string, string | number>;
}

export async function validateImageFile(
  file: File,
  rules: ImageValidationRules,
): Promise<{
  violations: ImageValidationViolation[];
  dimensions: { width: number; height: number } | null;
}> {
  const violations: ImageValidationViolation[] = [];

  if (!rules.acceptedMimeTypes.includes(file.type as typeof rules.acceptedMimeTypes[number])) {
    violations.push({
      rule: "invalidType",
      messageKey: "upload.validation.invalidType",
      params: {},
    });
    return { violations, dimensions: null };
  }

  if (file.size > rules.maxFileSizeBytes) {
    violations.push({
      rule: "maxFileSize",
      messageKey: "upload.validation.maxFileSize",
      params: { maxSizeMB: rules.maxFileSizeBytes / (1024 * 1024) },
    });
    return { violations, dimensions: null };
  }

  let dimensions: { width: number; height: number };
  try {
    dimensions = await loadImageDimensions(file);
  } catch {
    violations.push({
      rule: "invalidImage",
      messageKey: "upload.validation.invalidImage",
      params: {},
    });
    return { violations, dimensions: null };
  }

  if (IMAGE_DPI_RULES.guardEnabled) {
    const referencePrintSize = resolveReferencePrintSize(
      dimensions.width,
      dimensions.height,
    );
    const { dpi } = calculateOrientationMatchedDpi(
      dimensions.width,
      dimensions.height,
      referencePrintSize.widthCm,
      referencePrintSize.heightCm,
    );

    if (dpi < IMAGE_DPI_RULES.minDpi) {
      violations.push({
        rule: "minDpi",
        messageKey: "upload.validation.minDpi",
        params: { minDpi: IMAGE_DPI_RULES.minDpi, actualDpi: dpi },
      });
    }
  }

  return { violations, dimensions };
}
