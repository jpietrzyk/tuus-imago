export const IMAGE_VALIDATION_RULES = {
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxSelectedImages: 3,
  minWidth: 2552,
  minHeight: 1701,
} as const;

export interface ImageValidationRules {
  readonly acceptedMimeTypes: typeof IMAGE_VALIDATION_RULES.acceptedMimeTypes;
  readonly maxFileSizeBytes: number;
  readonly maxSelectedImages: number;
  readonly minWidth: number;
  readonly minHeight: number;
}
