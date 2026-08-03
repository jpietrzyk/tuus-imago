const DEFAULT_MIN_DPI = 72;

export const DEFAULT_DPI_THRESHOLD = DEFAULT_MIN_DPI;

export const IMAGE_DPI_RULES: ImageDpiRules = {
  minDpi: DEFAULT_MIN_DPI,
  qualityThresholds: {
    excellent: 300,
    good: 150,
    acceptable: 72,
  },
};

export function applyDpiRulesOverride(override: { minDpi: number }): void {
  IMAGE_DPI_RULES.minDpi = override.minDpi;
}

export function resetDpiRules(): void {
  IMAGE_DPI_RULES.minDpi = DEFAULT_MIN_DPI;
}

export interface ImageDpiRules {
  minDpi: number;
  qualityThresholds: {
    excellent: number;
    good: number;
    acceptable: number;
  };
}
