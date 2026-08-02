export const IMAGE_DPI_RULES = {
  minDpi: 72,
  qualityThresholds: {
    excellent: 300,
    good: 150,
    acceptable: 72,
  },
} as const;

export interface ImageDpiRules {
  readonly minDpi: number;
  readonly qualityThresholds: {
    readonly excellent: number;
    readonly good: number;
    readonly acceptable: number;
  };
}
