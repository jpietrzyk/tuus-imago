const DEFAULT_MIN_DPI = 72;

export const DEFAULT_DPI_THRESHOLD = DEFAULT_MIN_DPI;

export const DEFAULT_QUALITY_THRESHOLDS = {
  excellent: 300,
  good: 150,
  acceptable: 72,
} as const;

export type QualityThresholds = {
  excellent: number;
  good: number;
  acceptable: number;
};

export const IMAGE_DPI_RULES: ImageDpiRules = {
  minDpi: DEFAULT_MIN_DPI,
  qualityThresholds: { ...DEFAULT_QUALITY_THRESHOLDS },
};

export function applyDpiRulesOverride(override: {
  minDpi?: number;
  qualityThresholds?: QualityThresholds;
}): void {
  if (override.minDpi !== undefined) {
    IMAGE_DPI_RULES.minDpi = override.minDpi;
  }
  if (override.qualityThresholds) {
    IMAGE_DPI_RULES.qualityThresholds.excellent =
      override.qualityThresholds.excellent;
    IMAGE_DPI_RULES.qualityThresholds.good = override.qualityThresholds.good;
    IMAGE_DPI_RULES.qualityThresholds.acceptable =
      override.qualityThresholds.acceptable;
  }
}

export function resetDpiRules(): void {
  IMAGE_DPI_RULES.minDpi = DEFAULT_MIN_DPI;
  IMAGE_DPI_RULES.qualityThresholds.excellent =
    DEFAULT_QUALITY_THRESHOLDS.excellent;
  IMAGE_DPI_RULES.qualityThresholds.good = DEFAULT_QUALITY_THRESHOLDS.good;
  IMAGE_DPI_RULES.qualityThresholds.acceptable =
    DEFAULT_QUALITY_THRESHOLDS.acceptable;
}

export interface ImageDpiRules {
  minDpi: number;
  qualityThresholds: QualityThresholds;
}
