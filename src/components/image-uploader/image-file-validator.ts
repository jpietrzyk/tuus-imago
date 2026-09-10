import { type ImageValidationRules } from "./image-validation-rules";
import { loadImageDimensions } from "./load-image-dimensions";

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

  // Printability (DPI) is intentionally NOT checked at selection time: any
  // decodable image may enter the editor, where per-size availability and the
  // unprintable-photo notice communicate what (if anything) can be printed.

  return { violations, dimensions };
}
