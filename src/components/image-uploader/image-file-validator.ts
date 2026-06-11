import { calculateEffectiveDpi } from "./image-dpi-calculator";
import {
  DEFAULT_PAINTING_SIZE_INDEX,
  getPaintingSizeOptions,
} from "./painting-size";
import { type ImageValidationRules } from "./image-validation-rules";
import { loadImageDimensions } from "./load-image-dimensions";

const REFERENCE_PRINT_SIZE =
  getPaintingSizeOptions("rectangular").find(
    (option) => option.key === DEFAULT_PAINTING_SIZE_INDEX,
  ) ?? getPaintingSizeOptions("rectangular")[0];

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

  if (dimensions.width < rules.minWidth) {
    violations.push({
      rule: "minWidth",
      messageKey: "upload.validation.minWidth",
      params: { minWidth: rules.minWidth, actualWidth: dimensions.width },
    });
  }

  if (dimensions.height < rules.minHeight) {
    violations.push({
      rule: "minHeight",
      messageKey: "upload.validation.minHeight",
      params: { minHeight: rules.minHeight, actualHeight: dimensions.height },
    });
  }

  if (violations.length > 0) {
    return { violations, dimensions };
  }

  const { dpi } = calculateEffectiveDpi(
    dimensions.width,
    dimensions.height,
    REFERENCE_PRINT_SIZE.widthCm,
    REFERENCE_PRINT_SIZE.heightCm,
  );

  if (dpi < rules.minDpi) {
    violations.push({
      rule: "minDpi",
      messageKey: "upload.validation.minDpi",
      params: { minDpi: rules.minDpi, actualDpi: dpi },
    });
  }

  return { violations, dimensions };
}
