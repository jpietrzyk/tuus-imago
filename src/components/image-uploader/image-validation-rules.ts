export const IMAGE_VALIDATION_RULES = {
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxSelectedImages: 3,
  minWidth: 800,
  minHeight: 600,
  minDpi: 150,
} as const;

export type ImageValidationRules = typeof IMAGE_VALIDATION_RULES;
