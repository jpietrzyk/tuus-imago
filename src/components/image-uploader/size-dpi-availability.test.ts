import { describe, it, expect, afterEach } from "vitest";
import {
  computeSizesDpiAvailability,
  resolveRecommendedPaintingSize,
} from "./size-dpi-availability";
import { applyDpiRulesOverride, resetDpiRules } from "./image-dpi-rules";
import type { DpiQuality } from "./image-dpi-calculator";
import type { PaintingSizeIndex } from "./painting-size";

const size = (
  sizeIndex: PaintingSizeIndex,
  dpi: number,
  quality: DpiQuality,
  isAvailable: boolean,
) => ({ sizeIndex, dpi, quality, isAvailable });

afterEach(() => {
  resetDpiRules();
});

describe("resolveRecommendedPaintingSize", () => {
  it("returns the biggest size that meets the minimum DPI", () => {
    const sizes = [
      size(0, 300, "excellent", true),
      size(1, 200, "good", true),
      size(2, 100, "acceptable", true),
      size(3, 60, "low", false),
      size(4, 40, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(2);
  });

  it("returns the smallest size when no size meets the minimum DPI", () => {
    const sizes = [
      size(0, 60, "low", false),
      size(1, 40, "low", false),
      size(2, 20, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(0);
  });

  it("honors a raised minimum DPI threshold", () => {
    applyDpiRulesOverride({ minDpi: 150 });

    const sizes = [
      size(0, 300, "excellent", true),
      size(1, 200, "good", true),
      size(2, 100, "acceptable", true),
      size(3, 60, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(1);
  });
});

describe("recommended default derived from DPI availability", () => {
  it("recommends the smallest size for a low-resolution image when the guard is off", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    const sizes = computeSizesDpiAvailability(1000, 700, "rectangular");

    expect(resolveRecommendedPaintingSize(sizes)).toBe(0);
  });

  it("recommends the biggest acceptable size for a high-resolution image", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    const sizes = computeSizesDpiAvailability(6000, 4000, "rectangular");

    expect(resolveRecommendedPaintingSize(sizes)).toBe(4);
  });
});
